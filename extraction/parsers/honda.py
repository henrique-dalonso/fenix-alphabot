"""
extraction/parsers/honda.py — Parser de dados da Honda.

Recebe o texto extraído do PDF e retorna um dicionário com os campos
que serão preenchidos na LUNA. Lógica baseada no AlphaBot comprovado
em produção (2+ meses sem intervenção), reescrita como função pura
— sem acesso a UI, sem estado global, testável isoladamente.

A Honda usa dois layouts de PDF:
  - "normal": cada campo em linha separada, CEP isolado
  - "compacto": cidade, UF e CEP na mesma linha
"""

import re
import unicodedata
from typing import Optional


Dados = dict[str, str]


def normalizar(texto: str, preservar_ponto: bool = False) -> str:
    """Remove acentos, converte para maiúsculo, remove caracteres especiais."""
    t = str(texto).upper()
    t = unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode()
    if preservar_ponto:
        t = re.sub(r"[^A-Z0-9\s/.]", "", t)
    else:
        t = re.sub(r"[^A-Z0-9\s/]", "", t)
    return re.sub(r"\s+", " ", t).strip()


def extrair_dados(texto: str) -> Optional[Dados]:
    """
    Extrai os dados de endereço do texto do PDF Honda.

    Retorna None se não encontrou dados suficientes para preencher com
    segurança — nesse caso o engine deve parar para revisão manual.
    """
    linhas = [l.strip() for l in texto.split("\n") if l.strip()]

    dados: Dados = {
        "cep": "", "estado": "", "cidade": "",
        "bairro": "", "numero": "", "endereco": "", "complemento": "",
    }

    candidatos = []

    # Layout normal: CEP sozinho numa linha, precedido de UF na linha anterior
    for i, linha in enumerate(linhas):
        if re.fullmatch(r"\d{8}", linha):
            if i >= 5 and re.fullmatch(r"[A-Z]{2}", linhas[i - 1]):
                candidatos.append(("normal", i))

    # Layout compacto: "CIDADE UF 12345678" na mesma linha
    for i, linha in enumerate(linhas):
        if re.search(r"\b[A-Z]{2}\s+\d{8}\b", linha):
            candidatos.append(("compacto", i))

    if not candidatos:
        return None

    # Usa o último candidato encontrado (mais próximo do rodapé = mais confiável)
    tipo, i = candidatos[-1]

    try:
        if tipo == "normal":
            dados["cep"] = linhas[i]
            dados["estado"] = linhas[i - 1]
            dados["cidade"] = linhas[i - 2]

            l3 = linhas[i - 3]
            l4 = linhas[i - 4]
            l5 = linhas[i - 5]
            l6 = linhas[i - 6] if i >= 6 else ""

            # Se a linha -4 é um número, estrutura é: endereço / número / bairro
            if re.fullmatch(r"\d+[A-Z]?", l4):
                dados["endereco"] = l5
                dados["numero"] = l4
                dados["bairro"] = l3
                dados["complemento"] = ""
            else:
                # Senão: endereço / número / bairro / complemento
                dados["endereco"] = l6
                dados["numero"] = l5
                dados["bairro"] = l4
                dados["complemento"] = l3

        elif tipo == "compacto":
            linha_cidade = linhas[i]
            linha_endereco = linhas[i - 1] if i >= 1 else ""

            cep_match = re.search(r"\b(\d{8})\b", linha_cidade)
            if not cep_match:
                return None

            cep = cep_match.group(1)
            partes_cidade = linha_cidade.split()
            idx_cep = partes_cidade.index(cep)

            dados["cep"] = cep
            dados["estado"] = partes_cidade[idx_cep - 1] if idx_cep >= 1 else ""
            dados["cidade"] = " ".join(partes_cidade[:idx_cep - 1])

            partes = linha_endereco.split()
            numero_idx = next(
                (j for j, p in enumerate(partes) if re.fullmatch(r"\d+[A-Z]?", p)),
                None,
            )

            if numero_idx is None:
                return None

            dados["endereco"] = " ".join(partes[:numero_idx])
            dados["numero"] = partes[numero_idx]
            dados["bairro"] = " ".join(partes[numero_idx + 1:])
            dados["complemento"] = ""

    except (IndexError, Exception):
        return None

    # Normaliza todos os campos de texto
    for campo in ("endereco", "bairro", "cidade", "estado", "complemento"):
        dados[campo] = normalizar(dados[campo])

    # Número: se vier "0", vira "S/N" no preenchimento (regra de negócio)
    dados["numero"] = dados["numero"].strip()

    # Validação mínima antes de retornar
    if not dados["cep"] or not dados["estado"] or not dados["cidade"] or not dados["endereco"]:
        return None

    if not re.fullmatch(r"\d{8}", dados["cep"]):
        return None

    if not re.fullmatch(r"[A-Z]{2}", dados["estado"]):
        return None

    return dados
