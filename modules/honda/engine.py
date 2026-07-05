"""
modules/honda/engine.py — Motor Honda v16.

Arquitetura: engine é uma Thread persistente.
- Playwright roda SEMPRE na mesma thread (requisito do sync API).
- Browser abre uma vez e fica aberto entre sessões (STOP não fecha).
- Play/Stop são eventos de sinalização, não criam novas threads.
- Quit (fechar app) fecha o Edge automatizado e faz um HANDOFF para um
  Edge comum com as abas restauradas — ver changelog abaixo.

Novidades desta versão (v16):
- IMPLEMENTADO handoff do Edge ao fechar o Fênix (solução proposta
  pelo próprio usuário, viabilizada na ordem tecnicamente correta):
  como o perfil é PESSOAL e compartilhado, e desde o Chrome/Edge 136 a
  porta de depuração remota é bloqueada nesse perfil (ver changelog
  v15), o Edge do Fênix precisa fechar ao encerrar — isso não muda.
  Mas agora, no `finally` de `run()`, a sequência é: 1) fecha o Edge
  automatizado de propósito (`context.close()`); 2) para o driver do
  Playwright (`pw.stop()`); 3) reabre um Edge COMUM (sem nenhuma
  automação, processo totalmente desanexado via `subprocess.Popen`
  com `DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP`) no mesmo perfil,
  com a flag `--restore-last-session`, que força a restauração das
  abas independente de como o Edge anterior foi fechado. Do ponto de
  vista do usuário, o Edge "pisca" e volta com tudo que estava aberto
  — não é persistência de verdade (o processo automatizado morre e um
  novo assume o perfil), mas resolve o problema prático.
  IMPORTANTE: só funciona nessa ordem (fechar → abrir). A ideia
  original do usuário era abrir o novo Edge ANTES de fechar o
  automatizado, mas o Chromium só permite um dono por perfil — abrir
  o novo enquanto o antigo ainda vive apenas seria absorvido pelo
  processo automatizado existente (viraria a mesma instância), então
  fechar um fecharia o outro do mesmo jeito.
  Novo método público `aguardar_encerramento(timeout)` — a UI
  (`ui/main_window.py` v5) precisa chamar isso antes de destruir a
  janela, senão o processo do Fênix pode morrer no meio dessa rotina,
  antes do Edge comum ser reaberto. `self._encerrado_ev` (Event) é
  sinalizado ao final do `finally` de `run()`.
  NÃO TESTADO AO VIVO AINDA — só validado com `py_compile`.

Histórico (v15):
- REVERTIDA a mudança estrutural da v14 (`connect_over_cdp` +
  `_lancar_edge_detached`): TESTADA AO VIVO pelo usuário e NÃO
  FUNCIONOU — o Edge abria uma aba em branco, nunca navegava para a
  LUNA, e a porta de depuração nunca respondia
  ("O Edge não respondeu na porta de depuração a tempo").

  CAUSA RAIZ CONFIRMADA (pesquisada e verificada, não é suposição):
  desde o Chrome/Edge 136, o navegador BLOQUEIA silenciosamente
  `--remote-debugging-port` quando o `--user-data-dir` aponta para o
  perfil PADRÃO/pessoal do Windows — é uma restrição de segurança
  deliberada (evita que processos automatizados/malware se conectem
  via CDP numa sessão logada de verdade e roubem cookies/senhas). Isso
  significa que `connect_over_cdp` é estruturalmente incompatível com
  o requisito do usuário de usar o perfil PESSOAL do Edge — não existe
  ajuste de código que contorne essa restrição do próprio navegador.

  Voltou-se a `launch_persistent_context` (idêntico à v13): funciona
  de forma confiável com o perfil pessoal, ao custo de o Edge fechar
  junto com o Fênix de novo (bug original, reaberto). Essa é uma
  decisão pendente de confirmação do usuário — ver FENIX_STATUS.md
  seção 2 para as opções apresentadas a ele (aceitar a limitação vs.
  perfil dedicado do Fênix, que permitiria usar `connect_over_cdp` de
  verdade).

- MANTIDO da v14 (não tem relação com a causa raiz acima, é uma
  correção independente e válida): CORRIGIDO Stop → Play refazendo
  banco/tipo/setas do zero, mesmo com a LUNA já inicializada. `_sessao`
  só executa o bloco de navegação + checagem de sessão/login +
  `_inicializar_luna` (seleção de banco/tipo e clique nas setas) na
  PRIMEIRA vez desta conexão de browser, controlado pela flag
  `self._luna_pronta`. Em um Stop → Play subsequente (mesma conexão,
  página intacta), pula direto para o loop de processamento, só
  reatando o handler de dialog do novo `RecoveryManager`.
  `_luna_pronta` é resetado para `False` quando a conexão de browser é
  perdida/recriada (`_garantir_browser`, `_fechar_browser`) ou quando
  uma sessão expirada é detectada em `_processar_um_caso` (força
  reinicialização completa no próximo Play). Este ponto também ainda
  não foi validado ao vivo pelo usuário (a v14 quebrou antes dele
  chegar a testar isso).

Histórico (v14 — revertida nesta versão):
- Tentativa de migrar para `connect_over_cdp` com Edge desanexado via
  `subprocess.Popen`. Não funcionou — ver explicação da causa raiz
  acima.

Histórico (v13):
- REVERTIDO A PEDIDO DO USUÁRIO (parte da v12): abrir o PDF físico numa
  aba separada não é viável — a conferência visual do usuário depende
  de ver o PDF na MESMA tela, não trocando de aba. `_abrir_pdf_fisicamente`
  voltou a clicar no ícone da LUNA (mesma página), com uma pausa curta
  logo após o clique para dar tempo do PDF começar a carregar. A
  blindagem de timeout real em `_js_set` (`_evaluate_com_timeout`, v12)
  foi MANTIDA como rede de segurança — ainda não há certeza de que a
  causa do travamento relatado era mesmo o PDF pesado bloqueando a
  página (só aconteceu uma vez); se acontecer de novo, o log agora vai
  mostrar um timeout claro em vez de travar mudo, o que finalmente vai
  confirmar ou descartar essa hipótese.
- REVERTIDO A PEDIDO DO USUÁRIO (v6/v11 — restauração de abas do
  Edge): estava gerando abas duplicadas/lixo a cada abertura, pior que
  o problema original. Removidas as flags `--restore-last-session` e
  `--hide-crash-restore-bubble`, e `_consolidar_aba` voltou ao
  comportamento simples e prévio: ao abrir o Edge, vai direto para a
  LUNA e fecha todas as outras abas.

Histórico (v12):
- CORRIGIDO (travamento relatado: engine parava silenciosamente logo
  após abrir o PDF físico no Modo de Teste, sem preencher nada e sem
  erro nenhum no log): a causa mais provável é que clicar no ícone da
  LUNA carregava o PDF dentro do mesmo contexto/página do formulário —
  um PDF grande pode deixar o visualizador ocupado tempo suficiente
  para bloquear a comunicação do Playwright com aquela aba. Duas
  mudanças:
  1. `_abrir_pdf_fisicamente` passou a abrir o PDF numa aba própria e
     isolada — REVERTIDO na v13 (ver acima).
  2. Blindagem geral: `_js_set` agora roda `evaluate()` com um teto de
     tempo real (`_evaluate_com_timeout`, 8s) — o Playwright não impõe
     timeout próprio a `evaluate()`, então se o navegador travar por
     qualquer motivo, antes o engine ficava pendurado pra sempre em
     silêncio. Agora esse tipo de travamento vira um erro claro no log
     e o engine para com segurança, em vez de travar mudo.

Histórico (v11):
- REVERTIDO A PEDIDO DO USUÁRIO (parte do bug 1 da v10): usar o perfil
  pessoal do Edge é intencional, não um bug — o usuário confirmou que
  quer o bot rodando no mesmo perfil/sessão do dia a dia dele. Voltou
  a checagem "há algum msedge.exe aberto?" + o messagebox perguntando
  se pode encerrar, e o kill volta a ser geral (`_matar_processos_edge`),
  já que agora só existe um perfil (o pessoal) para gerenciar. O
  `_messagebox` ganhou as flags `MB_TOPMOST | MB_SETFOREGROUND` para
  garantir que a janela do alerta realmente ganhe foco — antes podia
  abrir atrás da janela do Fênix e passar despercebido.
- CORRIGIDO (a real queixa por trás do bug 1 — perda de abas): a causa
  não era usar o perfil pessoal, e sim o Edge não restaurar as abas de
  forma confiável ao reabrir. `_lancar_context` agora inclui
  `--restore-last-session` + `--hide-crash-restore-bubble`, que forçam
  a restauração silenciosa e determinística das abas da última sessão,
  independente da configuração de "Continuar de onde parou" do Edge ou
  do aviso de fechamento incorreto (que só aparecia às vezes).
- CORRIGIDO (achado adicional): `_consolidar_aba` fechava todas as
  abas do contexto exceto a escolhida para a automação — o que
  destruiria justamente as abas recém-restauradas. Agora ele só
  seleciona a aba da LUNA (ou abre uma aba nova dedicada, se nenhuma
  aba da LUNA estiver entre as restauradas) e nunca fecha as demais.

Histórico (v10):
- CORRIGIDO (bug 2 — fechava o Edge ao fechar o Fênix): `quit()` não
  chama mais `_fechar_browser()` (não fecha mais o contexto
  explicitamente) — o navegador agora deve permanecer aberto ao
  fechar o app, igual ao STOP. `pw.stop()` continua sendo chamado (só
  encerra o processo do driver do Playwright, não deveria fechar o
  Edge em si), com uma pequena pausa de segurança antes — o que também
  deve reduzir/eliminar o erro `EPIPE: broken pipe` que aparecia no
  console ao fechar (causado por uma corrida entre o fechamento do
  contexto e a parada do driver). Este ponto precisa de confirmação
  em teste real — se o Edge do Fênix ainda fechar junto, o próximo
  passo é migrar para `connect_over_cdp` com o Edge rodando como
  processo desanexado (como o AlphaBot original fazia com
  `--remote-debugging-port`), que garante isolamento total do
  processo do navegador em relação ao Fênix.
- CORRIGIDO (bug 3 — sempre refazia login após STOP → PLAY): `_sessao`
  agora navega direto para a rotina da LUNA primeiro e só vai para a
  tela de login se realmente for redirecionado para lá (sessão
  inexistente/expirada). Antes, navegava incondicionalmente para
  LOGIN_URL toda sessão, mesmo com sessão ativa.
- CORRIGIDO (bug 4 — PDF físico abria rápido demais entre casos): a
  pausa de estabilização em `_aguardar_troca_de_caso` (após confirmar
  a troca de caso) subiu de 200ms para 1000ms, e foi adicionada uma
  pausa extra antes de `_abrir_pdf_fisicamente` no próximo caso — dá
  tempo do painel do PDF anterior terminar de fechar visualmente antes
  de abrir o novo, evitando a sobreposição relatada.

Histórico (v9):
- CORRIGIDO (pendência nº1 do FENIX_STATUS.md): após o GRAVAR, o
  engine não tinha nenhuma forma de confirmar que a LUNA realmente
  trocou de caso antes de processar o próximo — a gravação na LUNA é
  assíncrona, então o próximo ciclo do loop podia encontrar a tela
  ainda com os dados do caso recém-gravado e reaproveitá-los por
  engano. Portado o mecanismo de identificador de caso que já existia
  e era comprovado no módulo VOLKS do AlphaBot original
  (identificador_caso_volks / aguardar_proximo_caso_volks), adaptado
  para o Honda: `_identificador_de_onclick`, `_identificador_caso` e
  `_aguardar_troca_de_caso`. O identificador é o path do PDF (onclick
  `abrirPdf(...)`), capturado antes do GRAVAR; depois do GRAVAR, o
  engine só segue para o próximo caso quando esse identificador muda
  na tela ou a fila esvazia. Timeout de segurança de 30s aciona
  recovery se a troca nunca for confirmada. Aplicado tanto ao fluxo
  normal quanto às marcações especiais (ERRO NO PDF / FALTANDO
  ENDERECO) em `_gravar_marcacao`.

Histórico (v8):
- CORRIGIDO: handler de dialog do recovery ficava acumulado entre
  sessões (Play → Stop → Play), já que o Edge/página são reaproveitados
  e o handler antigo nunca era removido. Cada novo Play empilhava mais
  um listener de dialog em cima dos anteriores, causando
  "Cannot accept dialog which is already handled" (handlers de
  sessões passadas competindo pelo mesmo dialog). Agora o handler
  atual é guardado e removido explicitamente antes de registrar um
  novo, a cada sessão.

Histórico (v7):
- Limpa também o campo "valor_nome" (além de "valor_nome2").
- Corrigido bug de handler de dialog duplicado em _clicar_gravar que
  causava ~15-20s de atraso entre o GRAVAR e o próximo caso.
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


_MB_YESNO         = 0x04
_MB_ICONWARNING   = 0x30
_MB_TOPMOST       = 0x40000
_MB_SETFOREGROUND = 0x10000
_IDYES = 6

def _messagebox(titulo: str, mensagem: str) -> bool:
    """
    Alerta nativo do Windows. Usa MB_TOPMOST + MB_SETFOREGROUND para
    garantir que a janela realmente ganhe foco e apareça na frente —
    sem essas flags, o alerta podia abrir atrás da janela do Fênix e
    passar despercebido (bug relatado: "o alerta não aparece mais").
    """
    try:
        return ctypes.windll.user32.MessageBoxW(
            0, mensagem, titulo,
            _MB_YESNO | _MB_ICONWARNING | _MB_TOPMOST | _MB_SETFOREGROUND
        ) == _IDYES
    except Exception:
        return True


class HondaEngine(threading.Thread):
    """
    Thread persistente do engine Honda.

    Ciclo de vida:
        __init__ → start() [app inicia]
            → dorme esperando play_event
        play(callbacks, modo_teste=False) → acorda → processa casos → dorme
        stop()          → pausa (browser fica aberto)
        quit()          → encerra thread e fecha browser

    Modo de teste:
        confirmar("gravar") → chamado pela UI quando o usuário
        revisou o caso e autoriza a gravação. Sem essa confirmação,
        o engine nunca clica em GRAVAR.
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

        # True quando a LUNA já foi navegada, logada e inicializada
        # (banco/tipo/setas) nesta conexão de browser. Permite que um
        # Stop → Play reaproveite a tela exatamente como estava, sem
        # refazer login/seleção de banco e tipo/setas do zero.
        self._luna_pronta = False

        # Handler de dialog da sessão atual — guardado para poder ser
        # removido no início da próxima sessão (evita acúmulo quando o
        # Edge/página são reaproveitados entre Play/Stop/Play).
        self._dialog_handler_atual: Optional[Callable] = None

        # Modo de teste (conferência manual antes de gravar)
        self._modo_teste = False
        self._confirmar_ev = threading.Event()
        self._acao_pendente: Optional[str] = None

        # Sinalizado quando o run() termina toda a rotina de
        # encerramento (incluindo o handoff do Edge — ver quit()/run()).
        # A UI espera nele antes de matar o processo de vez, senão a
        # rotina de handoff pode ser interrompida pela metade.
        self._encerrado_ev = threading.Event()

    # -----------------------------------------------------------
    # API para a UI
    # -----------------------------------------------------------
    def play(self, callbacks: dict, modo_teste: bool = False):
        self._callbacks = callbacks
        self._modo_teste = modo_teste
        self._stop_ev.clear()
        self._play_ev.set()

    def stop(self):
        self._stop_ev.set()
        # Se estava pausado esperando confirmação, desbloqueia a espera.
        self._confirmar_ev.set()

    def quit(self):
        """Chamado ao fechar o app — encerra thread e faz o handoff do Edge."""
        self._quit_ev.set()
        self._stop_ev.set()
        self._confirmar_ev.set()
        self._play_ev.set()  # desbloqueia o wait

    def aguardar_encerramento(self, timeout: float = 6.0) -> bool:
        """
        Bloqueia (chamado pela UI, thread principal) até o run() terminar
        toda a rotina de encerramento — incluindo fechar o Edge
        automatizado e reabrir um Edge comum no lugar (handoff). Sem
        isso, a UI pode matar o processo do Fênix no meio da rotina,
        antes do Edge comum ser reaberto.
        """
        return self._encerrado_ev.wait(timeout)

    def confirmar(self, acao: str = "gravar"):
        """
        Chamado pela UI (thread principal) quando o usuário revisou o
        caso em modo de teste e decidiu a ação. Único valor tratado
        hoje: "gravar". Qualquer outro valor faz o engine pular a
        gravação desse caso por segurança.
        """
        self._acao_pendente = acao
        self._confirmar_ev.set()

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
            # HANDOFF DO EDGE (solução proposta pelo usuário, viabilizada
            # na ordem correta): como o perfil é PESSOAL e compartilhado,
            # o Edge do Fênix precisa fechar ao encerrar — não há como
            # evitar isso mantendo launch_persistent_context (ver
            # changelog v15). Só é possível "abrir um Edge novo, sem
            # conexão" DEPOIS de fechar o antigo, nunca antes: os dois
            # apontariam pro mesmo perfil ao mesmo tempo, e o Chromium só
            # permite um dono por perfil — tentar abrir o novo primeiro
            # apenas seria absorvido pelo processo automatizado existente
            # (viraria a mesma instância), então fechar um fecharia o
            # outro do mesmo jeito. Por isso a ordem aqui é: 1) fecha o
            # Edge automatizado de propósito, 2) reabre um Edge comum
            # (sem nenhuma automação, processo totalmente desanexado) no
            # mesmo perfil com --restore-last-session, que força a
            # restauração das abas independente de como o Edge anterior
            # foi fechado. Do ponto de vista do usuário, o Edge "pisca" e
            # volta com tudo que estava aberto — não é persistência de
            # verdade, mas resolve o problema prático dele.
            tinha_browser = self._context is not None
            try:
                if self._context:
                    self._context.close()
            except Exception:
                pass
            self._context = None
            self._page = None

            try:
                pw.stop()
            except Exception:
                pass

            if tinha_browser:
                edge_path = next(
                    (c for c in settings.EDGE_CAMINHOS if os.path.exists(c)), None
                )
                if edge_path:
                    try:
                        time.sleep(0.6)  # dá tempo do processo antigo liberar o profile
                        subprocess.Popen(
                            [edge_path, "--restore-last-session"],
                            creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP,
                            stdin=subprocess.DEVNULL,
                            stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL,
                            close_fds=True,
                        )
                        logger.info("Edge comum reaberto com as abas restauradas.")
                    except Exception as e:
                        logger.aviso(f"Não consegui reabrir o Edge normalmente: {e}")

            self._encerrado_ev.set()

    # -----------------------------------------------------------
    # Sessão (uma execução Play → Stop)
    # -----------------------------------------------------------
    def _sessao(self, pw):
        logger.info("Honda iniciando...")
        if self._modo_teste:
            logger.info("MODO DE TESTE ativo: PDF será aberto fisicamente e nenhuma gravação ocorrerá sem sua confirmação.")
        self._atualizar("on_status", "iniciando")

        edge_path = next(
            (c for c in settings.EDGE_CAMINHOS if os.path.exists(c)), None
        )
        if not edge_path:
            logger.erro("Edge não encontrado.")
            return

        # Perfil PESSOAL do usuário (decisão intencional dele) — se o Edge
        # já estiver aberto, ele PRECISA ser fechado para o Playwright
        # assumir esse mesmo perfil (é o mesmo user-data-dir, só pode
        # haver um dono por vez).
        if self._context is None and self._edge_ja_aberto():
            confirmado = _messagebox(
                "Fênix — Edge detectado",
                "O Edge está aberto no seu perfil pessoal.\n\n"
                "Preciso fechá-lo para continuar.\n\n"
                "Deseja continuar?"
            )
            if not confirmado:
                logger.info("Operação cancelada.")
                return
            self._matar_processos_edge()

        if not self._garantir_browser(pw, edge_path):
            return

        # Remove o handler de dialog de uma sessão anterior, se ainda
        # estiver preso na página (acontece quando o Edge é reaproveitado
        # entre Play/Stop/Play). Sem isso, os handlers se acumulam e cada
        # dialog é processado por handlers de sessões antigas + a atual
        # ao mesmo tempo, causando "Cannot accept dialog which is already
        # handled" no console a cada novo Play.
        if self._dialog_handler_atual is not None:
            try:
                self._page.remove_listener("dialog", self._dialog_handler_atual)
            except Exception:
                pass
            self._dialog_handler_atual = None

        self._recovery = RecoveryManager(self._stop_ev, modulo="HONDA")

        if not self._luna_pronta:
            # Primeira vez nesta conexão de browser: navega, checa
            # sessão/login e inicializa banco/tipo/setas do zero.
            _aceitar = lambda d: d.accept()
            self._page.on("dialog", _aceitar)

            logger.info("Verificando sessão ativa na LUNA...")
            self._navegar_seguro(self._page, settings.ROTINA_LUNA_URL)
            url_atual = ""
            try:
                url_atual = (self._page.url or "").lower()
            except Exception:
                pass
            sessao_ativa = "gelogin" not in url_atual and "login" not in url_atual

            if not sessao_ativa:
                logger.info("Sessão não encontrada. Navegando para o login...")
                self._navegar_seguro(self._page, settings.LOGIN_URL)
                if not self._fazer_login(self._page):
                    return
                logger.info("Navegando para a rotina da LUNA...")
                self._navegar_seguro(self._page, settings.ROTINA_LUNA_URL)
            else:
                logger.sucesso("Sessão ativa detectada. Login não necessário.")

            try:
                self._page.remove_listener("dialog", _aceitar)
            except Exception:
                pass

            handler_recovery = self._recovery.criar_handler_dialog("Honda")
            self._page.on("dialog", handler_recovery)
            self._dialog_handler_atual = handler_recovery

            self._aguardar(1_500)

            if not self._recovery._inicializar_luna(self._page):
                if not self._recovery.executar(self._page, "falha na inicialização"):
                    return

            self._luna_pronta = True
            logger.sucesso("LUNA pronta. Iniciando processamento...")
        else:
            # STOP → PLAY na mesma conexão: a tela já está exatamente
            # como ficou quando pausamos — não navega, não refaz login,
            # não reseleciona banco/tipo/setas. Só reata o handler de
            # dialog (novo RecoveryManager desta sessão).
            handler_recovery = self._recovery.criar_handler_dialog("Honda")
            self._page.on("dialog", handler_recovery)
            self._dialog_handler_atual = handler_recovery
            logger.sucesso("Retomando sessão já inicializada da LUNA — pulando login e seleção de banco/tipo.")

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
                self._dialog_handler_atual = None
                self._luna_pronta = False
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
        """Escolhe a aba da LUNA e fecha todas as demais abas do contexto."""
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
        self._dialog_handler_atual = None
        self._luna_pronta = False
        self._luna_pronta = False

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
    # Identificador de caso (transição pós-GRAVAR)
    # -----------------------------------------------------------
    # Portado do módulo VOLKS do AlphaBot original
    # (identificador_caso_volks / aguardar_proximo_caso_volks), que já
    # resolvia exatamente este problema lá. Nunca havia sido portado
    # para o Honda no Fênix — ver histórico no FENIX_STATUS.md, seção 2.
    def _identificador_de_onclick(self, onclick: Optional[str]) -> Optional[str]:
        if not onclick:
            return None
        match = re.search(r"abrirPdf\('(.*?)'\)", onclick)
        if match:
            return "PDF:" + str(match.group(1)).strip()
        return "ONCLICK:" + str(onclick).strip()

    def _identificador_caso(self, page: Page) -> Optional[str]:
        """Reconsulta a tela agora (usado durante a espera pós-GRAVAR)."""
        try:
            onclick = self._encontrar_pdf_onclick(page)
        except Exception:
            onclick = None
        ident = self._identificador_de_onclick(onclick)
        if ident:
            return ident
        try:
            return "URL:" + str(page.url or "").strip()
        except Exception:
            return None

    def _aguardar_troca_de_caso(self, page: Page, identificador_anterior: Optional[str], timeout_s: int = 30) -> bool:
        """
        Bloqueia logo após um GRAVAR bem-sucedido até confirmar que a
        LUNA realmente avançou para o próximo caso (identificador do
        onclick do PDF mudou) ou que a fila esvaziou. Sem isso, o
        próximo ciclo do loop pode encontrar a tela ainda com os dados
        do caso recém-gravado (a gravação na LUNA é assíncrona) e
        processar o próximo caso com dados errados.

        Retorna True se a troca foi confirmada (ou a fila esvaziou),
        False se o tempo esgotou sem confirmação (nesse caso um
        recovery é acionado por segurança).
        """
        self._atualizar("on_status", "aguardando troca de caso")
        inicio = time.time()

        while time.time() - inicio < timeout_s:
            if self._stop_ev.is_set() or self._quit_ev.is_set():
                return False

            try:
                if self._fila_vazia(page):
                    logger.info("Fila esvaziou após o GRAVAR. Prosseguindo.")
                    return True
                atual = self._identificador_caso(page)
            except Exception:
                atual = None

            if atual and identificador_anterior and atual != identificador_anterior:
                logger.info("Troca de caso confirmada pela LUNA. Prosseguindo.")
                # 1000ms (era 200ms): dá tempo do painel do PDF anterior
                # terminar de fechar visualmente antes do próximo caso
                # tentar abrir um novo PDF por cima (bug relatado: overlap
                # entre o PDF antigo fechando e o novo abrindo).
                self._aguardar(1_000)
                return True

            time.sleep(0.15)

        logger.aviso(
            "Tempo esgotado aguardando a LUNA trocar de caso após o GRAVAR. "
            "Por segurança, vou forçar um recovery antes de continuar."
        )
        if not self._recovery.executar(page, "timeout aguardando troca de caso pós-GRAVAR"):
            self._stop_ev.set()
        return False

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
                self._luna_pronta = False
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

            # Identificador do caso atual, capturado agora (onclick recém
            # localizado) — usado depois do GRAVAR para confirmar que a
            # LUNA realmente trocou de caso antes de seguir para o próximo.
            identificador_atual = self._identificador_de_onclick(onclick)

            match = re.search(r"abrirPdf\('(.*?)'\)", onclick)
            if not match:
                logger.erro("URL do PDF não reconhecida.")
                return

            pdf_path = match.group(1)
            grupo_cota = self._extrair_grupo_cota(pdf_path)
            logger.info(f"GRUPO/COTA: {grupo_cota}")

            if self._modo_teste:
                self._abrir_pdf_fisicamente(page)

            self._verificar_stop()
            if self._watchdog(page):
                return

            self._atualizar("on_pdf", "baixando")
            texto_pdf = baixar_e_extrair_texto(settings.BASE_URL + pdf_path)

            if texto_pdf == ERRO_PDF:
                self._gravar_marcacao(page, grupo_cota, "ERRO NO PDF", identificador_atual)
                return
            if texto_pdf is None:
                self._gravar_marcacao(page, grupo_cota, "FALTANDO ENDERECO", identificador_atual)
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

            if self._modo_teste:
                acao = self._aguardar_confirmacao(page)
                if acao is None:
                    return  # STOP acionado enquanto aguardava conferência
                if acao != "gravar":
                    logger.aviso(f"Ação '{acao}' não reconhecida em modo de teste — caso não será gravado.")
                    return

            self._atualizar("on_gravar", "gravando")

            resultado = self._clicar_gravar(page)

            if resultado is True:
                self.casos_processados += 1
                self._atualizar("on_gravar", "sucesso")
                logger.sucesso(f"Caso gravado. Total sessão: {self.casos_processados}\n")
                self._aguardar_troca_de_caso(page, identificador_atual)
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

    def _abrir_pdf_fisicamente(self, page: Page) -> bool:
        """
        Modo de teste: clica no ícone do PDF na própria LUNA, abrindo o
        documento visualmente na mesma tela onde você confere os campos
        preenchidos — é assim que você acompanha visualmente, então
        precisa continuar sendo na mesma página (nada de aba separada).

        NOTA sobre o travamento relatado numa sessão anterior: a
        hipótese era o PDF pesado carregando na mesma página deixar o
        navegador ocupado por tempo suficiente para travar a próxima
        chamada do Playwright. Ainda não temos certeza de que era
        exatamente isso (só aconteceu uma vez) — por isso, em vez de
        mudar o comportamento visual (que você precisa), a proteção
        agora está em duas frentes: uma pausa curta aqui para dar
        tempo do PDF começar a carregar antes de seguir, e um teto de
        tempo real em `_js_set` (`_evaluate_com_timeout`) — se o
        navegador realmente travar de novo, o log vai mostrar
        exatamente isso (timeout claro), em vez de travar mudo. Isso
        também nos dá a confirmação que faltava para saber se essa
        hipótese está certa.
        """
        for frame in page.frames:
            try:
                el = frame.locator(settings.LUNA_SELETORES["botao_pdf"]).first
                if el.count() > 0:
                    el.click(timeout=3_000)
                    logger.info("PDF aberto fisicamente para conferência.")
                    self._aguardar(1_200)  # dá tempo do PDF começar a carregar
                    return True
            except Exception:
                continue
        logger.aviso("Não consegui abrir o PDF fisicamente (modo de teste). A extração automática segue normalmente.")
        return False

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
        # Limpa os dois campos possíveis de nome do cliente — nem todo
        # contrato exibe os dois; _js_set não faz nada (rápido) se o
        # campo não existir na tela.
        self._js_set(page, settings.LUNA_CAMPOS["nome"], "")
        self._js_set(page, settings.LUNA_CAMPOS["nome_alt"], "")
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

    def _evaluate_com_timeout(self, frame, script: str, arg, timeout_s: float = 8.0):
        """
        Executa frame.evaluate() com um teto de tempo real, usando uma
        thread auxiliar. `evaluate()` do Playwright NÃO tem timeout
        próprio — se o processo do navegador travar por qualquer motivo
        (ex.: uma aba pesada consumindo o processo), a chamada pode
        ficar pendurada para sempre, travando o engine inteiro em
        silêncio. Isso transforma esse tipo de travamento num erro
        claro e recuperável (levanta TimeoutError) em vez de um hang.
        """
        resultado: dict = {}

        def _alvo():
            try:
                resultado["valor"] = frame.evaluate(script, arg)
            except Exception as e:
                resultado["erro"] = e

        t = threading.Thread(target=_alvo, daemon=True)
        t.start()
        t.join(timeout_s)
        if t.is_alive():
            raise TimeoutError(
                f"evaluate() não respondeu em {timeout_s:.0f}s — "
                "o navegador pode estar travado ou sobrecarregado."
            )
        if "erro" in resultado:
            raise resultado["erro"]
        return resultado.get("valor")

    def _js_set(self, page: Page, name: str, valor: str):
        for frame in page.frames:
            try:
                ok = self._evaluate_com_timeout(
                    frame,
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
            except TimeoutError as e:
                logger.erro(f"Timeout ao preencher o campo '{name}': {e}")
                self._stop_ev.set()
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
    # Confirmação manual (modo de teste)
    # -----------------------------------------------------------
    def _aguardar_confirmacao(self, page: Page) -> Optional[str]:
        """
        Bloqueia (verificando STOP) até a UI chamar confirmar(). Nunca
        clica em GRAVAR sem essa confirmação explícita quando o modo
        de teste está ativo.
        """
        self._confirmar_ev.clear()
        self._acao_pendente = None
        logger.info(
            "MODO DE TESTE: aguardando sua conferência. Revise o PDF e os "
            "campos preenchidos na LUNA e clique em 'Confirmar e Gravar' no Fênix."
        )
        self._atualizar("on_gravar", "aguardando")

        while not self._confirmar_ev.is_set():
            if self._stop_ev.is_set() or self._quit_ev.is_set():
                logger.info("STOP acionado enquanto aguardava sua conferência.")
                return None
            time.sleep(0.1)

        return self._acao_pendente

    # -----------------------------------------------------------
    # Gravação
    # -----------------------------------------------------------
    def _clicar_gravar(self, page: Page):
        """
        Dialogs esperados:
          1. "Confirma a gravação..." → confirmacao
          2. "Dados gravados com sucesso" → sucesso

        O handler local abaixo NÃO chama dialog.accept() — a sessão já
        tem um handler global (self._dialog_handler_atual) registrado,
        que é o único responsável por aceitar qualquer dialog da
        página. O handler local só observa e classifica.
        """
        alertas = []

        def on_dialog(dialog):
            try:
                tipo = self._recovery._classificar_dialog(dialog.message)
                if tipo == "recovery":
                    self._recovery._recovery_pendente = True
                logger.info(f"Alerta GRAVAR ({tipo}): {dialog.message[:80]}")
                alertas.append((tipo, dialog.message))
            except Exception as e:
                logger.erro(f"Erro ao classificar alerta de gravação: {e}")

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
    def _gravar_marcacao(self, page: Page, grupo_cota: str, marcacao: str, identificador_atual: Optional[str] = None):
        self._js_set(page, settings.LUNA_CAMPOS["nome"], "")
        self._js_set(page, settings.LUNA_CAMPOS["nome_alt"], "")
        self._js_set(page, settings.LUNA_CAMPOS["cpf_cnpj"], "")
        self._js_set(page, settings.LUNA_CAMPOS["grupo_cota"],
                     parser_honda.normalizar(grupo_cota, preservar_ponto=True))
        self._js_set(page, settings.LUNA_CAMPOS["endereco"],
                     parser_honda.normalizar(marcacao))
        resultado = self._clicar_gravar(page)
        if resultado is True:
            self.casos_processados += 1
            logger.sucesso(f"Caso gravado como '{marcacao}'.")
            self._aguardar_troca_de_caso(page, identificador_atual)
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
