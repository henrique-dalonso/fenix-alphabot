"""
Ponto de entrada do Fênix.

Executar com: python app.py
"""

from ui.main_window import FenixApp
from core.logger import logger
from config import settings

if __name__ == "__main__":
    logger.info(f"{settings.APP_NAME} {settings.APP_VERSION} iniciado.")
    app = FenixApp()
    app.mainloop()
