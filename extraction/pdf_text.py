"""
extraction/pdf_text.py — Download e extração de texto de PDF.

Usado pela Honda (texto nativo do PDF).
A Volks usa OCR via pytesseract — isso fica em extraction/pdf_ocr.py (futuro).
"""

import os
import tempfile

import requests
import fitz  # PyMuPDF

from core.logger import logger


# Resultado sentinela — distingue "PDF com erro" de "PDF sem texto" (imagem escaneada)
ERRO_PDF = "ERRO_PDF"


def baixar_e_extrair_texto(url: str, timeout: int = 15) -> "str | None":
    """
    Baixa o PDF em `url` e retorna o texto extraído.

    Retornos:
        str   → texto do PDF (pode estar vazio se for scan)
        None  → PDF válido mas sem texto interno (scan puro)
        ERRO_PDF → falha de download, arquivo inválido ou erro de leitura
    """
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
