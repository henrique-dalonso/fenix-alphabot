"""
modules/honda/engine.py — Motor Honda v17.

Arquitetura: engine é uma Thread persistente.
- Playwright roda SEMPRE na mesma thread (requisito do sync API).
- Browser abre uma vez e fica aberto entre sessões (STOP não fecha) —
  e agora também sobrevive ao fechar o Fênix (Quit), de verdade.
- Play/Stop são eventos de sinalização, não criam novas threads.

Novidades desta versão (v17) — MUDANÇA ESTRUTURAL:
- MIGRADO de volta para `connect_over_cdp` com Edge rodando como
  processo DESANEXADO (`subprocess.Popen` com `DETACHED_PROCESS |
  CREATE_NEW_PROCESS_GROUP`), igual ao padrão do AlphaBot original.
  Isso só voltou a ser viável porque o perfil do Edge deixou de ser o
  pessoal do Windows e passou a ser um perfil DEDICADO do Fênix
  (`settings.DIR_PERFIL_EDGE`, ver changelog v9 de `config/settings.py`)
  — a restrição do Chrome/Edge 136+ que bloqueia canais de depuração
  remota (porta ou pipe) só se aplica ao `--user-data-dir` PADRÃO do
  sistema; um diretório dedicado não sofre essa restrição. Confirmado
  com o usuário antes de implementar (ver conversa da sessão).

  O que isso resolve, de vez, sem nenhum hack:
  1. O Edge do Fênix agora SOBREVIVE ao fechamento do app (Quit) —
     não precisa mais fechar e reabrir um Edge "comum" torcendo pra
     restaurar abas (hack da v16, removido — ver changelog v16 abaixo,
     mantido aqui só como histórico). O `finally` de `run()` agora só
     para o driver do Playwright (`pw.stop()`); o processo do Edge,
     por ser desanexado, nem percebe.
  2. Não existe mais checagem/alerta de "Edge já aberto, preciso
     fechar" nem `_matar_processos_edge()` genérico por nome de
     imagem — o perfil do Fênix é isolado do perfil pessoal do
     usuário, então os dois podem ficar abertos ao mesmo tempo sem
     qualquer conflito. Isso elimina uma fricção que sempre incomodou
     (precisar fechar todo o Edge pessoal antes de rodar o bot).
  3. Se algum dia for necessário matar à força o processo do Edge do
     Fênix (ex: ficou zumbi), agora é feito por PID específico
     (`_matar_processo_fenix_edge`), nunca mais por `taskkill /IM
     msedge.exe`, que mataria também o Edge pessoal do usuário — isso
     seria uma regressão grave e não é mais aceitável agora que os
     dois perfis coexistem.

  Nova sequência de conexão (`_conectar_edge`): primeiro verifica se a
  porta de depuração já está respondendo (Edge do Fênix de uma sessão
  anterior, ainda vivo) — se sim, conecta direto, sem abrir um Edge
  novo (permite reaproveitar entre reinícios do Fênix, não só entre
  Play/Stop). Se não, abre o Edge desanexado e aguarda a porta
  responder (até 20s) antes de conectar via `connect_over_cdp`.

  Removido código morto: `_messagebox`/`ctypes` (só existiam para o
  alerta "Edge já aberto", que não faz mais sentido) e `_edge_ja_aberto`
  (checagem genérica de processo, substituída pela checagem de porta).

  AINDA NÃO TESTADO AO VIVO — implementado e revisado, mas depende de
  validação com um login real na LUNA no novo perfil.

Histórico (v16 — hack removido nesta versão, mantido só como registro):
- Handoff do Edge ao fechar o Fênix: fechava o Edge automatizado e
  reabria um Edge "comum" com `--restore-last-session` no mesmo
  perfil pessoal, pra simular persistência. Só existia por causa da
  limitação do perfil pessoal (ver v15) — com o perfil dedicado (v17)
  o problema deixou de existir na raiz, então o hack foi removido por
  completo, junto com `aguardar_encerramento`/`self._encerrado_ev`
  (mantidos por compatibilidade com a UI, mas agora resolvem quase
  instantaneamente, já que não há mais rotina de handoff a esperar).

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
  ESSA CAUSA RAIZ FOI RESOLVIDA NA v17 — o requisito de usar o perfil
  pessoal deixou de existir (decisão revisitada e confirmada com o
  usuário), então a limitação em si não se aplica mais.

  Voltou-se a `launch_persistent_context` (idêntico à v13): funciona
  de forma confiável com o perfil pessoal, ao custo de o Edge fechar
  junto com o Fênix de novo (bug original, reaberto).

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
  reinicialização completa no próximo Play).

Histórico (v14):
- Primeira tentativa de migrar para `connect_over_cdp` com Edge
  desanexado via `subprocess.Popen`. Não funcionou na época — perfil
  pessoal (ver causa raiz na v15). Retomada com sucesso na v17.

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
import urllib.request
import urllib.error
from typing import Optional, Callable

from playwright.sync_api import Page, BrowserContext, Browser, sync_playwright

from config import settings
from core.browser import OperacaoCancelada
from core.recovery import RecoveryManager
from core.logger import logger
from extraction.pdf_text import baixar_e_extrair_texto, ERRO_PDF
from extraction.parsers import honda as parser_honda


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
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None
        self._page: Optional[Page] = None

        # PID do processo do Edge lançado pelo Fênix nesta execução do
        # app (None se ainda não lançamos nenhum, ou se estamos apenas
        # reaproveitando um Edge de uma sessão anterior via porta ativa
        # sem termos lançado nós mesmos). Usado para matar SÓ esse
        # processo específico se precisar de um reset forçado — nunca
        # mais um taskkill genérico por nome de imagem (mataria também
        # o Edge pessoal do usuário, que agora coexiste sem conflito).
        self._edge_pid: Optional[int] = None

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
            # Sem handoff: o Edge do Fênix roda como processo desanexado
            # (ver _lancar_edge_detached) e não tem nenhuma relação de
            # ciclo de vida com o processo do Fênix ou do Playwright. Ao
            # encerrar, só paramos o DRIVER do Playwright — isso encerra
            # a conexão CDP, mas o Edge em si (processo separado) nem
            # percebe e continua aberto exatamente como estava, pronto
            # pra ser reconectado no próximo Play (mesmo depois de um
            # reinício completo do Fênix).
            self._browser = None
            self._context = None
            self._page = None

            try:
                pw.stop()
            except Exception:
                pass

            self._encerrado_ev.set()

    # -----------------------------------------------------------
    # Sessão (uma execução Play → Stop)
    # -----------------------------------------------------------
    def _sessao(self, pw):
        logger.info("Honda iniciando...")
        if self._modo_teste:
            logger.info("MODO DE TESTE ativo: PDF será aberto fisicamente e nenhuma gravação ocorrerá sem sua confirmação.")
        self._atualizar("on_status", "iniciando")

        if not self._garantir_browser(pw):
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
    def _garantir_browser(self, pw) -> bool:
        if self._context is not None:
            try:
                _ = self._context.pages
                logger.info("Reutilizando Edge já aberto.")
                self._page = self._consolidar_aba(self._context)
                return self._page is not None
            except Exception:
                logger.info("Conexão anterior com o Edge foi perdida. Reconectando...")
                self._browser = None
                self._context = None
                self._page = None
                self._dialog_handler_atual = None
                self._luna_pronta = False

        browser = self._conectar_edge(pw)
        if browser is None:
            return False

        if not browser.contexts:
            logger.erro("Conectei ao Edge, mas não encontrei nenhum contexto de navegador.")
            return False

        self._browser = browser
        self._context = browser.contexts[0]
        self._page = self._consolidar_aba(self._context)
        return self._page is not None

    def _conectar_edge(self, pw, tentar_de_novo: bool = True) -> Optional[Browser]:
        """
        Garante um Edge rodando com depuração remota ativa no perfil
        dedicado do Fênix e conecta o Playwright nele via CDP.

        Se a porta já estiver respondendo (Edge de uma sessão anterior
        ainda vivo, mesmo depois de fechar/reabrir o Fênix), conecta
        direto sem abrir um processo novo.
        """
        if not self._porta_debug_ativa():
            edge_path = next(
                (c for c in settings.EDGE_CAMINHOS if os.path.exists(c)), None
            )
            if not edge_path:
                logger.erro("Edge não encontrado.")
                return None

            logger.info("Abrindo Edge (perfil dedicado do Fênix)...")
            if not self._lancar_edge_detached(edge_path):
                if tentar_de_novo:
                    logger.aviso("Tentando encerrar o processo e abrir de novo...")
                    self._matar_processo_fenix_edge()
                    return self._conectar_edge(pw, tentar_de_novo=False)
                return None
        else:
            logger.info("Edge do Fênix já está aberto. Conectando via CDP...")

        try:
            return pw.chromium.connect_over_cdp(
                f"http://localhost:{settings.EDGE_DEBUG_PORT}", timeout=8_000
            )
        except Exception as e:
            if tentar_de_novo:
                logger.aviso(f"Falha ao conectar via CDP ({e}). Encerrando e tentando de novo...")
                self._matar_processo_fenix_edge()
                return self._conectar_edge(pw, tentar_de_novo=False)
            logger.erro(f"Não foi possível conectar ao Edge via CDP: {e}")
            return None

    def _lancar_edge_detached(self, edge_path: str) -> bool:
        """
        Abre o Edge como processo totalmente independente do Fênix
        (sobrevive ao fechamento do app), com depuração remota ativa
        no perfil dedicado. Aguarda a porta responder antes de seguir.
        """
        try:
            processo = subprocess.Popen(
                [
                    edge_path,
                    f"--remote-debugging-port={settings.EDGE_DEBUG_PORT}",
                    f"--user-data-dir={settings.DIR_PERFIL_EDGE}",
                    "--start-maximized",
                    "--no-first-run",
                    "--no-default-browser-check",
                ],
                creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                close_fds=True,
            )
            self._edge_pid = processo.pid
        except Exception as e:
            logger.erro(f"Não consegui abrir o Edge: {e}")
            return False

        inicio = time.time()
        while time.time() - inicio < 20:
            if self._porta_debug_ativa():
                return True
            time.sleep(0.3)

        logger.erro("O Edge não respondeu na porta de depuração a tempo.")
        return False

    def _porta_debug_ativa(self) -> bool:
        try:
            url = f"http://localhost:{settings.EDGE_DEBUG_PORT}/json/version"
            with urllib.request.urlopen(url, timeout=2) as resp:
                return resp.status == 200
        except Exception:
            return False

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
        """
        Usado em caso de erro na sessão — apenas esquece a conexão
        atual (não mata o processo do Edge). O Edge continua aberto e
        será reconectado no próximo Play via `_conectar_edge`.
        """
        self._browser = None
        self._context = None
        self._page = None
        self._dialog_handler_atual = None
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

    def _matar_processo_fenix_edge(self):
        """
        Mata SÓ o processo do Edge que o Fênix lançou (por PID), nunca
        por nome de imagem — o perfil pessoal do usuário pode ter Edge
        aberto ao mesmo tempo, e um taskkill genérico por "msedge.exe"
        mataria os dois indiscriminadamente. Se não sabemos o PID
        (ex: era um Edge de uma sessão anterior do Fênix, e este
        processo Python não foi quem o lançou), não faz nada — mais
        seguro deixar a reconexão falhar com um erro claro do que
        arriscar matar processo errado.
        """
        if not self._edge_pid:
            logger.aviso(
                "Não sei o PID do Edge do Fênix (não fui eu quem abriu). "
                "Não vou encerrar processos por segurança — feche manualmente "
                "a janela do Edge do perfil dedicado se necessário."
            )
            return
        logger.info(f"Encerrando o processo do Edge do Fênix (PID {self._edge_pid})...")
        subprocess.run(
            ["taskkill", "/F", "/T", "/PID", str(self._edge_pid)], capture_output=True
        )
        self._edge_pid = None
        time.sleep(1.5)
        logger.info("Processo encerrado.")
