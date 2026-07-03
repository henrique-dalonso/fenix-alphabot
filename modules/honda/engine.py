"""
modules/honda/engine.py — Motor Honda v5.

Arquitetura corrigida: engine é uma Thread persistente.
- Playwright roda SEMPRE na mesma thread (requisito do sync API).
- Browser abre uma vez e fica aberto entre sessões (STOP não fecha).
- Play/Stop são eventos de sinalização, não criam novas threads.
- Quit (fechar app) fecha o browser e encerra a thread.
"""

import re
import time
import json
import os
import threading
import subprocess
import ctypes
from typing import Optional, Callable

from playwright.sync_api import Page, BrowserContext, sync_playwright

from config import settings
from core.browser import OperacaoCancelada
from core.recovery import RecoveryManager
from core.logger import logger
from extraction.pdf_text import baixar_e_extrair_texto, ERRO_PDF
from extraction.parsers import honda as parser_honda


_MB_YESNO       = 0x04
_MB_ICONWARNING = 0x30
_IDYES = 6

def _messagebox(titulo: str, mensagem: str) -> bool:
    try:
        return ctypes.windll.user32.MessageBoxW(
            0, mensagem, titulo, _MB_YESNO | _MB_ICONWARNING
        ) == _IDYES
    except Exception:
        return True


