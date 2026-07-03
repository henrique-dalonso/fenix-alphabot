"""
Gerador de ícones do Fênix.

Desenhos próprios (não copiados de nenhuma biblioteca de ícones),
em SVG, renderizados em alta resolução via cairosvg e depois
reduzidos com LANCZOS — isso elimina o serrilhado que aparecia
com a fonte de glifos (Segoe MDL2 Assets) em tamanho pequeno.

Cada ícone é salvo como PNG branco com canal alfa (silhueta).
A cor final é aplicada em tempo de execução (tingimento), para
funcionar nos dois temas (claro/escuro) e nos estados ativo/inativo.

Rodar este script gera/atualiza tudo em assets/icons/.
"""

import os
import cairosvg
from PIL import Image

DIR_ICONS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "icons")
os.makedirs(DIR_ICONS, exist_ok=True)

TAMANHO_RENDER = 512  # renderiza grande, depois a UI reduz com LANCZOS

# Todos os ícones desenhados em viewBox 0 0 24 24, traço uniforme, estilo "outline"
ICONES_SVG = {
    "engrenagem": """
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fill="white" fill-rule="evenodd" d="
            M12 1.6c.5 0 1 .04 1.4.1l.5 2.4c.7.15 1.3.4 1.9.7l2-1.4c.8.5 1.5 1.2 2.1 1.9l-1.3 2c.3.6.55 1.2.7 1.9l2.4.5c.07.45.1.95.1 1.4s-.04 1-.1 1.4l-2.4.5c-.15.7-.4 1.3-.7 1.9l1.3 2c-.55.8-1.25 1.5-2.05 2.1l-2-1.3c-.6.3-1.25.55-1.9.7l-.5 2.4c-.45.07-.95.1-1.45.1s-1-.04-1.4-.1l-.5-2.4c-.7-.15-1.3-.4-1.9-.7l-2 1.3c-.8-.55-1.5-1.25-2.1-2.05l1.3-2c-.3-.6-.55-1.25-.7-1.9l-2.4-.5c-.07-.45-.1-.95-.1-1.45s.04-1 .1-1.4l2.4-.5c.15-.7.4-1.3.7-1.9l-1.3-2c.55-.8 1.25-1.5 2.05-2.1l2 1.3c.6-.3 1.25-.55 1.9-.7z
            M12 8.7a3.3 3.3 0 1 0 0 6.6 3.3 3.3 0 0 0 0-6.6z" />
        </svg>
    """,
    "lua": """
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fill="white" d="M20.3 14.8A8.6 8.6 0 1 1 9.2 3.7a7 7 0 0 0 11.1 11.1z"/>
        </svg>
    """,
    "sol": """
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round">
            <circle cx="12" cy="12" r="4.2" fill="white" stroke="none"/>
            <path d="M12 2.2v2.4 M12 19.4v2.4 M21.8 12h-2.4 M4.6 12H2.2
                     M18.7 5.3l-1.7 1.7 M7 17l-1.7 1.7
                     M18.7 18.7L17 17 M7 7 5.3 5.3"/>
          </g>
        </svg>
    """,
    "documento": """
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="white" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
            <path d="M6.5 2.8h7.4l4.6 4.6v13.8h-12z"/>
            <path d="M13.6 2.8v4.8h4.6"/>
            <path d="M9 13.2h6 M9 16.6h6"/>
          </g>
        </svg>
    """,
    "lista_check": """
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="white" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
            <rect x="4" y="3.5" width="16" height="17" rx="2.2"/>
            <path d="M8 9.2l1.8 1.8 3.4-3.4 M8 15.8l1.8 1.8 3.4-3.4"/>
          </g>
        </svg>
    """,
    "gravar": """
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="white" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
            <path d="M5 3.5h11.5L20.5 7.5V20.5H5z"/>
            <path d="M8 3.5v6h8v-6"/>
            <path d="M8 20.5v-6.5h8v6.5"/>
          </g>
        </svg>
    """,
    "atividade": """
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="white" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
            <path d="M2.5 13.5h4l2.2-6.5 3.5 12 2.4-8.2 1.7 2.7h5.2"/>
          </g>
        </svg>
    """,
    "play": """
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path fill="white" d="M7.5 4.8v14.4c0 .8.9 1.3 1.6.9l11.4-7.2c.7-.4.7-1.4 0-1.8L9.1 3.9c-.7-.4-1.6.1-1.6.9z"/>
        </svg>
    """,
    "stop": """
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="12" height="12" rx="2.5" fill="white"/>
        </svg>
    """,
    "alerta": """
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="white" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round">
            <path d="M12 3.2L2.6 20h18.8z"/>
            <path d="M12 9.6v4.6"/>
            <circle cx="12" cy="17.2" r="0.9" fill="white" stroke="none"/>
          </g>
        </svg>
    """,
    "recovery": """
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 11A8 8 0 1 0 18.6 16"/>
            <path d="M20 5.5v5.5h-5.5"/>
          </g>
        </svg>
    """,
}


def gerar_icones():
    for nome, svg in ICONES_SVG.items():
        caminho_png = os.path.join(DIR_ICONS, f"{nome}.png")
        cairosvg.svg2png(
            bytestring=svg.encode("utf-8"),
            write_to=caminho_png,
            output_width=TAMANHO_RENDER,
            output_height=TAMANHO_RENDER,
        )
        print(f"Ícone gerado: {caminho_png}")


if __name__ == "__main__":
    gerar_icones()