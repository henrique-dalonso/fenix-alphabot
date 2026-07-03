"""
Componentes visuais reutilizáveis do Fênix — v4.

Correções desta versão:
- Tooltip reescrito com tkinter.Toplevel nativo (withdraw/deiconify)
  para eliminar o bug de ficar grudado na tela no Windows.
- BotaoIcone: corner_radius = tamanho // 2 garante círculo perfeito.
- Fênix real usada como logo na sidebar (assets/imgs/fenix_logo.png).
"""

import tkinter as tk
import customtkinter as ctk
from ui import theme
from core.icon_loader import icone_tingido


class _Tooltip:
    """
    Tooltip leve usando tkinter.Toplevel nativo.
    Usa withdraw/deiconify em vez de criar/destruir janela a cada hover
    — elimina o flash e o bug de ficar preso na tela no Windows.
    """

    def __init__(self, widget, texto: str):
        self.widget = widget
        self.texto = texto
        self._janela: tk.Toplevel | None = None
        widget.bind("<Enter>", self._mostrar, add="+")
        widget.bind("<Leave>", self._esconder, add="+")
        widget.bind("<Button-1>", self._esconder, add="+")
        widget.bind("<Destroy>", self._destruir, add="+")

    def _mostrar(self, _event=None):
        if not self.texto:
            return
        if self._janela is None:
            self._janela = tk.Toplevel(self.widget)
            self._janela.overrideredirect(True)
            self._janela.attributes("-topmost", True)
            label = tk.Label(
                self._janela, text=self.texto,
                background="#111827", foreground="#ffffff",
                font=("Segoe UI", 10), padx=8, pady=4,
                relief="flat"
            )
            label.pack()
        x = self.widget.winfo_rootx() + self.widget.winfo_width() // 2
        y = self.widget.winfo_rooty() + self.widget.winfo_height() + 6
        self._janela.geometry(f"+{x}+{y}")
        self._janela.deiconify()

    def _esconder(self, _event=None):
        if self._janela is not None:
            self._janela.withdraw()

    def _destruir(self, _event=None):
        if self._janela is not None:
            self._janela.destroy()
            self._janela = None


class BotaoIcone(ctk.CTkButton):
    """Botão 100% redondo com ícone PNG tingido + tooltip."""

    def __init__(self, parent, nome_icone: str, tooltip: str = "", tamanho: int = 44,
                 tamanho_icone: int = 22, cor_fundo=None, cor_fundo_hover=None,
                 cor_icone="#475569", command=None, **kwargs):
        self.nome_icone = nome_icone
        self.tamanho_icone = tamanho_icone
        self.cor_icone_atual = cor_icone

        super().__init__(
            parent,
            text="",
            image=icone_tingido(nome_icone, cor_icone, tamanho_icone),
            width=tamanho,
            height=tamanho,
            corner_radius=tamanho,         # valor alto → CTk clipa em tamanho//2, círculo perfeito
            fg_color=cor_fundo or "transparent",
            hover_color=cor_fundo_hover,
            command=command,
            **kwargs,
        )
        self.tooltip_texto = tooltip
        self._tt = _Tooltip(self, tooltip) if tooltip else None

    def definir_cor_icone(self, cor_hex: str):
        self.cor_icone_atual = cor_hex
        self.configure(image=icone_tingido(self.nome_icone, cor_hex, self.tamanho_icone))

    def trocar_icone(self, nome_icone: str, cor_hex: str = None):
        self.nome_icone = nome_icone
        cor = cor_hex or self.cor_icone_atual
        self.configure(image=icone_tingido(nome_icone, cor, self.tamanho_icone))


class BotaoLogoNav(ctk.CTkButton):
    """Botão de navegação da sidebar com logo de marca + tooltip."""

    def __init__(self, parent, imagem_logo, tooltip: str, cores: dict, command=None):
        super().__init__(
            parent, text="", image=imagem_logo, width=64, height=52,
            corner_radius=14, fg_color="transparent",
            hover_color=cores["icone_hover"], command=command,
        )
        self.cores = cores
        self.ativo = False
        self._tt = _Tooltip(self, tooltip)

    def definir_ativo(self, ativo: bool):
        self.ativo = ativo
        if ativo:
            self.configure(fg_color=self.cores["fundo_painel_alt"],
                           border_width=2, border_color=theme.COR_PRIMARIA)
        else:
            self.configure(fg_color="transparent", border_width=0)


class CartaoStatus(ctk.CTkFrame):
    """Indicador de status (PDF / CAMPOS / GRAVAÇÃO) com ícone PNG + estado."""

    def __init__(self, parent, nome_icone: str, titulo: str, cores: dict):
        super().__init__(parent, fg_color=cores["fundo_painel"], corner_radius=theme.RAIO_PAINEL)
        self.cores = cores
        self.nome_icone = nome_icone

        self.label_icone = ctk.CTkLabel(
            self, text="",
            image=icone_tingido(nome_icone, cores["icone_inativo"], theme.TAMANHO_ICONE_CARTAO)
        )
        self.label_icone.grid(row=0, column=0, rowspan=2, padx=(16, 12), pady=16)

        self.label_titulo = ctk.CTkLabel(
            self, text=titulo, font=theme.FONTE_LABEL_PEQUENA,
            text_color=cores["texto_secundario"], anchor="w"
        )
        self.label_titulo.grid(row=0, column=1, sticky="w", pady=(16, 0))

        self.label_estado = ctk.CTkLabel(
            self, text="—", font=theme.FONTE_STATUS,
            text_color=cores["texto_principal"], anchor="w"
        )
        self.label_estado.grid(row=1, column=1, sticky="w", pady=(0, 16))

    def atualizar(self, texto: str, cor_icone: str = None):
        self.label_estado.configure(text=texto)
        if cor_icone:
            self.label_icone.configure(
                image=icone_tingido(self.nome_icone, cor_icone, theme.TAMANHO_ICONE_CARTAO)
            )

    def aplicar_tema(self, cores: dict):
        self.cores = cores
        self.configure(fg_color=cores["fundo_painel"])
        self.label_titulo.configure(text_color=cores["texto_secundario"])
        self.label_estado.configure(text_color=cores["texto_principal"])
        self.label_icone.configure(
            image=icone_tingido(self.nome_icone, cores["icone_inativo"], theme.TAMANHO_ICONE_CARTAO)
        )