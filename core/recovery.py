"""
core/recovery.py — Recovery e inicialização da LUNA.

Seletores confirmados inspecionando o HTML real da LUNA.
"""

import re
import unicodedata
import threading

from playwright.sync_api import Page

from config import settings
from core.logger import logger


class RecoveryManager:
    def __init__(self, stop_event: threading.Event, modulo: str = "HONDA"):
        self._stop = stop_event
        self.modulo = modulo
        self.total_recoveries = 0
        self._recovery_pendente = False
        self._sessao_bloqueada = False

    # -----------------------------------------------------------
    # API pública
    # -----------------------------------------------------------
    def executar(self, page: Page, motivo: str = "") -> bool:
        self.total_recoveries += 1
        logger.recovery(f"Recovery iniciado ({motivo}).")

        for tentativa in range(1, settings.MAX_TENTATIVAS_RECOVERY + 1):
            if self._stop.is_set():
                return False
            logger.recovery(f"Tentativa {tentativa}/{settings.MAX_TENTATIVAS_RECOVERY}...")

            try:
                page.goto(settings.ROTINA_LUNA_URL,
                          wait_until="domcontentloaded", timeout=20_000)
                page.wait_for_timeout(1_500)
            except Exception as e:
                logger.aviso(f"Recovery: erro ao navegar para rotina: {e}")
                self.aceitar_dialog_pendente(page)
                continue

            if self._sessao_bloqueada:
                logger.erro("Recovery: sessão bloqueada. Faça login novamente.")
                return False

            if self._inicializar_luna(page):
                logger.sucesso("Recovery concluído.")
                return True

        logger.erro("Recovery falhou 3 vezes. Parado para revisão manual.")
        return False

    def _inicializar_luna(self, page: Page) -> bool:
        """
        Fluxo completo de inicialização da LUNA:
        1. Aceita dialog inicial "Dados carregados com sucesso"
        2. Seleciona banco e tipo
        3. Aceita segundo dialog
        4. Clica seta direita → seta esquerda (força carregamento dos campos)
        5. Valida que os campos aparecerem
        """
        # 1. Aceita dialog inicial
        self.aceitar_dialog_pendente(page)
        self._aguardar(800)

        # 2. Seleciona banco e tipo
        if not self._selecionar_banco_tipo(page):
            return False

        # 3. Dialog pós-seleção já foi aceito pelo handler registrado na sessão
        self._aguardar(1_200)

        # 4. Seta direita → seta esquerda (força carregamento)
        return self._forcar_carregamento(page)

    def _selecionar_banco_tipo(self, page: Page) -> bool:
        cfg = settings.MODULOS_LUNA.get(self.modulo, {})
        banco_val = cfg.get("banco_value", "")
        tipo_val = cfg.get("tipo_value", "")

        # Seleciona banco via JS (sem mover mouse)
        ok_banco = self._js_select(page,
                                   settings.LUNA_SELETORES["banco"],
                                   banco_val)
        if not ok_banco:
            logger.erro("Banco não encontrado na LUNA.")
            return False

        # Aguarda dialog pós-banco e o select de tipo aparecer
        self._aguardar(1_500)

        # Retry: tipo pode demorar a aparecer após o dialog
        import time as _time
        ok_tipo = False
        inicio = _time.time()
        while _time.time() - inicio < 6:
            if self._stop.is_set():
                return False
            ok_tipo = self._js_select(page, settings.LUNA_SELETORES["tipo"], tipo_val)
            if ok_tipo:
                break
            _time.sleep(0.5)

        if not ok_tipo:
            logger.erro("Tipo de contrato não encontrado na LUNA.")
            return False

        self._aguardar(1_500)
        return True

    def _forcar_carregamento(self, page: Page) -> bool:
        logger.info("Forçando carregamento: seta direita → seta esquerda...")

        if not self._clicar_seta(page, "direita"):
            logger.erro("Seta direita não encontrada.")
            return False

        self._aguardar(2_000)
        self.aceitar_dialog_pendente(page)

        if not self._clicar_seta(page, "esquerda"):
            logger.erro("Seta esquerda não encontrada.")
            return False

        self._aguardar(2_500)
        self.aceitar_dialog_pendente(page)

        return self._tela_ja_processada(page)

    def _clicar_seta(self, page: Page, direcao: str) -> bool:
        seletores = settings.LUNA_SELETORES[f"seta_{direcao}"]

        # Tenta por seletor via JS (sem mover mouse)
        for frame in page.frames:
            for sel in seletores:
                try:
                    ok = frame.evaluate(f"""() => {{
                        const el = document.querySelector('{sel}');
                        if (!el) return false;
                        el.click();
                        return true;
                    }}""")
                    if ok:
                        return True
                except Exception:
                    continue

        # Fallback: coordenada relativa ao campo "ordem" (igual ao AlphaBot)
        offset_x = -13 if direcao == "direita" else -38
        try:
            for frame in page.frames:
                try:
                    loc = frame.locator(settings.LUNA_SELETORES["ordem"]).first
                    if loc.count() > 0:
                        box = loc.bounding_box(timeout=3_000)
                        if box:
                            page.mouse.click(
                                box["x"] + offset_x,
                                box["y"] + box["height"] / 2
                            )
                            logger.info(f"Seta {direcao} clicada por coordenada.")
                            return True
                except Exception:
                    continue
        except Exception as e:
            logger.aviso(f"Fallback seta {direcao} falhou: {e}")

        return False

    def _tela_ja_processada(self, page: Page) -> bool:
        """Verifica se os campos do formulário apareceram."""
        campos_check = [
            settings.LUNA_SELETORES["botao_pdf"],
            settings.LUNA_SELETORES["botao_gravar"],
        ]
        for frame in page.frames:
            try:
                encontrados = sum(
                    1 for sel in campos_check
                    if frame.locator(sel).count() > 0
                )
                if encontrados >= 1:
                    return True
            except Exception:
                continue
        return False

    def limpar_flags(self):
        self._recovery_pendente = False
        self._sessao_bloqueada = False

    def criar_handler_dialog(self, contexto: str = "LUNA"):
        def handler(dialog):
            try:
                tipo = self._classificar_dialog(dialog.message)
                if tipo == "recovery":
                    self._recovery_pendente = True
                elif tipo in ("sessao", "bloqueio"):
                    self._sessao_bloqueada = True
                logger.info(f"Dialog ({tipo}) em {contexto}: {dialog.message[:80]}")
                dialog.accept()
            except Exception as e:
                if "already handled" not in str(e):
                    logger.aviso(f"Erro ao tratar dialog: {e}")
        return handler

    def aceitar_dialog_pendente(self, page: Page) -> bool:
        try:
            sess = page.context.new_cdp_session(page)
            sess.send("Page.handleJavaScriptDialog", {"accept": True})
            page.wait_for_timeout(400)
            return True
        except Exception:
            return False

    def tratar_watchdog(self, page: Page, segundos_caso: float) -> bool:
        if segundos_caso < settings.WATCHDOG_CASO_SEGUNDOS:
            return False
        minutos = settings.WATCHDOG_CASO_SEGUNDOS // 60
        logger.aviso(f"Watchdog: caso travado há {minutos} minuto(s). Reiniciando...")
        self.executar(page, f"watchdog de {minutos} minutos")
        return True

    def _aguardar(self, ms: int):
        """Aguarda em pequenos passos verificando stop_event."""
        fim = ms / 1000
        passo = 0.1
        import time
        inicio = time.time()
        while time.time() - inicio < fim:
            if self._stop.is_set():
                return
            time.sleep(passo)
        self._recovery_pendente = False
        self._sessao_bloqueada = False

    @property
    def recovery_pendente(self) -> bool:
        return self._recovery_pendente

    @property
    def sessao_bloqueada(self) -> bool:
        return self._sessao_bloqueada

    # -----------------------------------------------------------
    # Internos
    # -----------------------------------------------------------
    def _js_select(self, page: Page, seletor: str, valor: str) -> bool:
        """Seleciona opção em um <select> via JavaScript."""
        for frame in page.frames:
            try:
                ok = frame.evaluate(
                    """([sel, val]) => {
                        const el = document.querySelector(sel);
                        if (!el) return false;
                        el.value = val;
                        el.dispatchEvent(new Event('change', {bubbles: true}));
                        return true;
                    }""",
                    [seletor, valor]
                )
                if ok:
                    return True
            except Exception:
                continue
        return False

    def _classificar_dialog(self, mensagem: str) -> str:
        t = self._norm(mensagem)
        if "OCORREU UM ERRO" in t and "REINICI" in t:
            return "recovery"
        if "DADOS CARREGADOS" in t and "SUCESSO" in t:
            return "dados_carregados"
        if any(x in t for x in ("SESSAO", "EXPIR", "LOGIN", "AUTENTIC", "ACESSO NEGADO")):
            return "sessao"
        if any(x in t for x in ("GRAVADO", "SALVO", "REGISTRADO", "SUCESSO")):
            return "sucesso"
        if any(x in t for x in ("OBRIGATOR", "INVALID", "CAMPO")):
            return "bloqueio"
        if any(x in t for x in ("ERRO", "FALHA")):
            return "erro"
        return "desconhecido"

    @staticmethod
    def _norm(texto: str) -> str:
        t = str(texto).upper()
        t = unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode()
        return re.sub(r"\s+", " ", t).strip()
