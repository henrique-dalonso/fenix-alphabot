"""
extraction/pdf_text.py — Download e extração de texto de PDF.

Usado pela Honda (texto nativo do PDF).
A Volks usa OCR via pytesseract — isso fica em extraction/pdf_ocr.py (futuro).
"""

import os
import tempfile
import threading

import requests
import fitz  # PyMuPDF

from core.logger import logger


# Resultado sentinela — distingue "PDF com erro" de "PDF sem texto" (imagem escaneada)
ERRO_PDF = "ERRO_PDF"


def baixar_e_extrair_texto(url: str, timeout: int = 15, timeout_total: int = 45) -> "str | None":
    """
    Baixa o PDF em `url` e retorna o texto extraído, com um teto de tempo
    REAL (`timeout_total`) para toda a operação — download + abertura do
    PyMuPDF (`fitz`) + leitura das páginas.

    CORRIGIDO (causa raiz de "quando é FALTANDO ENDERECO, o robô só para
    e não preenche nada" — encontrada comparando `logs/fenix.log`: o
    MESMO caso travava de forma idêntica tanto na engine antiga
    (`evaluate()`) quanto na nova (locators nativos, réplica do
    AlphaBot) logo após "PDF aberto para conferência visual", sem
    nenhum erro no log — prova de que o travamento não tinha nada a ver
    com a reescrita da interação com a LUNA, e sim com este módulo, que
    não mudou entre as duas sessões): o parâmetro `timeout` do
    `requests.get` só cobre o tempo ENTRE bytes recebidos, não o tempo
    TOTAL do download — um PDF grande (típico de um scan/imagem, que é
    justamente o cenário que vira FALTANDO ENDERECO) enviado aos
    poucos nunca dispara esse timeout. Pior: `fitz.open()`/`get_text()`
    (PyMuPDF) não tem NENHUM timeout nativo — um PDF problemático pode
    travar essa chamada para sempre, e como isto roda direto na thread
    do engine, sem nenhuma checagem de STOP no meio, o robô inteiro
    congela silenciosamente (nem sequer chega a marcar ERRO NO PDF).

    A função agora roda numa thread auxiliar com um teto real de
    `timeout_total` segundos: se não terminar a tempo, loga um erro
    claro e retorna ERRO_PDF, deixando o engine seguir para o próximo
    caso (marcando ESTE como "ERRO NO PDF" para revisão manual) em vez
    de travar para sempre. A thread órfã não pode ser morta de fora
    (limitação do Python/PyMuPDF), mas é daemon — não impede o Fênix de
    fechar — e seu resultado, quando finalmente chegar, é descartado.
    """
    resultado: dict = {}

    def _trabalho():
        resultado["valor"] = _baixar_e_extrair_texto_interno(url, timeout)

    thread = threading.Thread(target=_trabalho, daemon=True, name="PdfDownloadThread")
    thread.start()
    thread.join(timeout_total)

    if thread.is_alive():
        logger.erro(
            f"Download/extração do PDF não respondeu em {timeout_total}s "
            f"(provável PDF grande/corrompido travando a leitura). URL: {url}"
        )
        return ERRO_PDF

    return resultado.get("valor", ERRO_PDF)


def _baixar_e_extrair_texto_interno(url: str, timeout: int) -> "str | None":
    caminho_temp = None

    try:
        try:
            resp = requests.get(url, timeout=timeout)
        except requests.exceptions.Timeout:
            logger.erro("Timeout ao baixar PDF.")
            return ERRO_PDF
        except Exception as e:
            logger.erro(f"Erro de rede ao baixar PDF: {e}")
            return ERRO_PDF

        if resp.status_code != 200:
            logger.erro(f"PDF retornou HTTP {resp.status_code}.")
            return ERRO_PDF

        conteudo = resp.content

        if not conteudo or len(conteudo) < 100:
            logger.erro("PDF inválido ou vazio.")
            return ERRO_PDF

        if not conteudo[:20].lstrip().startswith(b"%PDF"):
            logger.erro("Arquivo baixado não é um PDF válido.")
            return ERRO_PDF

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as f:
            caminho_temp = f.name
            f.write(conteudo)

        try:
            pdf = fitz.open(caminho_temp)
        except Exception as e:
            logger.erro(f"Erro ao abrir PDF: {e}")
            return ERRO_PDF

        try:
            if pdf.page_count == 0:
                logger.erro("PDF sem páginas.")
                pdf.close()
                return ERRO_PDF

            texto = "".join(pagina.get_text() for pagina in pdf).strip()
            pdf.close()
        except Exception as e:
            try:
                pdf.close()
            except Exception:
                pass
            logger.erro(f"Erro ao ler páginas do PDF: {e}")
            return ERRO_PDF

        # Texto vazio = PDF escaneado (sem camada de texto)
        return texto if texto else None

    except Exception as e:
        logger.erro(f"Erro inesperado ao extrair PDF: {e}")
        return ERRO_PDF

    finally:
        if caminho_temp:
            try:
                os.remove(caminho_temp)
            except Exception:
                pass
