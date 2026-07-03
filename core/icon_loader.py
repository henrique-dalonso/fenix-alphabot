"""
Carregador de ícones do Fênix.

Os ícones em assets/icons/ são silhuetas brancas com canal alfa.
Esta função "tinge" a silhueta com a cor desejada (ex: cinza no modo
inativo, vermelho/branco no estado ativo) e devolve um CTkImage pronto
para uso — com cache, pra não reprocessar a mesma imagem toda hora.

Logos de marca (Honda/Volks) NÃO passam por tingimento — usam as
cores originais, só são redimensionadas.
"""

import os
from functools import lru_cache
from PIL import Image, ImageDraw
import customtkinter as ctk

DIR_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR_ICONS = os.path.join(DIR_BASE, "assets", "icons")
DIR_IMGS = os.path.join(DIR_BASE, "assets", "imgs")


@lru_cache(maxsize=256)
def _carregar_silhueta(nome: str) -> Image.Image:
    caminho = os.path.join(DIR_ICONS, f"{nome}.png")
    return Image.open(caminho).convert("RGBA")


def icone_tingido(nome: str, cor_hex: str, tamanho: int = 28) -> ctk.CTkImage:
    """
    Retorna um ícone (silhueta de assets/icons/<nome>.png) pintado
    com `cor_hex`, redimensionado com anti-aliasing.
    """
    base = _carregar_silhueta(nome)
    r = int(cor_hex[1:3], 16)
    g = int(cor_hex[3:5], 16)
    b = int(cor_hex[5:7], 16)

    tinta = Image.new("RGBA", base.size, (r, g, b, 255))
    tinta.putalpha(base.split()[3])

    tinta = tinta.resize((tamanho * 4, tamanho * 4), Image.LANCZOS).resize(
        (tamanho, tamanho), Image.LANCZOS
    )
    return ctk.CTkImage(light_image=tinta, dark_image=tinta, size=(tamanho, tamanho))


@lru_cache(maxsize=64)
def botao_circular(nome_icone: str, cor_fundo_hex: str, tamanho: int = 80, tamanho_icone: int = 34) -> ctk.CTkImage:
    """
    Retorna um CTkImage de um círculo preenchido com ícone centrado,
    renderizado em 8× e reduzido com LANCZOS — círculo perfeito garantido.
    """
    escala = 8
    dim = tamanho * escala

    img = Image.new("RGBA", (dim, dim), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    r = int(cor_fundo_hex[1:3], 16)
    g = int(cor_fundo_hex[3:5], 16)
    b = int(cor_fundo_hex[5:7], 16)
    draw.ellipse([0, 0, dim - 1, dim - 1], fill=(r, g, b, 255))

    silhueta = _carregar_silhueta(nome_icone)
    dim_ic = tamanho_icone * escala
    silhueta = silhueta.resize((dim_ic, dim_ic), Image.LANCZOS)
    off = (dim - dim_ic) // 2
    img.paste(silhueta, (off, off), silhueta)

    img = img.resize((tamanho, tamanho), Image.LANCZOS)
    return ctk.CTkImage(light_image=img, dark_image=img, size=(tamanho, tamanho))


def logo_marca(nome_arquivo: str, largura: int = 26) -> ctk.CTkImage:
    """
    Carrega uma logo de marca (assets/imgs/<nome_arquivo>) mantendo a
    proporção original e cores próprias (sem tingimento).
    """
    caminho = os.path.join(DIR_IMGS, nome_arquivo)
    img = Image.open(caminho).convert("RGBA")
    proporcao = img.height / img.width
    altura = int(largura * proporcao)
    img = img.resize((largura * 4, altura * 4), Image.LANCZOS).resize((largura, altura), Image.LANCZOS)
    return ctk.CTkImage(light_image=img, dark_image=img, size=(largura, altura))