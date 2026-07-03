"""
Tema visual do Fênix — v2.

Mudanças em relação à v1 (descartada a pedido do usuário):
- Suporte real a modo claro/escuro, com paleta própria para cada um
  (não apenas delegado ao CustomTkinter — cores de marca continuam
  consistentes nos dois modos).
- Ícones via fonte "Segoe MDL2 Assets", nativa do Windows. Isso evita
  carregar arquivos de ícone (.png/.svg) no pacote final — importante
  para o requisito de portabilidade via .exe.
"""

# -----------------------------------------------------------
# Ícones — ver core/icon_loader.py (silhuetas PNG em assets/icons/,
# tingidas em tempo de execução). Os nomes abaixo batem com os
# arquivos gerados por assets/gerar_icones.py.
# -----------------------------------------------------------
ICONE_PLAY = "play"
ICONE_STOP = "stop"
ICONE_SOL = "sol"
ICONE_LUA = "lua"
ICONE_ENGRENAGEM = "engrenagem"
ICONE_ALERTA = "alerta"
ICONE_RECOVERY = "recovery"
ICONE_DOC = "documento"
ICONE_CAMPOS = "lista_check"
ICONE_GRAVAR = "gravar"
ICONE_LOG = "atividade"

FONTE_TITULO = ("Segoe UI", 32, "bold")
FONTE_SUBTITULO = ("Segoe UI", 16)
FONTE_BOTAO = ("Segoe UI", 14, "bold")
FONTE_LOG = ("Consolas", 13)
FONTE_STATUS = ("Segoe UI", 15, "bold")
FONTE_LABEL_PEQUENA = ("Segoe UI", 12)

RAIO_BOTAO = 14
RAIO_PAINEL = 18
RAIO_ICONE = 16

LARGURA_SIDEBAR = 100
TAMANHO_ICONE_NAV = 38
TAMANHO_ICONE_RODAPE = 30
TAMANHO_ICONE_CARTAO = 34

# -----------------------------------------------------------
# Paletas — claro e escuro
# -----------------------------------------------------------
PALETA_CLARA = {
    "fundo_app": "#f4f5f7",
    "fundo_sidebar": "#ffffff",
    "fundo_painel": "#ffffff",
    "fundo_painel_alt": "#f8fafc",
    "borda": "#e5e7eb",
    "texto_principal": "#111827",
    "texto_secundario": "#6b7280",
    "texto_invertido": "#ffffff",
    "icone_inativo": "#9ca3af",
    "icone_hover": "#f3f4f6",
}

PALETA_ESCURA = {
    "fundo_app": "#15171c",
    "fundo_sidebar": "#1b1e25",
    "fundo_painel": "#1f232b",
    "fundo_painel_alt": "#262a33",
    "borda": "#2c303a",
    "texto_principal": "#f3f4f6",
    "texto_secundario": "#9ca3af",
    "texto_invertido": "#0f1115",
    "icone_inativo": "#6b7280",
    "icone_hover": "#2c303a",
}

# Cores de marca/identidade — fixas nos dois modos (não mudam com o tema)
COR_PRIMARIA = "#dc2626"        # vermelho fênix — ação principal
COR_PRIMARIA_HOVER = "#b91c1c"
COR_SUCESSO = "#16a34a"
COR_AVISO = "#d97706"
COR_ERRO = "#dc2626"
COR_RECOVERY = "#7c3aed"
COR_INFO = "#2563eb"


class GerenciadorTema:
    """Resolve a paleta ativa (clara/escura) para os widgets consultarem."""

    def __init__(self, modo: str = "light"):
        self.modo = modo

    def cores(self) -> dict:
        return PALETA_ESCURA if self.modo == "dark" else PALETA_CLARA

    def alternar(self) -> str:
        self.modo = "dark" if self.modo == "light" else "light"
        return self.modo

    @property
    def icone_alternar_tema(self) -> str:
        # Mostra o ícone do que o clique VAI ativar (sol = ir pro claro)
        return ICONE_SOL if self.modo == "dark" else ICONE_LUA