"""
core/browser.py — Sessão de browser do Fênix.

Por que isso é melhor que o connect_over_cdp do AlphaBot:

No AlphaBot, o fluxo era:
  1. Matar processos Edge no Task Manager
  2. Abrir Edge com --remote-debugging-port=9222 (botão ou Windows+R)
  3. Abrir a LUNA manualmente nessa janela
  4. Clicar Play

Com launch_persistent_context, o fluxo vira:
  1. Clicar Play no Fênix

O Playwright abre o Edge ele mesmo, usando um perfil em disco
(data/edge_profile/). O login da LUNA é salvo nesse perfil — uma vez
autenticado, o Fênix lembra para sempre, igual um perfil de usuário
normal do Windows. Nenhuma porta de debug, nenhum processo a matar,
nenhum botão auxiliar.

Se o Edge já estiver aberto quando o usuário clicar Play, o Fênix
detecta e avisa com uma mensagem clara — sem travar, sem Task Manager.
"""

import os
import subprocess
import threading
import time

from playwright.sync_api import sync_playwright, BrowserContext, Page

from config import settings
from core.logger import logger


class OperacaoCancelada(Exception):
    """Levantada quando o stop_event é acionado durante execução."""


class SessaoBrowser:
    """
    Gerencia o ciclo de vida do Edge para o Fênix.

    Uso:
        sessao = SessaoBrowser(stop_event)
        pagina = sessao.abrir()   # Edge abre, retorna Page da LUNA
        # ... automação ...
        sessao.fechar()
    """

    def __init__(self, stop_event: threading.Event):
        self._stop = stop_event
        self._playwright = None
        self._context: BrowserContext | None = None
        self.pagina: Page | None = None

    # -----------------------------------------------------------
    # API pública
    # -----------------------------------------------------------

    def abrir(self) -> "Page | None":
        """
        Abre o Edge com perfil persistente e retorna a aba da LUNA.
        Retorna None se algo impedir a abertura (Edge já aberto, caminho
        não encontrado, etc.) — o engine trata o None e registra o erro.
        """
        edge_path = self._encontrar_edge()
        if not edge_path:
            logger.erro(
                "Edge não encontrado. Verifique se o Microsoft Edge está instalado."
            )
            return None

        if self._edge_ja_aberto():
            logger.erro(
                "O Edge já está aberto. Feche todas as janelas do Edge e tente novamente. "
                "Não é necessário usar o Task Manager — apenas feche normalmente."
            )
            return None

        logger.info("Abrindo Edge...")

        try:
            self._playwright = sync_playwright().start()
            self._context = self._playwright.chromium.launch_persistent_context(
                user_data_dir=settings.DIR_PERFIL_EDGE,
                executable_path=edge_path,
                channel="msedge",
                headless=False,
                args=[
                    "--start-maximized",
                    "--disable-blink-features=AutomationControlled",
                ],
                no_viewport=True,
                locale="pt-BR",
            )
        except Exception as e:
            logger.erro(f"Não foi possível abrir o Edge: {e}")
            self._limpar()
            return None

        # Redireciona a aba inicial para a LUNA
        pagina = self._obter_ou_criar_aba_luna()
        if not pagina:
            logger.erro(
                "Edge abriu, mas não consegui carregar a LUNA. "
                "Verifique sua conexão e se a URL da LUNA está correta."
            )
            self.fechar()
            return None

        self.pagina = pagina
        logger.sucesso("Edge conectado à LUNA.")
        return pagina

    def fechar(self):
        """Fecha o Edge e libera todos os recursos do Playwright."""
        self._limpar()

    def parar_se_solicitado(self):
        """Lança OperacaoCancelada se o stop_event foi acionado."""
        if self._stop.is_set():
            raise OperacaoCancelada("STOP acionado pelo usuário.")

    def aguardar(self, segundos: float, passo: float = 0.1) -> bool:
        """
        Aguarda `segundos` verificando stop_event a cada `passo`.
        Retorna False se o stop foi solicitado durante a espera.
        """
        fim = time.time() + segundos
        while time.time() < fim:
            if self._stop.is_set():
                return False
            time.sleep(passo)
        return not self._stop.is_set()

    # -----------------------------------------------------------
    # Internos
    # -----------------------------------------------------------

    def _encontrar_edge(self) -> "str | None":
        for caminho in settings.EDGE_CAMINHOS:
            if os.path.exists(caminho):
                return caminho
        return None

    def _edge_ja_aberto(self) -> bool:
        """
        Verifica se há processos msedge.exe rodando.
        Usa tasklist (nativo do Windows) para não depender de psutil.
        """
        try:
            saida = subprocess.check_output(
                ["tasklist", "/FI", "IMAGENAME eq msedge.exe", "/NH"],
                stderr=subprocess.DEVNULL,
                timeout=5,
            ).decode("utf-8", errors="ignore")
            return "msedge.exe" in saida.lower()
        except Exception:
            # Se não conseguiu checar, assume que não está aberto e deixa o
            # Playwright tentar. O erro de "já aberto" aparecerá em seguida.
            return False

    def _obter_ou_criar_aba_luna(self) -> "Page | None":
        """
        Localiza a aba que contém a LUNA ou navega para ela.
        Aguarda até 15s para a página carregar.
        """
        if not self._context:
            return None

        # Procura aba já aberta na LUNA
        for aba in self._context.pages:
            try:
                url = aba.url or ""
                if "paschoalotto" in url and "leitor" not in url:
                    return aba
            except Exception:
                pass

        # Se não achou, usa a primeira aba (ou cria uma)
        try:
            if self._context.pages:
                pagina = self._context.pages[0]
            else:
                pagina = self._context.new_page()

            logger.info("Navegando para a LUNA...")
            pagina.goto(
                settings.ROTINA_LUNA_URL,
                wait_until="domcontentloaded",
                timeout=20_000,
            )
            pagina.wait_for_timeout(1_500)
            return pagina

        except Exception as e:
            logger.erro(f"Erro ao navegar para a LUNA: {e}")
            return None

    def _limpar(self):
        try:
            if self._context:
                self._context.close()
        except Exception:
            pass
        try:
            if self._playwright:
                self._playwright.stop()
        except Exception:
            pass
        self._context = None
        self._playwright = None
        self.pagina = None