"""
Logger central do Fênix.

Por que isso existe como módulo separado:
No AlphaBot antigo, log() era um método dentro da classe gigante da UI,
misturando "imprimir mensagem" com "atualizar widget". Aqui o logger
é independente de interface: qualquer módulo (extração, browser,
engine Honda/Volks) pode logar sem saber que existe uma UI.

A UI apenas "escuta" esses eventos através de uma fila (queue),
exatamente como antes — mas agora de forma desacoplada.
"""

import queue
import time
import os
from datetime import datetime
from config import settings

NIVEL_INFO = "INFO"
NIVEL_SUCESSO = "SUCESSO"
NIVEL_AVISO = "AVISO"
NIVEL_ERRO = "ERRO"
NIVEL_RECOVERY = "RECOVERY"
NIVEL_DEBUG = "DEBUG"


class FenixLogger:
    """
    Logger central. Envia mensagens para:
    1) uma fila (consumida pela UI em tempo real)
    2) um arquivo de log em disco (auditoria — requisito do projeto)
    """

    def __init__(self, nome_arquivo: str = "fenix.log"):
        self.fila: "queue.Queue[dict]" = queue.Queue()
        self.caminho_arquivo = os.path.join(settings.DIR_LOGS, nome_arquivo)

    def _registrar(self, nivel: str, mensagem: str):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        evento = {"timestamp": timestamp, "nivel": nivel, "mensagem": mensagem}

        # fila para a UI consumir
        self.fila.put(evento)

        # arquivo para auditoria (nunca falha silenciosamente,
        # mas também nunca derruba o bot por erro de IO)
        try:
            with open(self.caminho_arquivo, "a", encoding="utf-8") as f:
                f.write(f"[{timestamp}] [{nivel}] {mensagem}\n")
        except Exception:
            pass

    def info(self, mensagem: str):
        self._registrar(NIVEL_INFO, mensagem)

    def sucesso(self, mensagem: str):
        self._registrar(NIVEL_SUCESSO, mensagem)

    def aviso(self, mensagem: str):
        self._registrar(NIVEL_AVISO, mensagem)

    def erro(self, mensagem: str):
        self._registrar(NIVEL_ERRO, mensagem)

    def recovery(self, mensagem: str):
        self._registrar(NIVEL_RECOVERY, mensagem)

    def debug(self, mensagem: str):
        if settings.DEBUG:
            self._registrar(NIVEL_DEBUG, mensagem)


# Logger único compartilhado pela aplicação inteira.
logger = FenixLogger()