class HondaEngine(threading.Thread):
    """
    Thread persistente do engine Honda.

    Ciclo de vida:
        __init__ → start() [app inicia]
            → dorme esperando play_event
        play(callbacks) → acorda → processa casos → dorme
        stop()          → pausa (browser fica aberto)
        quit()          → encerra thread e fecha browser
    """

    def __init__(self):
        super().__init__(daemon=True, name="HondaEngineThread")
        self._play_ev  = threading.Event()
        self._stop_ev  = threading.Event()
        self._quit_ev  = threading.Event()
        self._callbacks: dict = {}
        self._recovery: Optional[RecoveryManager] = None
        self._inicio_caso: Optional[float] = None
        self.casos_processados = 0
        self._pdf_miss_count = 0  # controla mensagem de "sem casos"
        self._pw = None
        self._context: Optional[BrowserContext] = None
        self._page: Optional[Page] = None

    # -----------------------------------------------------------
    # API para a UI
    # -----------------------------------------------------------
    def play(self, callbacks: dict):
        self._callbacks = callbacks
        self._stop_ev.clear()
        self._play_ev.set()

    def stop(self):
        self._stop_ev.set()

    def quit(self):
        """Chamado ao fechar o app — encerra thread e fecha browser."""
        self._quit_ev.set()
        self._stop_ev.set()
        self._play_ev.set()  # desbloqueia o wait

    @property
    def rodando(self) -> bool:
        return self._play_ev.is_set() and not self._stop_ev.is_set()

    # -----------------------------------------------------------
    # Thread principal
    # -----------------------------------------------------------
    def run(self):
        """Roda para sempre até quit(). Playwright vive aqui."""
        pw = sync_playwright().start()
        self._pw = pw

        try:
            while not self._quit_ev.is_set():
                self._play_ev.wait()        # dorme até play()
                if self._quit_ev.is_set():
                    break
                self._stop_ev.clear()

                try:
                    self._sessao(pw)
                except Exception as e:
                    logger.erro(f"Erro na sessão: {e}")
                    self._fechar_browser()
                finally:
                    self._play_ev.clear()
                    self._atualizar("on_status", "parado")
        finally:
            self._fechar_browser()
            try:
                pw.stop()
            except Exception:
                pass

    # -----------------------------------------------------------
    # Sessão (uma execução Play → Stop)
    # -----------------------------------------------------------
    def _sessao(self, pw):
        logger.info("Honda iniciando...")
        self._atualizar("on_status", "iniciando")

        edge_path = next(
            (c for c in settings.EDGE_CAMINHOS if os.path.exists(c)), None
        )
        if not edge_path:
            logger.erro("Edge não encontrado.")
            return

        if self._context is None and self._edge_ja_aberto():
            confirmado = _messagebox(
                "Fênix — Edge detectado",
                "Processos do Microsoft Edge foram detectados.\n\n"
                "Deseja encerrá-los para continuar?"
            )
            if not confirmado:
                logger.info("Operação cancelada.")
                return
            self._matar_processos_edge()

        if not self._garantir_browser(pw, edge_path):
            return

        self._recovery = RecoveryManager(self._stop_ev, modulo="HONDA")

        _aceitar = lambda d: d.accept()
        self._page.on("dialog", _aceitar)
        logger.info("Navegando para o login...")
        self._navegar_seguro(self._page, settings.LOGIN_URL)
        if not self._fazer_login(self._page):
            return
        try:
            self._page.remove_listener("dialog", _aceitar)
        except Exception:
            pass
        self._page.on("dialog", self._recovery.criar_handler_dialog("Honda"))

        logger.info("Navegando para a rotina da LUNA...")
        self._navegar_seguro(self._page, settings.ROTINA_LUNA_URL)
        self._aguardar(1_500)

        if not self._recovery._inicializar_luna(self._page):
            if not self._recovery.executar(self._page, "falha na inicialização"):
                return

        logger.sucesso("LUNA pronta. Iniciando processamento...")

        while not self._stop_ev.is_set() and not self._quit_ev.is_set():
            self._processar_um_caso(self._page)

        logger.info("Honda encerrada. Edge permanece aberto.")

    # -----------------------------------------------------------
    # Browser
    # -----------------------------------------------------------
    def _garantir_browser(self, pw, edge_path: str) -> bool:
        if self._context is not None:
            try:
                _ = self._context.pages
                logger.info("Reutilizando Edge já aberto.")
                self._page = self._consolidar_aba(self._context)
                return self._page is not None
            except Exception:
                # O processo antigo pode ter travado sem liberar o lock do
                # profile. Se não matarmos ele aqui, o próximo launch_persistent_context
                # some no singleton do Edge: o Edge novo só abre uma aba
                # about:blank no processo zumbi e fecha, e o Playwright recebe
                # "Target page, context or browser has been closed".
                logger.info("Browser anterior não responde. Encerrando processos residuais...")
                self._context = None
                self._page = None
                self._matar_processos_edge()

        logger.info("Abrindo Edge...")
        self._context = self._lancar_context(pw, edge_path)
        if self._context is None:
            return False

        self._page = self._consolidar_aba(self._context)
        return self._page is not None

    def _lancar_context(self, pw, edge_path: str, tentar_de_novo: bool = True) -> Optional[BrowserContext]:
        try:
            return pw.chromium.launch_persistent_context(
                user_data_dir=settings.DIR_PERFIL_EDGE,
                executable_path=edge_path,
                channel="msedge",
                headless=False,
                args=[
                    "--start-maximized",
                    "--disable-blink-features=AutomationControlled",
                    "--disable-infobars",
                    "--no-first-run",
                    "--no-default-browser-check",
                    "--test-type=gpu",
                ],
                no_viewport=True,
                locale="pt-BR",
            )
        except Exception as e:
            if tentar_de_novo:
                logger.aviso(f"Falha ao abrir o Edge ({e}). Encerrando processos residuais e tentando de novo...")
                self._matar_processos_edge()
                return self._lancar_context(pw, edge_path, tentar_de_novo=False)
            logger.erro(f"Não foi possível abrir o Edge: {e}")
            return None

    def _consolidar_aba(self, context: BrowserContext) -> Optional[Page]:
        abas = context.pages
        if not abas:
            return context.new_page()
        aba = next((a for a in abas if "paschoalotto" in (a.url or "")), abas[0])
        for a in abas:
            if a != aba:
                try:
                    a.close()
                except Exception:
                    pass
        return aba

    def _fechar_browser(self):
        try:
            if self._context:
                self._context.close()
        except Exception:
            pass
        self._context = None
        self._page = None

    # -----------------------------------------------------------
    # Login
    # -----------------------------------------------------------
    def _fazer_login(self, page: Page) -> bool:
        url = ""
        try:
            url = page.url or ""
        except Exception:
            pass

        if "gelogin" not in url and "login" not in url.lower():
            logger.info("Sessão ativa, login não necessário.")
            return True

        creds = self._carregar_credenciais()
        if creds and self._preencher_login(page, creds):
            logger.info("Auto-login realizado.")
            try:
                page.wait_for_url(
                    lambda u: "gelogin" not in u and "login" not in u.lower(),
                    timeout=15_000
                )
                page.wait_for_timeout(1_200)
                logger.sucesso("Login confirmado.")
                return True
            except Exception:
                logger.aviso("Auto-login não redirecionou. Aguardando login manual...")

        logger.info("Faça o login na janela do Edge — o Fênix continuará automaticamente.")
        try:
            page.wait_for_url(
                lambda u: "gelogin" not in u and "login" not in u.lower(),
                timeout=300_000
            )
            page.wait_for_timeout(1_200)
            logger.sucesso("Login detectado.")
            return True
        except Exception as e:
            if self._stop_ev.is_set():
                return False
            logger.erro(f"Timeout aguardando login: {e}")
            return False

    def _preencher_login(self, page: Page, creds: dict) -> bool:
        try:
            page.wait_for_timeout(1_000)
            ok = page.evaluate("""([usuario, senha, filial]) => {
                const campos = [
                    document.querySelector('input[name="usuario"]'),
                    document.querySelector('input[name="login"]'),
                    document.querySelector('input[name="user"]'),
                    document.querySelector('input[type="text"]'),
                ];
                const elUser = campos.find(el => el && el.offsetParent !== null);
                if (!elUser) return false;
                elUser.value = usuario;
                elUser.dispatchEvent(new Event('input', {bubbles: true}));
                const elSenha = document.querySelector('input[type="password"]');
                if (!elSenha) return false;
                elSenha.value = senha;
                elSenha.dispatchEvent(new Event('input', {bubbles: true}));
                if (filial) {
                    for (const sel of document.querySelectorAll('select')) {
                        for (const opt of sel.options) {
                            if (opt.text.trim().toUpperCase().includes(filial.toUpperCase())) {
                                sel.value = opt.value;
                                sel.dispatchEvent(new Event('change', {bubbles: true}));
                                break;
                            }
                        }
                    }
                }
                const btn = document.querySelector('button[type="submit"]')
                    || document.querySelector('input[value="Entrar"]')
                    || document.querySelector('button');
                if (!btn) return false;
                btn.click();
                return true;
            }""", [creds.get("usuario",""), creds.get("senha",""), creds.get("filial","")])
            return bool(ok)
        except Exception as e:
            logger.aviso(f"Auto-login falhou: {e}")
            return False

    def _carregar_credenciais(self) -> Optional[dict]:
        caminho = os.path.join(settings.DIR_DATA, "credentials.json")
        try:
            if os.path.exists(caminho):
                with open(caminho, "r", encoding="utf-8") as f:
                    return json.load(f)
        except Exception:
            pass
        return None

    # -----------------------------------------------------------
    # Processamento de um caso
    # -----------------------------------------------------------
    def _processar_um_caso(self, page: Page):
        self._inicio_caso = time.time()
        self._recovery.limpar_flags()

        try:
            if self._fila_vazia(page):
                if self._pdf_miss_count == 0:
                    logger.aviso("Nenhum caso na fila Honda. Aguardando...")
                self._pdf_miss_count += 1
                self._aguardar(5_000)
                return

            self._pdf_miss_count = 0
            if self._sessao_expirou(page):
                logger.erro("Sessão expirada. Faça login novamente.")
                self._stop_ev.set()
                return

            self._recovery.aceitar_dialog_pendente(page)

            self._atualizar("on_status", "processando")

            if self._recovery.recovery_pendente:
                self._recovery.limpar_flags()
                if not self._recovery.executar(page, "dialog pendente"):
                    self._stop_ev.set()
                    return

            if not self._recovery._tela_ja_processada(page):
                if not self._recovery.executar(page, "tela não pronta"):
                    self._stop_ev.set()
                    return

            if self._watchdog(page):
                return

            self._atualizar("on_pdf", "buscando")
            onclick = self._encontrar_pdf_onclick(page)
            if not onclick:
                self._pdf_miss_count += 1
                if self._pdf_miss_count == 1:
                    logger.aviso("Nenhum caso encontrado na fila. Aguardando...")
                elif self._pdf_miss_count % 20 == 0:
                    logger.info(f"Ainda aguardando casos... ({self._pdf_miss_count} verificações)")
                self._aguardar(3_000)
                return

            self._pdf_miss_count = 0

            match = re.search(r"abrirPdf\('(.*?)'\)", onclick)
            if not match:
                logger.erro("URL do PDF não reconhecida.")
                return

            pdf_path = match.group(1)
            grupo_cota = self._extrair_grupo_cota(pdf_path)
            logger.info(f"GRUPO/COTA: {grupo_cota}")

            self._verificar_stop()
            if self._watchdog(page):
                return

            self._atualizar("on_pdf", "baixando")
            texto_pdf = baixar_e_extrair_texto(settings.BASE_URL + pdf_path)

            if texto_pdf == ERRO_PDF:
                self._gravar_marcacao(page, grupo_cota, "ERRO NO PDF")
                return
            if texto_pdf is None:
                self._gravar_marcacao(page, grupo_cota, "FALTANDO ENDERECO")
                return

            dados = parser_honda.extrair_dados(texto_pdf)
            if not dados:
                logger.erro("Dados não extraídos com segurança. Pausando.")
                self._stop_ev.set()
                return

            self._atualizar("on_pdf", "ok")
            logger.info(
                f"Dados: {dados['endereco']}, {dados['numero']} | "
                f"{dados['bairro']} | {dados['cidade']}/{dados['estado']} | {dados['cep']}"
            )

            self._verificar_stop()
            self._atualizar("on_campos", "preenchendo")
            if not self._preencher_campos(page, grupo_cota, dados):
                return

            self._atualizar("on_campos", "preenchidos")
            if self._watchdog(page):
                return

            if not self._validar_campos_na_tela(page, grupo_cota, dados):
                return

            self._atualizar("on_campos", "validados")
            self._atualizar("on_gravar", "gravando")

            resultado = self._clicar_gravar(page)

            if resultado is True:
                self.casos_processados += 1
                self._atualizar("on_gravar", "sucesso")
                logger.sucesso(f"Caso gravado. Total sessão: {self.casos_processados}\n")
            elif resultado == "RECOVERY":
                self._atualizar("on_gravar", "recovery")
                if not self._recovery.executar(page, "alerta pós-GRAVAR"):
                    self._stop_ev.set()
            else:
                logger.erro("Gravação falhou. Pausando.")
                self._stop_ev.set()

        except Exception as e:
            logger.erro(f"Erro inesperado: {e}")
            try:
                self._recovery.executar(page, f"erro: {e}")
            except Exception:
                pass
            self._aguardar(2_000)

    # -----------------------------------------------------------
    # Sessão expirada / fila vazia
    # -----------------------------------------------------------
    def _fila_vazia(self, page: Page) -> bool:
        """
        CORRIGIDO (bug 1): settings.LUNA_SELETORES["total"] já é o
        seletor completo 'input[name="total"]'. O código antigo
        envolvia isso de novo em f'input[name="{...}"]', gerando
        locator('input[name="input[name="total"]"]') — inválido,
        nunca encontrava o campo, e por isso a fila vazia nunca era
        detectada antes de tentar baixar o PDF (causa raiz do caso
        falso "ERRO NO PDF" sendo gravado com a fila zerada).
        """
        for frame in page.frames:
            try:
                loc = frame.locator(settings.LUNA_SELETORES["total"]).first
                if loc.count() > 0:
                    val = loc.input_value(timeout=2_000).strip()
                    return val == "0" or val == ""
            except Exception:
                continue
        return False

    def _sessao_expirou(self, page: Page) -> bool:
        try:
            url = page.url or ""
            if "gelogin" in url or ("login" in url.lower() and "paschoalotto" in url):
                return True
        except Exception:
            pass
        return False

    # -----------------------------------------------------------
    # PDF
    # -----------------------------------------------------------
    def _encontrar_pdf_onclick(self, page: Page) -> Optional[str]:
        for frame in page.frames:
            try:
                el = frame.locator(settings.LUNA_SELETORES["botao_pdf"]).first
                if el.count() > 0:
                    onclick = el.get_attribute("onclick")
                    if onclick:
                        return onclick
            except Exception:
                continue
        return None

    def _extrair_grupo_cota(self, pdf_path: str) -> str:
        m = re.search(r"lido_ok_(.*?)_CONTRATO", pdf_path, re.IGNORECASE)
        if not m:
            return ""
        return m.group(1).replace("_", " ")

    def _tratar_pdf_ausente(self, page: Page):
        try:
            for frame in page.frames:
                try:
                    texto = parser_honda.normalizar(
                        frame.inner_text("body", timeout=2_000) or ""
                    )
                    if "DOCUMENTO JA VERIFICADO" in texto or "JA FOI VERIFICADO" in texto:
                        self._recovery.executar(page, "documento já verificado")
                        return
                except Exception:
                    continue
        except Exception:
            pass
        logger.aviso("PDF não encontrado. Tentando no próximo ciclo.")

    # -----------------------------------------------------------
    # Preenchimento via JS
    # -----------------------------------------------------------
    def _preencher_campos(self, page: Page, grupo_cota: str, dados: dict) -> bool:
        self._verificar_stop()
        self._js_set(page, settings.LUNA_CAMPOS["nome"], "")
        self._js_set(page, settings.LUNA_CAMPOS["cpf_cnpj"], "")
        self._js_set(page, settings.LUNA_CAMPOS["grupo_cota"],
                     parser_honda.normalizar(grupo_cota, preservar_ponto=True))
        self._aguardar(800)

        numero = "S/N" if str(dados.get("numero","")).strip() == "0" else dados["numero"]

        mapa = {
            settings.LUNA_CAMPOS["cep"]:         dados["cep"],
            settings.LUNA_CAMPOS["estado"]:       dados["estado"],
            settings.LUNA_CAMPOS["cidade"]:       dados["cidade"],
            settings.LUNA_CAMPOS["bairro"]:       dados["bairro"],
            settings.LUNA_CAMPOS["endereco"]:     dados["endereco"],
            settings.LUNA_CAMPOS["numero"]:       numero,
            settings.LUNA_CAMPOS["complemento"]:  dados.get("complemento", ""),
        }

        for name, valor in mapa.items():
            if self._watchdog(page):
                return False
            self._verificar_stop()
            self._js_set(page, name, parser_honda.normalizar(valor))
            self._aguardar(100)

        return True

    def _js_set(self, page: Page, name: str, valor: str):
        for frame in page.frames:
            try:
                ok = frame.evaluate(
                    """([n, v]) => {
                        const el = document.querySelector('input[name="' + n + '"]');
                        if (!el) return false;
                        el.focus(); el.value = v;
                        el.dispatchEvent(new Event('input', {bubbles:true}));
                        el.dispatchEvent(new Event('change', {bubbles:true}));
                        return true;
                    }""", [name, valor]
                )
                if ok:
                    return
            except Exception:
                continue

    # -----------------------------------------------------------
    # Validação pré-GRAVAR
    # -----------------------------------------------------------
    def _validar_campos_na_tela(self, page: Page, grupo_cota: str, dados: dict) -> bool:
        numero = "S/N" if str(dados.get("numero","")).strip() == "0" else dados.get("numero","")
        esperados = {
            settings.LUNA_CAMPOS["grupo_cota"]: grupo_cota,
            settings.LUNA_CAMPOS["cep"]:        dados["cep"],
            settings.LUNA_CAMPOS["estado"]:     dados["estado"],
            settings.LUNA_CAMPOS["cidade"]:     dados["cidade"],
            settings.LUNA_CAMPOS["bairro"]:     dados["bairro"],
            settings.LUNA_CAMPOS["endereco"]:   dados["endereco"],
            settings.LUNA_CAMPOS["numero"]:     numero,
        }
        erros = []
        for campo, esperado in esperados.items():
            pp = campo == settings.LUNA_CAMPOS["grupo_cota"]
            valor_tela = self._ler_campo(page, campo)
            if valor_tela is None:
                erros.append(f"{campo}: não encontrado")
                continue
            nt = parser_honda.normalizar(valor_tela, preservar_ponto=pp)
            ne = parser_honda.normalizar(esperado, preservar_ponto=pp)
            if not nt:
                erros.append(f"{campo}: vazio")
            elif ne and nt != ne:
                erros.append(f"{campo}: tela='{nt}' esperado='{ne}'")

        if erros:
            logger.erro("Validação pré-GRAVAR FALHOU:")
            for e in erros:
                logger.erro(f"  - {e}")
            self._stop_ev.set()
            return False

        logger.info("Validação pré-GRAVAR aprovada.")
        return True

    def _ler_campo(self, page: Page, name: str) -> Optional[str]:
        for frame in page.frames:
            try:
                loc = frame.locator(f'input[name="{name}"]').first
                if loc.count() > 0:
                    return loc.input_value(timeout=3_000)
            except Exception:
                continue
        return None

    # -----------------------------------------------------------
    # Gravação
    # -----------------------------------------------------------
    def _clicar_gravar(self, page: Page):
        """
        Fiel ao AlphaBot: handler único local, .click() físico,
        confirmacao aceita e aguarda sucesso.
        Dialogs esperados:
          1. "Confirma a gravação..." → confirmacao → aceita e aguarda próximo
          2. "Dados gravados com sucesso" → sucesso → retorna True
        """
        alertas = []

        def on_dialog(dialog):
            try:
                tipo = self._recovery._classificar_dialog(dialog.message)
                if tipo == "recovery":
                    self._recovery._recovery_pendente = True
                logger.info(f"Alerta GRAVAR ({tipo}): {dialog.message[:80]}")
                dialog.accept()
                alertas.append((tipo, dialog.message))
            except Exception as e:
                err = str(e)
                if "already handled" not in err and "Cannot accept" not in err:
                    logger.erro(f"Erro no alerta de gravação: {e}")

        def avaliar() -> Optional[bool]:
            if any(t == "recovery" for t, _ in alertas):
                return "RECOVERY"
            if any(t in ("bloqueio", "sessao", "erro") for t, _ in alertas):
                return False
            if any(t == "sucesso" for t, _ in alertas):
                return True
            return None

        def aguardar_alerta(segundos) -> Optional[bool]:
            inicio = time.time()
            while time.time() - inicio < segundos:
                if self._stop_ev.is_set():
                    return False
                page.wait_for_timeout(200)
                r = avaliar()
                if r is not None:
                    return r
            return None

        try:
            botao = None
            for frame in page.frames:
                try:
                    loc = frame.locator(
                        'input[value="GRAVAR"], input[value="Gravar"], '
                        'input[onclick="jsGravarDados()"], input[id="botao"]'
                    ).first
                    if loc.count() > 0:
                        botao = loc
                        break
                except Exception:
                    continue

            if botao is None:
                logger.erro("Botão GRAVAR não encontrado.")
                return False

            page.on("dialog", on_dialog)
            botao.wait_for(state="visible", timeout=8_000)
            self._aguardar(250)
            self._verificar_stop()

            botao.click(force=True)
            logger.info("GRAVAR clicado.")

            resultado = aguardar_alerta(15)
            if resultado is not None:
                return resultado

            logger.aviso("Alerta pós-GRAVAR tardio. Tentando dialog pendente...")
            self._recovery.aceitar_dialog_pendente(page)
            resultado = aguardar_alerta(5)
            if resultado is not None:
                return resultado

            if not alertas:
                logger.info("Nenhum alerta após GRAVAR. Seguindo fluxo.")
                return True

            r = avaliar()
            return r if r is not None else False

        except Exception as e:
            logger.erro(f"Erro ao clicar em GRAVAR: {e}")
            return False
        finally:
            try:
                page.remove_listener("dialog", on_dialog)
            except Exception:
                pass

    # -----------------------------------------------------------
    # Marcações especiais
    # -----------------------------------------------------------
    def _gravar_marcacao(self, page: Page, grupo_cota: str, marcacao: str):
        self._js_set(page, settings.LUNA_CAMPOS["nome"], "")
        self._js_set(page, settings.LUNA_CAMPOS["cpf_cnpj"], "")
        self._js_set(page, settings.LUNA_CAMPOS["grupo_cota"],
                     parser_honda.normalizar(grupo_cota, preservar_ponto=True))
        self._js_set(page, settings.LUNA_CAMPOS["endereco"],
                     parser_honda.normalizar(marcacao))
        resultado = self._clicar_gravar(page)
        if resultado is True:
            self.casos_processados += 1
            logger.sucesso(f"Caso gravado como '{marcacao}'.")
        elif resultado == "RECOVERY":
            self._recovery.executar(page, f"recovery após {marcacao}")
        else:
            logger.erro(f"Falha ao gravar '{marcacao}'. Pausando.")
            self._stop_ev.set()

    # -----------------------------------------------------------
    # Utilitários
    # -----------------------------------------------------------
    def _watchdog(self, page: Page) -> bool:
        if not self._inicio_caso or not self._recovery:
            return False
        return self._recovery.tratar_watchdog(page, time.time() - self._inicio_caso)

    def _verificar_stop(self):
        if self._stop_ev.is_set():
            raise OperacaoCancelada("STOP.")

    def _aguardar(self, ms: int):
        fim = time.time() + ms / 1000
        while time.time() < fim:
            if self._stop_ev.is_set() or self._quit_ev.is_set():
                return
            time.sleep(0.05)

    def _atualizar(self, evento: str, valor: str):
        cb = self._callbacks.get(evento)
        if callable(cb):
            try:
                cb(valor)
            except Exception:
                pass

    def _navegar_seguro(self, page: Page, url: str):
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=20_000)
            page.wait_for_timeout(1_000)
        except Exception as e:
            logger.aviso(f"Aviso ao navegar: {e}")

    @staticmethod
    def _edge_ja_aberto() -> bool:
        try:
            saida = subprocess.check_output(
                ["tasklist", "/FI", "IMAGENAME eq msedge.exe", "/NH"],
                stderr=subprocess.DEVNULL, timeout=5,
            ).decode("utf-8", errors="ignore")
            return "msedge.exe" in saida.lower()
        except Exception:
            return False

    @staticmethod
    def _matar_processos_edge():
        logger.info("Encerrando processos do Edge...")
        subprocess.run(["taskkill", "/F", "/IM", "msedge.exe"], capture_output=True)
        time.sleep(2.0)
        logger.info("Processos encerrados.")
