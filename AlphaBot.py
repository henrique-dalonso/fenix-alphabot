from playwright.sync_api import sync_playwright

# =========================================================
# IMPORTS E DEPENDÊNCIAS GERAIS
# =========================================================
import requests
import fitz
import re
import time
import unicodedata
import threading
import queue
import tkinter as tk
from tkinter import scrolledtext, ttk

try:
    from PIL import Image, ImageDraw, ImageTk, ImageOps, ImageEnhance, ImageFilter
except Exception:
    Image = None
    ImageDraw = None
    ImageTk = None
import subprocess
import os
import tempfile
import json

try:
    import websocket
except Exception:
    websocket = None


try:
    import pytesseract
except Exception:
    pytesseract = None



# =========================================================
# CONFIGURAÇÕES GERAIS / CONSTANTES COMPARTILHADAS
# =========================================================
BASE_URL = "https://npjur.paschoalotto.com.br"
ROTINA_LUNA_URL = "https://npjur.paschoalotto.com.br/sistema/relatorios/robots/catia_rotina1.php"
MAX_TENTATIVAS_RECOVERY = 3
WATCHDOG_CASO_SEGUNDOS = 180
DEBUG = False

MODULOS_LUNA = {
    "HONDA": {
        "banco": "ADMINISTRADORA DE CONSORCIO NACIONAL HONDA",
        "banco_value": "1",
        "tipo": "CONTRATO DE ALIENAÇÃO",
        "tipo_value": "1",
        "ativo": True
    },
    "VOLKS": {
        "banco": "BANCO VOLKSWAGEN",
        "banco_value": "12",
        "tipo": "CONTRATO_VWCDC",
        "tipo_value": "17",
        "ativo": True
    }
}



# =========================================================
# UI COMPARTILHADA - COMPONENTES VISUAIS BASE
# =========================================================
class RoundedButton(tk.Canvas):
    def __init__(self, parent, text, command=None, width=160, height=36, radius=18,
                 bg="#eef2ff", fg="#1e3a8a", hover_bg=None, font=("Segoe UI", 9, "bold"),
                 border="#dbe4ff"):
        super().__init__(parent, width=width, height=height, highlightthickness=0, bd=0, bg=parent.cget("bg"))
        self.command = command
        self.text = text
        self.width_value = width
        self.height_value = height
        self.radius = radius
        self.normal_bg = bg
        self.hover_bg = hover_bg or bg
        self.fg = fg
        self.border = border
        self.font_value = font
        self.state = "normal"
        self._button_photo = None
        self._draw(bg)
        self.bind("<Button-1>", self._click)
        self.bind("<Enter>", lambda _e: self._draw(self.hover_bg) if self.state == "normal" else None)
        self.bind("<Leave>", lambda _e: self._draw(self.normal_bg) if self.state == "normal" else None)
        self.configure(cursor="hand2")

    def _draw_antialiased_background(self, fill, outline):
        """Desenha o botão em alta resolução e reduz com LANCZOS.
        Isso remove o serrilhado das bordas arredondadas do Canvas padrão.
        """
        if Image is None or ImageDraw is None or ImageTk is None:
            return False

        try:
            escala = 4
            w = int(self.width_value)
            h = int(self.height_value)
            r = int(self.radius)

            img = Image.new("RGBA", (w * escala, h * escala), (255, 255, 255, 0))
            draw = ImageDraw.Draw(img)

            margem = 1 * escala
            raio = max(1, r * escala)
            largura_borda = max(1, 1 * escala)

            draw.rounded_rectangle(
                (margem, margem, w * escala - margem, h * escala - margem),
                radius=raio,
                fill=fill,
                outline=outline,
                width=largura_borda
            )

            img = img.resize((w, h), Image.Resampling.LANCZOS)
            self._button_photo = ImageTk.PhotoImage(img)
            self.create_image(w / 2, h / 2, image=self._button_photo)
            return True
        except Exception:
            return False

    def _rounded_rect_fallback(self, x1, y1, x2, y2, r, **kwargs):
        points = [
            x1+r, y1, x2-r, y1, x2, y1, x2, y1+r,
            x2, y2-r, x2, y2, x2-r, y2, x1+r, y2,
            x1, y2, x1, y2-r, x1, y1+r, x1, y1
        ]
        return self.create_polygon(points, smooth=True, **kwargs)

    def _draw(self, fill):
        self.delete("all")
        if self.state == "disabled":
            fill = "#e5e7eb"
            fg = "#9ca3af"
            outline = "#e5e7eb"
        else:
            fg = self.fg
            outline = self.border

        desenhou = self._draw_antialiased_background(fill, outline)
        if not desenhou:
            self._rounded_rect_fallback(
                1, 1, self.width_value - 1, self.height_value - 1, self.radius,
                fill=fill,
                outline=outline
            )

        self.create_text(self.width_value / 2, self.height_value / 2, text=self.text,
                         fill=fg, font=self.font_value)

    def _click(self, _event):
        if self.state != "normal":
            return
        if self.command:
            self.command()

    def config(self, **kwargs):
        if "text" in kwargs:
            self.text = kwargs.pop("text")
        if "state" in kwargs:
            self.state = kwargs.pop("state")
        if "bg" in kwargs:
            self.normal_bg = kwargs.pop("bg")
        if "hover_bg" in kwargs:
            self.hover_bg = kwargs.pop("hover_bg")
        if "fg" in kwargs:
            self.fg = kwargs.pop("fg")
        if "border" in kwargs:
            self.border = kwargs.pop("border")
        self._draw(self.normal_bg)
        if kwargs:
            super().config(**kwargs)

    configure = config




# =========================================================
# APLICAÇÃO PRINCIPAL - CONTAINER HONDA + VOLKS
# =========================================================
class BotLunaApp:
    def __init__(self, root):
        self.root = root
        self.root.title("AlphaBot")
        self.root.geometry("1180x860")
        self.root.resizable(True, True)

        self.log_queue = queue.Queue()
        self.bot_thread = None
        self.stop_event = threading.Event()
        self.pause_event = threading.Event()
        self.volks_gravar_conferido_event = threading.Event()
        self.running = False

        self.total_casos = "-"
        self.feitos = "-"

        self.meta_casos = None
        # Mantém o contador real de FEITOS enquanto o app estiver aberto.
        # STOP, refresh e recovery não zeram este valor.
        self.casos_processados_sessao = 0
        self.meta_total_validada = False
        self.feitos_inicio_meta = None
        self.meta_restante_inicial = None
        self.total_inicial_luna = None
        self.meta_validada_no_inicio = False

        self.tempos_ultimos_casos = []
        self.tempo_estimado_base_segundos = None
        self.tempo_estimado_base_momento = None
        self.casos_desde_recalculo_estimativa = 0
        self.recalcular_estimativa_proximo_caso = True

        self.tempo_inicio = None
        self.inicio_caso = None
        self.run_atual_ativa = False
        self.ultima_run_segundos = None

        self.pausa_inicio = None
        self.tempo_total_pausado = 0
        self.tempo_caso_pausado = 0

        self.recovery_pendente = False
        self.ultimo_motivo_recovery = ""
        self.ultimos_dialogs_luna = []
        self.dialog_sessao_bloqueada = False

        # Central de estado / diagnóstico visual. Não cria arquivos no PC.
        self.status_luna_atual = "AGUARDANDO"
        self.status_pdf_atual = "-"
        self.status_campos_atual = "-"
        self.status_gravar_atual = "-"
        self.ultimo_erro_atual = "-"
        self.total_recoveries = 0
        self.total_watchdogs = 0
        self.total_erros = 0
        self.ultimo_log_normalizado = None
        self.repeticoes_log_igual = 0

        self.criar_interface()
        self.processar_logs()


    # =====================================================
    # UI PRINCIPAL / SELETOR DE MÓDULOS
    # =====================================================
    def criar_interface(self):
        self.modulo_atual = "HONDA"

        self.root.configure(bg="#eef1f5")

        shell = tk.Frame(self.root, bg="#eef1f5")
        shell.pack(fill="both", expand=True, padx=8, pady=8)

        # Seletor principal de módulo. Substitui as abas pequenas padrão por botões maiores e mais limpos.
        modulo_barra = tk.Frame(shell, bg="#eef1f5")
        modulo_barra.pack(fill="x", pady=(0, 8))

        modulo_centro = tk.Frame(modulo_barra, bg="#eef1f5")
        modulo_centro.pack(anchor="center")

        self.btn_modulo_honda = RoundedButton(
            modulo_centro,
            text="HONDA",
            width=150,
            height=40,
            radius=18,
            command=lambda: self.selecionar_modulo("HONDA"),
            bg="#1d4ed8",
            hover_bg="#2563eb",
            fg="#ffffff",
            border="#1d4ed8",
            font=("Segoe UI", 11, "bold")
        )
        self.btn_modulo_honda.pack(side="left", padx=(0, 10))

        self.btn_modulo_volks = RoundedButton(
            modulo_centro,
            text="VOLKS",
            width=150,
            height=40,
            radius=18,
            command=lambda: self.selecionar_modulo("VOLKS"),
            bg="#ffffff",
            hover_bg="#f8fafc",
            fg="#334155",
            border="#d6deea",
            font=("Segoe UI", 11, "bold")
        )
        self.btn_modulo_volks.pack(side="left")

        self.modulo_container = tk.Frame(shell, bg="#eef1f5")
        self.modulo_container.pack(fill="both", expand=True)

        self.honda_frame = tk.Frame(self.modulo_container, bg="#f3f5f8")
        self.volks_frame = tk.Frame(self.modulo_container, bg="#f3f5f8")

        self.criar_tela_honda(self.honda_frame)
        self.criar_tela_volks(self.volks_frame)

        self.honda_frame.pack(fill="both", expand=True)
        self.atualizar_botoes_modulo()


    # =====================================================
    # UI HONDA - TELA, STATUS, WORKFLOW E CONTROLES
    # =====================================================
    def criar_tela_honda(self, parent):
        # Subabas internas do módulo HONDA com visual próprio.
        # Operação fica limpa e visual; Status concentra logs e diagnóstico técnico.
        self.painel_honda_atual = "OPERACAO"

        honda_shell = tk.Frame(parent, bg="#f3f5f8")
        honda_shell.pack(fill="both", expand=True)

        painel_barra = tk.Frame(honda_shell, bg="#f3f5f8")
        painel_barra.pack(fill="x", padx=18, pady=(2, 6))

        # Navegação secundária: menor e mais discreta que HONDA/VOLKS.
        # Mesma largura visual do seletor HONDA/VOLKS para ficar perfeitamente alinhado,
        # mas com botões menores e mais discretos no centro.
        # Navegação secundária alinhada pelo mesmo eixo central de HONDA/VOLKS.
        # Os botões têm a mesma largura para que a divisão entre OPERAÇÃO e STATUS
        # fique exatamente no centro visual, sem deslocamento para a direita.
        painel_centro = tk.Frame(painel_barra, bg="#f3f5f8", width=310, height=26)
        painel_centro.pack(anchor="center")
        painel_centro.pack_propagate(False)

        painel_botoes = tk.Frame(painel_centro, bg="#f3f5f8")
        painel_botoes.place(relx=0.5, rely=0.5, anchor="center")

        self.btn_painel_operacao = RoundedButton(
            painel_botoes,
            text="OPERAÇÃO",
            width=84,
            height=22,
            radius=10,
            command=lambda: self.selecionar_painel_honda("OPERACAO"),
            bg="#ffffff",
            hover_bg="#f8fafc",
            fg="#475569",
            border="#dbe3ef",
            font=("Segoe UI", 7, "bold")
        )
        self.btn_painel_operacao.pack(side="left", padx=(0, 4))

        self.btn_painel_status = RoundedButton(
            painel_botoes,
            text="STATUS",
            width=84,
            height=22,
            radius=10,
            command=lambda: self.selecionar_painel_honda("STATUS"),
            bg="#ffffff",
            hover_bg="#f8fafc",
            fg="#64748b",
            border="#dbe3ef",
            font=("Segoe UI", 7, "bold")
        )
        self.btn_painel_status.pack(side="left", padx=(4, 0))

        self.honda_painel_container = tk.Frame(honda_shell, bg="#f3f5f8")
        self.honda_painel_container.pack(fill="both", expand=True)

        self.honda_operacao_frame = tk.Frame(self.honda_painel_container, bg="#f3f5f8")
        self.honda_status_frame = tk.Frame(self.honda_painel_container, bg="#f3f5f8")

        parent = self.honda_operacao_frame
        status_parent = self.honda_status_frame

        # ===== OPERAÇÃO =====
        container = tk.Frame(parent, bg="#f3f5f8")
        container.pack(fill="both", expand=True, padx=18, pady=16)

        header = tk.Frame(container, bg="#ffffff", bd=0, relief="flat")
        header.pack(fill="x", pady=(0, 14))
        header.grid_columnconfigure(0, weight=1)
        header.grid_columnconfigure(1, weight=1)
        header.grid_columnconfigure(2, weight=1)
        header.grid_columnconfigure(3, weight=1)

        self.status_var = tk.StringVar(value="Status: PARADO")
        self.modulo_label_var = tk.StringVar(value="MÓDULO: HONDA")
        self.tempo_var = tk.StringVar(value="TEMPO: 00:00:00")
        self.tempo_estimado_var = tk.StringVar(value="TEMPO ESTIMADO: --:--:--")
        self.contador_var = tk.StringVar(value="TOTAL LUNA: - | FEITOS: 0")
        self.run_atual_var = tk.StringVar(value="RUN ATUAL: 00:00")
        self.ultima_run_var = tk.StringVar(value="ULTIMA RUN: 00:00")
        self.meta_var = tk.StringVar(value="META: -")

        def card(parent_card, titulo, var, coluna, fg="#1f2937"):
            frame = tk.Frame(parent_card, bg="#ffffff", padx=14, pady=10)
            frame.grid(row=0, column=coluna, sticky="nsew", padx=6, pady=8)
            tk.Label(frame, text=titulo, font=("Segoe UI", 8, "bold"), bg="#ffffff", fg="#6b7280", anchor="w").pack(fill="x")
            lbl = tk.Label(frame, textvariable=var, font=("Segoe UI", 12, "bold"), bg="#ffffff", fg=fg, anchor="w")
            lbl.pack(fill="x", pady=(3, 0))
            return lbl

        self.status_display_var = tk.StringVar(value="PARADO")
        status_frame = tk.Frame(header, bg="#ffffff", padx=14, pady=10)
        status_frame.grid(row=0, column=0, sticky="nsew", padx=6, pady=8)
        tk.Label(status_frame, text="STATUS GERAL", font=("Segoe UI", 8, "bold"), bg="#ffffff", fg="#6b7280", anchor="w").pack(fill="x")
        status_linha = tk.Frame(status_frame, bg="#ffffff")
        status_linha.pack(fill="x", pady=(5, 0))
        self.status_dot_canvas = tk.Canvas(status_linha, width=20, height=20, bg="#ffffff", highlightthickness=0, bd=0)
        self.status_dot_canvas.pack(side="left", padx=(0, 9))
        self.status_dot_img = None
        self.status_dot = None
        self.status_label = tk.Label(status_linha, textvariable=self.status_display_var, font=("Segoe UI", 12, "bold"), bg="#ffffff", fg="#dc2626", anchor="w")
        self.status_label.pack(side="left", fill="x", expand=True)
        self.status_var.trace_add("write", lambda *_: self.atualizar_status_geral_visual())
        self.atualizar_status_geral_visual()

        self.contador_label = card(header, "CONTADOR", self.contador_var, 1, "#1f4e79")
        self.tempo_label = card(header, "TEMPO", self.tempo_var, 2, "#0f172a")
        self.tempo_estimado_label = card(header, "ESTIMATIVA", self.tempo_estimado_var, 3, "#444444")

        linha_secundaria = tk.Frame(container, bg="#f3f5f8")
        linha_secundaria.pack(fill="x", pady=(0, 12))
        linha_secundaria.grid_columnconfigure(0, weight=1)
        linha_secundaria.grid_columnconfigure(1, weight=1)
        linha_secundaria.grid_columnconfigure(2, weight=1)

        self.run_atual_label = tk.Label(linha_secundaria, textvariable=self.run_atual_var, font=("Segoe UI", 10, "bold"), bg="#f3f5f8", fg="#2563eb", anchor="center")
        self.run_atual_label.grid(row=0, column=0, sticky="ew", padx=6)
        self.ultima_run_label = tk.Label(linha_secundaria, textvariable=self.ultima_run_var, font=("Segoe UI", 10, "bold"), bg="#f3f5f8", fg="#15803d", anchor="center")
        self.ultima_run_label.grid(row=0, column=1, sticky="ew", padx=6)
        self.meta_label = tk.Label(linha_secundaria, textvariable=self.meta_var, font=("Segoe UI", 10, "bold"), bg="#f3f5f8", fg="#334155", anchor="center")
        self.meta_label.grid(row=0, column=2, sticky="ew", padx=6)

        # Barra de progresso removida da UI: não agregava informação operacional
        # e poluía visualmente a tela. As variáveis ficam preservadas para manter
        # compatibilidade com os cálculos internos existentes.
        self.progresso_var = tk.DoubleVar(value=0)
        self.progresso_texto_var = tk.StringVar(value="0%")

        # Configurações principais da operação HONDA.
        # Alteração apenas visual: mantém as mesmas variáveis e callbacks do motor.
        frame_config = tk.Frame(container, bg="#ffffff", padx=22, pady=16)
        frame_config.pack(fill="x", pady=(0, 18))
        frame_config.grid_columnconfigure(0, weight=0)
        frame_config.grid_columnconfigure(1, weight=1)
        frame_config.grid_columnconfigure(2, weight=0)
        frame_config.grid_columnconfigure(3, weight=0)
        frame_config.grid_columnconfigure(4, weight=0)

        limite_box = tk.Frame(frame_config, bg="#ffffff")
        limite_box.grid(row=0, column=0, sticky="w", padx=(0, 28))

        tk.Label(
            limite_box,
            text="Limite de casos",
            font=("Segoe UI", 9, "bold"),
            bg="#ffffff",
            fg="#1f2a44",
            anchor="w"
        ).pack(fill="x", pady=(0, 4))

        entrada_shell = tk.Frame(limite_box, bg="#ffffff", highlightthickness=1, highlightbackground="#cbd7ea", highlightcolor="#2563eb")
        entrada_shell.pack(fill="x")

        self.qtd_casos_var = tk.StringVar(value="")
        self.qtd_casos_entry = tk.Entry(
            entrada_shell,
            textvariable=self.qtd_casos_var,
            width=20,
            font=("Segoe UI", 11),
            relief="flat",
            bd=0,
            bg="#ffffff",
            fg="#0f172a",
            insertbackground="#0f172a"
        )
        self.qtd_casos_entry.pack(ipadx=10, ipady=9, fill="x")

        tk.Label(
            frame_config,
            text="vazio = sem limite",
            font=("Segoe UI", 9),
            bg="#ffffff",
            fg="#64748b"
        ).grid(row=0, column=1, sticky="w", padx=(0, 24))

        divisor_config = tk.Frame(frame_config, bg="#d7deea", width=1, height=54)
        divisor_config.grid(row=0, column=2, sticky="ns", padx=(0, 24))

        self.abrir_pdf_visual_var = tk.BooleanVar(value=True)
        check_box = tk.Frame(frame_config, bg="#ffffff")
        check_box.grid(row=0, column=3, sticky="w", padx=(0, 28))

        self.check_abrir_pdf = tk.Checkbutton(
            check_box,
            text="Abrir PDF visualmente",
            variable=self.abrir_pdf_visual_var,
            font=("Segoe UI", 10, "bold"),
            bg="#ffffff",
            fg="#1f2a44",
            activebackground="#ffffff",
            activeforeground="#1f2a44",
            selectcolor="#ffffff",
            relief="flat",
            bd=0,
            cursor="hand2"
        )
        self.check_abrir_pdf.pack(anchor="w")
        tk.Label(
            check_box,
            text="Marque para abrir o PDF após a extração",
            font=("Segoe UI", 9),
            bg="#ffffff",
            fg="#64748b",
            anchor="w"
        ).pack(anchor="w", padx=(24, 0), pady=(1, 0))

        botoes_config = tk.Frame(frame_config, bg="#ffffff")
        botoes_config.grid(row=0, column=4, sticky="e")

        self.btn_edge = RoundedButton(
            botoes_config,
            text="Abrir Edge Debug",
            width=156,
            height=40,
            radius=16,
            command=self.abrir_edge_debug,
            bg="#ffffff",
            hover_bg="#eef4ff",
            fg="#2563eb",
            border="#cfe0ff",
            font=("Segoe UI", 9, "bold")
        )
        self.btn_edge.pack(side="left", padx=(0, 16))

        self.btn_info = RoundedButton(
            botoes_config,
            text="i",
            width=40,
            height=40,
            radius=20,
            command=self.mostrar_ajuda_honda,
            bg="#eef4ff",
            hover_bg="#dbeafe",
            fg="#2563eb",
            border="#bfdbfe",
            font=("Segoe UI", 12, "bold")
        )
        self.btn_info.pack(side="left")

        # Workflow visual central
        workflow_box = tk.Frame(container, bg="#ffffff", padx=18, pady=22)
        workflow_box.pack(fill="both", expand=True, pady=(0, 18))

        tk.Label(
            workflow_box,
            text="Fluxo do caso atual",
            font=("Segoe UI", 15, "bold"),
            bg="#ffffff",
            fg="#111827",
            anchor="w"
        ).pack(fill="x")

        self.workflow_status_var = tk.StringVar(value="Aguardando início da operação.")
        tk.Label(
            workflow_box,
            textvariable=self.workflow_status_var,
            font=("Segoe UI", 10),
            bg="#ffffff",
            fg="#6b7280",
            anchor="w"
        ).pack(fill="x", pady=(2, 20))

        fluxo_frame = tk.Frame(workflow_box, bg="#ffffff")
        fluxo_frame.pack(fill="x", expand=False, pady=(8, 0))

        self.workflow_etapas = [
            ("luna", "LUNA"),
            ("pdf", "PDF"),
            ("extracao", "EXTRAÇÃO"),
            ("campos", "CAMPOS"),
            ("validacao", "VALIDAÇÃO"),
            ("gravar", "GRAVAR"),
            ("proximo", "PRÓXIMO"),
        ]
        self.workflow_estado = {chave: "pendente" for chave, _ in self.workflow_etapas}
        self.workflow_labels = {}
        self.workflow_bolinhas = {}
        self.workflow_setas = []

        # Workflow em círculos, mais próximo de um painel profissional e menos “botão quadrado”.
        for idx, (chave, titulo) in enumerate(self.workflow_etapas):
            etapa = tk.Frame(fluxo_frame, bg="#ffffff")
            etapa.grid(row=0, column=idx * 2, sticky="nsew", padx=4)
            fluxo_frame.grid_columnconfigure(idx * 2, weight=1)

            canvas = tk.Canvas(
                etapa,
                width=76,
                height=76,
                bg="#ffffff",
                highlightthickness=0,
                bd=0
            )
            canvas.pack(pady=(0, 10))
            oval = canvas.create_oval(8, 8, 68, 68, fill="#ffffff", outline="#c7ced8", width=2)
            numero = canvas.create_text(38, 38, text=str(idx + 1), font=("Segoe UI", 15, "bold"), fill="#6b7280")

            label = tk.Label(
                etapa,
                text=titulo,
                font=("Segoe UI", 10, "bold" if idx == 0 else "normal"),
                bg="#ffffff",
                fg="#374151",
                wraplength=105,
                justify="center"
            )
            label.pack()

            self.workflow_bolinhas[chave] = {
                "canvas": canvas,
                "oval": oval,
                "numero": numero
            }
            self.workflow_labels[chave] = label

            if idx < len(self.workflow_etapas) - 1:
                seta = tk.Label(fluxo_frame, text="→", font=("Segoe UI", 24), bg="#ffffff", fg="#aab4c2")
                seta.grid(row=0, column=idx * 2 + 1, sticky="nsew", padx=0)
                self.workflow_setas.append(seta)

        # Informação operacional discreta: fica na tela principal sem virar painel técnico.
        self.operacao_caso_atual_var = tk.StringVar(value="CASO ATUAL: -")
        self.operacao_caso_atual_label = tk.Label(
            workflow_box,
            textvariable=self.operacao_caso_atual_var,
            font=("Segoe UI", 11, "bold"),
            bg="#ffffff",
            fg="#8b95a5",
            anchor="w"
        )
        self.operacao_caso_atual_label.pack(fill="x", side="bottom", pady=(28, 0))

        # Barra de ação separada e mais confortável
        frame_botoes = tk.Frame(container, bg="#ffffff", padx=18, pady=12)
        frame_botoes.pack(fill="x", pady=(0, 0))
        frame_botoes.grid_columnconfigure(0, weight=1)
        frame_botoes.grid_columnconfigure(1, weight=1)
        frame_botoes.grid_columnconfigure(2, weight=1)

        self.btn_play = RoundedButton(
            frame_botoes,
            text="▶ PLAY HONDA",
            command=self.iniciar_bot,
            width=320,
            height=58,
            radius=25,
            bg="#16a34a",
            hover_bg="#15803d",
            fg="#ffffff",
            border="#16a34a",
            font=("Segoe UI", 12, "bold")
        )
        self.btn_play.grid(row=0, column=0, sticky="ew", padx=(0, 12))

        self.btn_pause = RoundedButton(
            frame_botoes,
            text="⏸ PAUSE",
            command=self.pausar_ou_retomar,
            width=320,
            height=58,
            radius=25,
            bg="#f59e0b",
            hover_bg="#d97706",
            fg="#ffffff",
            border="#f59e0b",
            font=("Segoe UI", 12, "bold")
        )
        self.btn_pause.config(state="disabled")
        self.btn_pause.grid(row=0, column=1, sticky="ew", padx=12)

        self.btn_stop = RoundedButton(
            frame_botoes,
            text="■ STOP",
            command=self.parar_bot,
            width=320,
            height=58,
            radius=25,
            bg="#dc2626",
            hover_bg="#b91c1c",
            fg="#ffffff",
            border="#dc2626",
            font=("Segoe UI", 12, "bold")
        )
        self.btn_stop.config(state="disabled")
        self.btn_stop.grid(row=0, column=2, sticky="ew", padx=(12, 0))

        # ===== STATUS / DIAGNÓSTICO =====
        status_container = tk.Frame(status_parent, bg="#f3f5f8")
        status_container.pack(fill="both", expand=True, padx=16, pady=16)

        tk.Label(
            status_container,
            text="Status técnico e logs",
            font=("Segoe UI", 16, "bold"),
            bg="#f3f5f8",
            fg="#111827",
            anchor="w"
        ).pack(fill="x")

        tk.Label(
            status_container,
            text="Aqui ficam os detalhes internos, alertas e diagnósticos sem poluir a tela de operação.",
            font=("Segoe UI", 10),
            bg="#f3f5f8",
            fg="#6b7280",
            anchor="w"
        ).pack(fill="x", pady=(0, 12))

        frame_central = tk.LabelFrame(status_container, text="CENTRAL DE ESTADO", font=("Segoe UI", 11, "bold"), bg="#f3f5f8", padx=12, pady=10)
        frame_central.pack(fill="x", pady=(0, 12))

        self.estado_caso_var = tk.StringVar(value="CASO ATUAL: -")
        self.estado_luna_var = tk.StringVar(value="LUNA: AGUARDANDO")
        self.estado_pdf_var = tk.StringVar(value="PDF: -")
        self.estado_campos_var = tk.StringVar(value="CAMPOS: -")
        self.estado_gravar_var = tk.StringVar(value="GRAVAR: -")
        self.estado_recovery_var = tk.StringVar(value="RECOVERIES: 0 | WATCHDOGS: 0 | ERROS: 0")
        self.estado_ultimo_erro_var = tk.StringVar(value="ÚLTIMO ERRO: -")

        itens_central = [
            ("caso", self.estado_caso_var),
            ("luna", self.estado_luna_var),
            ("pdf", self.estado_pdf_var),
            ("campos", self.estado_campos_var),
            ("gravar", self.estado_gravar_var),
            ("contadores", self.estado_recovery_var),
            ("ultimo_erro", self.estado_ultimo_erro_var),
        ]

        self.estado_labels = {}
        for idx, (chave, var) in enumerate(itens_central):
            coluna = idx % 2
            linha = idx // 2
            largura = 48 if chave != "ultimo_erro" else 100
            coluna_span = 1 if chave != "ultimo_erro" else 2
            lbl = tk.Label(
                frame_central,
                textvariable=var,
                font=("Segoe UI", 10, "bold"),
                anchor="w",
                width=largura,
                padx=10,
                pady=8,
                bg="#f7f7f7",
                fg="#222222",
                relief="groove"
            )
            lbl.grid(row=linha, column=coluna, columnspan=coluna_span, sticky="ew", padx=5, pady=5)
            self.estado_labels[chave] = lbl

        for coluna in range(2):
            frame_central.grid_columnconfigure(coluna, weight=1)

        frame_log_header = tk.Frame(status_container, bg="#f3f5f8")
        frame_log_header.pack(fill="x", pady=(4, 4))

        tk.Label(frame_log_header, text="Logs", font=("Segoe UI", 12, "bold"), bg="#f3f5f8", fg="#111827").pack(side="left")
        self.btn_limpar = tk.Button(frame_log_header, text="Limpar logs", width=14, command=self.limpar_logs, bg="#e5e7eb", fg="#111827", relief="flat")
        self.btn_limpar.pack(side="right")

        self.log_area = scrolledtext.ScrolledText(status_container, wrap=tk.WORD, font=("Consolas", 10), height=12)
        self.log_area.pack(fill="both", expand=True)

        self.log_area.tag_config("normal", foreground="#222222")
        self.log_area.tag_config("info", foreground="#222222")
        self.log_area.tag_config("erro", foreground="#b00020")
        self.log_area.tag_config("recovery", foreground="#8a4b00")
        self.log_area.tag_config("watchdog", foreground="#8a4b00")
        self.log_area.tag_config("sucesso", foreground="#0b6b2b")
        self.log_area.tag_config("debug", foreground="#777777")

        self.honda_operacao_frame.pack(fill="both", expand=True)
        self.atualizar_botoes_painel_honda()
        self.atualizar_workflow_visual()

    def atualizar_botoes_painel_honda(self):
        if not hasattr(self, "btn_painel_operacao"):
            return

        if self.painel_honda_atual == "OPERACAO":
            self.btn_painel_operacao.config(bg="#162033", hover_bg="#243047", fg="#ffffff", border="#162033")
            self.btn_painel_status.config(bg="#ffffff", hover_bg="#f8fafc", fg="#64748b", border="#dbe3ef")
        else:
            self.btn_painel_operacao.config(bg="#ffffff", hover_bg="#f8fafc", fg="#64748b", border="#dbe3ef")
            self.btn_painel_status.config(bg="#162033", hover_bg="#243047", fg="#ffffff", border="#162033")

    def selecionar_painel_honda(self, painel):
        painel = str(painel).upper().strip()
        if painel not in ("OPERACAO", "STATUS"):
            return

        self.painel_honda_atual = painel

        try:
            self.honda_operacao_frame.pack_forget()
            self.honda_status_frame.pack_forget()

            if painel == "STATUS":
                self.honda_status_frame.pack(fill="both", expand=True)
            else:
                self.honda_operacao_frame.pack(fill="both", expand=True)
        except Exception:
            pass

        self.atualizar_botoes_painel_honda()


    # =====================================================
    # UI VOLKS - ASSISTENTE MANUAL
    # =====================================================
    def criar_tela_volks(self, parent):
        self.painel_volks_atual = "PROCESSO"

        volks_shell = tk.Frame(parent, bg="#f3f5f8")
        volks_shell.pack(fill="both", expand=True, padx=24, pady=24)

        # Cabeçalho VOLKS minimalista: sem textos fixos na tela de processo.
        # As instruções ficam no botão de informação.
        topo_volks = tk.Frame(volks_shell, bg="#f3f5f8")
        topo_volks.pack(fill="x", pady=(0, 8))

        self.btn_info_volks = RoundedButton(
            topo_volks,
            text="i",
            width=34,
            height=34,
            radius=17,
            command=self.mostrar_ajuda_volks,
            bg="#eef2ff",
            hover_bg="#dbeafe",
            fg="#2563eb",
            border="#bfdbfe",
            font=("Segoe UI", 12, "bold")
        )
        self.btn_info_volks.pack(side="right")

        self.btn_compacto_volks = RoundedButton(
            topo_volks,
            text="Compacto",
            width=110,
            height=34,
            radius=14,
            command=self.abrir_modo_compacto_volks,
            bg="#ffffff",
            hover_bg="#f8fafc",
            fg="#334155",
            border="#d6deea",
            font=("Segoe UI", 9, "bold")
        )
        self.btn_compacto_volks.pack(side="right", padx=(0, 10))

        painel_barra = tk.Frame(volks_shell, bg="#f3f5f8")
        painel_barra.pack(fill="x", pady=(0, 12))

        painel_centro = tk.Frame(painel_barra, bg="#f3f5f8", width=310, height=26)
        painel_centro.pack(anchor="center")
        painel_centro.pack_propagate(False)

        painel_botoes = tk.Frame(painel_centro, bg="#f3f5f8")
        painel_botoes.place(relx=0.5, rely=0.5, anchor="center")

        self.btn_painel_volks_processo = RoundedButton(
            painel_botoes,
            text="PROCESSO",
            width=84,
            height=22,
            radius=10,
            command=lambda: self.selecionar_painel_volks("PROCESSO"),
            bg="#ffffff",
            hover_bg="#f8fafc",
            fg="#475569",
            border="#dbe3ef",
            font=("Segoe UI", 7, "bold")
        )
        self.btn_painel_volks_processo.pack(side="left", padx=(0, 4))

        self.btn_painel_volks_status = RoundedButton(
            painel_botoes,
            text="STATUS",
            width=84,
            height=22,
            radius=10,
            command=lambda: self.selecionar_painel_volks("STATUS"),
            bg="#ffffff",
            hover_bg="#f8fafc",
            fg="#64748b",
            border="#dbe3ef",
            font=("Segoe UI", 7, "bold")
        )
        self.btn_painel_volks_status.pack(side="left", padx=(4, 0))

        self.volks_painel_container = tk.Frame(volks_shell, bg="#f3f5f8")
        self.volks_painel_container.pack(fill="both", expand=True)

        self.volks_processo_frame = tk.Frame(self.volks_painel_container, bg="#f3f5f8")
        self.volks_status_frame = tk.Frame(self.volks_painel_container, bg="#f3f5f8")

        # ===== PROCESSO VOLKS =====
        # Tela limpa: somente os controles centrais do assistente.
        processo_container = tk.Frame(self.volks_processo_frame, bg="#f3f5f8")
        processo_container.pack(fill="both", expand=True)

        centro_controle = tk.Frame(processo_container, bg="#f3f5f8")
        centro_controle.place(relx=0.5, rely=0.43, anchor="center")

        tk.Label(
            centro_controle,
            text="ASSISTENTE VOLKS",
            font=("Segoe UI", 20, "bold"),
            bg="#f3f5f8",
            fg="#1f4e79"
        ).pack(anchor="center")

        tk.Label(
            centro_controle,
            text="Limpa, extrai, preenche e para. Depois você grava manualmente na LUNA.",
            font=("Segoe UI", 11),
            bg="#f3f5f8",
            fg="#64748b"
        ).pack(anchor="center", pady=(8, 34))

        botoes_controle_volks = tk.Frame(centro_controle, bg="#f3f5f8")
        botoes_controle_volks.pack(anchor="center")

        self.btn_volks_assistente = RoundedButton(
            botoes_controle_volks,
            text="▶ ASSISTENTE VOLKS",
            width=250,
            height=52,
            radius=20,
            command=self.iniciar_bot_volks_assistente,
            bg="#7c3aed",
            hover_bg="#6d28d9",
            fg="#ffffff",
            border="#7c3aed",
            font=("Segoe UI", 12, "bold")
        )
        self.btn_volks_assistente.pack(side="left", padx=(0, 12))

        self.btn_volks_stop = RoundedButton(
            botoes_controle_volks,
            text="■ STOP",
            width=250,
            height=52,
            radius=20,
            command=self.parar_bot,
            bg="#dc2626",
            hover_bg="#b91c1c",
            fg="#ffffff",
            border="#dc2626",
            font=("Segoe UI", 12, "bold")
        )
        self.btn_volks_stop.config(state="disabled")
        self.btn_volks_stop.pack(side="left", padx=(12, 0))

        # ===== STATUS VOLKS =====
        status_container = tk.Frame(self.volks_status_frame, bg="#f3f5f8")
        status_container.pack(fill="both", expand=True)

        frame_log_header = tk.Frame(status_container, bg="#f3f5f8")
        frame_log_header.pack(fill="x", pady=(0, 4))

        tk.Label(
            frame_log_header,
            text="Logs VOLKS",
            font=("Segoe UI", 12, "bold"),
            bg="#f3f5f8",
            fg="#111827"
        ).pack(side="left")

        self.btn_limpar_logs_volks = RoundedButton(
            frame_log_header,
            text="Limpar logs",
            width=120,
            height=30,
            radius=12,
            command=self.limpar_logs,
            bg="#e5e7eb",
            hover_bg="#d1d5db",
            fg="#111827",
            border="#d1d5db",
            font=("Segoe UI", 9, "bold")
        )
        self.btn_limpar_logs_volks.pack(side="right")

        self.volks_log_area = scrolledtext.ScrolledText(status_container, wrap=tk.WORD, font=("Consolas", 10), height=18)
        self.volks_log_area.pack(fill="both", expand=True)
        self.volks_log_area.tag_config("normal", foreground="#222222")
        self.volks_log_area.tag_config("info", foreground="#222222")
        self.volks_log_area.tag_config("erro", foreground="#b00020")
        self.volks_log_area.tag_config("recovery", foreground="#8a4b00")
        self.volks_log_area.tag_config("watchdog", foreground="#8a4b00")
        self.volks_log_area.tag_config("sucesso", foreground="#0b6b2b")
        self.volks_log_area.tag_config("debug", foreground="#777777")

        self.volks_processo_frame.pack(fill="both", expand=True)
        self.atualizar_botoes_painel_volks()

    def atualizar_botoes_painel_volks(self):
        if not hasattr(self, "btn_painel_volks_processo"):
            return

        if self.painel_volks_atual == "PROCESSO":
            self.btn_painel_volks_processo.config(bg="#162033", hover_bg="#243047", fg="#ffffff", border="#162033")
            self.btn_painel_volks_status.config(bg="#ffffff", hover_bg="#f8fafc", fg="#64748b", border="#dbe3ef")
        else:
            self.btn_painel_volks_processo.config(bg="#ffffff", hover_bg="#f8fafc", fg="#64748b", border="#dbe3ef")
            self.btn_painel_volks_status.config(bg="#162033", hover_bg="#243047", fg="#ffffff", border="#162033")

    def selecionar_painel_volks(self, painel):
        painel = str(painel).upper().strip()
        if painel not in ("PROCESSO", "STATUS"):
            return

        self.painel_volks_atual = painel

        try:
            self.volks_processo_frame.pack_forget()
            self.volks_status_frame.pack_forget()

            if painel == "STATUS":
                self.volks_status_frame.pack(fill="both", expand=True)
            else:
                self.volks_processo_frame.pack(fill="both", expand=True)
        except Exception:
            pass

        self.atualizar_botoes_painel_volks()

    def abrir_modo_compacto_volks(self):
        """Abre um controle compacto da VOLKS sem alterar a janela principal."""
        try:
            if hasattr(self, "janela_compacta_volks") and self.janela_compacta_volks.winfo_exists():
                self.janela_compacta_volks.lift()
                self.janela_compacta_volks.focus_force()
                return
        except Exception:
            pass

        janela = tk.Toplevel(self.root)
        self.janela_compacta_volks = janela
        janela.title("AlphaBot VOLKS - Compacto")
        janela.geometry("360x250")
        janela.resizable(False, False)
        janela.configure(bg="#f3f5f8")
        janela.protocol("WM_DELETE_WINDOW", self.fechar_modo_compacto_volks)

        shell = tk.Frame(janela, bg="#f3f5f8", padx=18, pady=16)
        shell.pack(fill="both", expand=True)

        tk.Label(
            shell,
            text="ASSISTENTE VOLKS",
            font=("Segoe UI", 15, "bold"),
            bg="#f3f5f8",
            fg="#1f4e79"
        ).pack(anchor="center")

        tk.Label(
            shell,
            text="Controle rápido para deixar ao lado da LUNA.",
            font=("Segoe UI", 9),
            bg="#f3f5f8",
            fg="#64748b"
        ).pack(anchor="center", pady=(4, 14))

        self.volks_compacto_status_var = tk.StringVar(value="STATUS: AGUARDANDO")
        tk.Label(
            shell,
            textvariable=self.volks_compacto_status_var,
            font=("Segoe UI", 9, "bold"),
            bg="#f3f5f8",
            fg="#334155"
        ).pack(anchor="center", pady=(0, 14))

        self.btn_volks_assistente_compacto = RoundedButton(
            shell,
            text="▶ ASSISTENTE",
            width=260,
            height=46,
            radius=18,
            command=self.iniciar_bot_volks_assistente,
            bg="#7c3aed",
            hover_bg="#6d28d9",
            fg="#ffffff",
            border="#7c3aed",
            font=("Segoe UI", 11, "bold")
        )
        self.btn_volks_assistente_compacto.pack(anchor="center", pady=(0, 10))

        self.btn_volks_stop_compacto = RoundedButton(
            shell,
            text="■ STOP",
            width=260,
            height=46,
            radius=18,
            command=self.parar_bot,
            bg="#dc2626",
            hover_bg="#b91c1c",
            fg="#ffffff",
            border="#dc2626",
            font=("Segoe UI", 11, "bold")
        )
        self.btn_volks_stop_compacto.pack(anchor="center")

        self.atualizar_estado_botoes_compacto_volks()

    def fechar_modo_compacto_volks(self):
        try:
            if hasattr(self, "janela_compacta_volks") and self.janela_compacta_volks.winfo_exists():
                self.janela_compacta_volks.destroy()
        except Exception:
            pass

    def atualizar_estado_botoes_compacto_volks(self):
        try:
            if not hasattr(self, "janela_compacta_volks") or not self.janela_compacta_volks.winfo_exists():
                return
            if hasattr(self, "btn_volks_assistente_compacto"):
                self.btn_volks_assistente_compacto.config(state="disabled" if self.running else "normal")
            if hasattr(self, "btn_volks_stop_compacto"):
                self.btn_volks_stop_compacto.config(state="normal" if self.running else "disabled")
            if hasattr(self, "volks_compacto_status_var"):
                self.volks_compacto_status_var.set("STATUS: PROCESSANDO" if self.running else "STATUS: AGUARDANDO")
        except Exception:
            pass

    def mostrar_ajuda_volks(self):
        janela = tk.Toplevel(self.root)
        janela.title("Informações - VOLKS")
        janela.geometry("560x390")
        janela.resizable(False, False)
        janela.configure(bg="#ffffff")
        janela.transient(self.root)
        janela.grab_set()

        tk.Label(
            janela,
            text="Como usar o AlphaBot - VOLKS",
            font=("Segoe UI", 15, "bold"),
            bg="#ffffff",
            fg="#111827",
            anchor="w"
        ).pack(fill="x", padx=22, pady=(18, 8))

        linhas_info = [
            "1. Deixe a LUNA já selecionada em BANCO VOLKSWAGEN / CONTRATO_VWCDC.",
            "2. Clique em ASSISTENTE VOLKS uma vez para o caso atual.",
            "3. O assistente limpa os campos VOLKS, abre o PDF e lê o bloco I - EMITENTE.",
            "4. Ele preenche os campos e para sem clicar em GRAVAR.",
            "5. Confira visualmente os dados na LUNA.",
            "6. Clique GRAVAR manualmente na própria LUNA.",
            "7. No próximo caso, clique ASSISTENTE VOLKS novamente.",
            "8. Use a aba Status para ver logs e diagnosticar qualquer alerta."
        ]

        texto = tk.Label(
            janela,
            text="\n".join(linhas_info),
            font=("Segoe UI", 10),
            bg="#ffffff",
            fg="#374151",
            justify="left",
            anchor="nw",
            padx=22,
            pady=10
        )
        texto.pack(fill="both", expand=True)

        tk.Button(
            janela,
            text="Entendi",
            command=janela.destroy,
            font=("Segoe UI", 10, "bold"),
            bg="#1f4e79",
            fg="white",
            relief="flat",
            width=14,
            height=2
        ).pack(pady=(0, 18))


    # =====================================================
    # UI HONDA - AJUDA E ELEMENTOS VISUAIS AUXILIARES
    # =====================================================

    def mostrar_ajuda_honda(self):
        janela = tk.Toplevel(self.root)
        janela.title("Informações - HONDA")
        janela.geometry("560x420")
        janela.resizable(False, False)
        janela.configure(bg="#ffffff")
        janela.transient(self.root)
        janela.grab_set()

        tk.Label(
            janela,
            text="Como usar o AlphaBot - HONDA",
            font=("Segoe UI", 15, "bold"),
            bg="#ffffff",
            fg="#111827",
            anchor="w"
        ).pack(fill="x", padx=22, pady=(18, 8))

        linhas_info = [
            "1. Clique em 'Abrir Edge Debug'.",
            "2. Abra a LUNA nessa janela do Edge.",
            "3. Confira se está no módulo HONDA / CONTRATO DE ALIENAÇÃO.",
            "4. Defina um limite de casos ou deixe vazio para rodar sem limite.",
            "5. Use PLAY para iniciar, PAUSE para congelar antes do próximo caso e STOP como emergência.",
            "6. A aba Operação mostra o fluxo visual do caso atual.",
            "7. A aba Status mostra logs, recoveries, watchdogs e diagnóstico técnico.",
            "8. Se algo ficar vermelho, confira a aba Status antes de retomar."
        ]

        texto = tk.Label(
            janela,
            text="\n".join(linhas_info),
            font=("Segoe UI", 10),
            bg="#ffffff",
            fg="#374151",
            justify="left",
            anchor="nw",
            padx=22,
            pady=10
        )
        texto.pack(fill="both", expand=True)

        tk.Button(
            janela,
            text="Entendi",
            command=janela.destroy,
            font=("Segoe UI", 10, "bold"),
            bg="#1f4e79",
            fg="white",
            relief="flat",
            width=14,
            height=2
        ).pack(pady=(0, 18))

    def desenhar_circulo_workflow(self, bolinha, numero, cor):
        canvas = bolinha.get("canvas")
        if canvas is None:
            return

        canvas.delete("all")
        fill = cor.get("fill", "#ffffff")
        outline = cor.get("outline", "#c7ced8")
        text = cor.get("text", "#6b7280")
        width = int(cor.get("width", 2))

        # Tkinter não tem anti-alias real em create_oval. Quando Pillow existe,
        # desenhamos em alta resolução e reduzimos para ficar circular e suave.
        if Image is not None and ImageDraw is not None and ImageTk is not None:
            escala = 4
            tamanho = 76
            img = Image.new("RGBA", (tamanho * escala, tamanho * escala), (255, 255, 255, 0))
            draw = ImageDraw.Draw(img)
            margem = 8 * escala
            largura = max(1, width * escala)
            draw.ellipse(
                (margem, margem, (tamanho * escala) - margem, (tamanho * escala) - margem),
                fill=fill,
                outline=outline,
                width=largura
            )
            img = img.resize((tamanho, tamanho), Image.Resampling.LANCZOS)
            photo = ImageTk.PhotoImage(img)
            bolinha["photo"] = photo
            canvas.create_image(38, 38, image=photo)
            canvas.create_text(38, 38, text=numero, font=("Segoe UI", 15, "bold"), fill=text)
            return

        canvas.create_oval(8, 8, 68, 68, fill=fill, outline=outline, width=width)
        canvas.create_text(38, 38, text=numero, font=("Segoe UI", 15, "bold"), fill=text)

    def desenhar_status_dot(self, cor):
        if not hasattr(self, "status_dot_canvas"):
            return

        try:
            self.status_dot_canvas.delete("all")

            if Image is not None and ImageDraw is not None and ImageTk is not None:
                tamanho = 20
                escala = 4
                img = Image.new("RGBA", (tamanho * escala, tamanho * escala), (255, 255, 255, 0))
                draw = ImageDraw.Draw(img)
                margem = 4 * escala
                draw.ellipse(
                    (margem, margem, tamanho * escala - margem, tamanho * escala - margem),
                    fill=cor,
                    outline=cor,
                    width=1 * escala
                )
                img = img.resize((tamanho, tamanho), Image.Resampling.LANCZOS)
                photo = ImageTk.PhotoImage(img)
                self.status_dot_img = photo
                self.status_dot_canvas.create_image(10, 10, image=photo)
                return

            self.status_dot_canvas.create_oval(5, 5, 15, 15, fill=cor, outline=cor, width=1)
        except Exception:
            pass

    def atualizar_status_geral_visual(self):
        if not hasattr(self, "status_var") or not hasattr(self, "status_display_var"):
            return

        texto_original = str(self.status_var.get() or "").strip()
        texto = texto_original.replace("Status:", "").strip() or texto_original or "-"
        texto_norm = self.normalizar_texto(texto)

        if any(termo in texto_norm for termo in ["RODANDO", "OK", "CONCLUIDO"]):
            cor = "#16a34a"
        elif any(termo in texto_norm for termo in ["PAUS", "STOP ACIONADO", "RECOVERY", "PREPARACAO", "AGUARD", "INICIANDO"]):
            cor = "#f59e0b"
        else:
            cor = "#dc2626"

        try:
            self.status_display_var.set(texto.upper())
            self.status_label.config(fg=cor)
            self.desenhar_status_dot(cor)
        except Exception:
            pass

    def atualizar_workflow_visual(self):
        if not hasattr(self, "workflow_bolinhas"):
            return

        cores = {
            "pendente": {"fill": "#ffffff", "outline": "#c7ced8", "text": "#6b7280", "label": "#374151", "width": 2},
            "ativo": {"fill": "#ffffff", "outline": "#3b82f6", "text": "#1e3a8a", "label": "#111827", "width": 3},
            "ok": {"fill": "#16a34a", "outline": "#16a34a", "text": "#ffffff", "label": "#15803d", "width": 2},
            "alerta": {"fill": "#f59e0b", "outline": "#f59e0b", "text": "#ffffff", "label": "#b45309", "width": 2},
            "erro": {"fill": "#dc2626", "outline": "#dc2626", "text": "#ffffff", "label": "#dc2626", "width": 2},
        }

        ordem = [chave for chave, _titulo in self.workflow_etapas]
        ativo_idx = -1
        for i, chave in enumerate(ordem):
            if self.workflow_estado.get(chave) == "ativo":
                ativo_idx = i
                break

        for i, (chave, _titulo) in enumerate(self.workflow_etapas):
            estado = self.workflow_estado.get(chave, "pendente")
            cor = cores.get(estado, cores["pendente"])
            try:
                bolinha = self.workflow_bolinhas[chave]
                if isinstance(bolinha, dict):
                    self.desenhar_circulo_workflow(bolinha, str(i + 1), cor)
                else:
                    bolinha.config(bg=cor["fill"], fg=cor["text"])
                fonte = ("Segoe UI", 10, "bold") if estado in ("ativo", "ok", "alerta", "erro") else ("Segoe UI", 10, "normal")
                self.workflow_labels[chave].config(fg=cor["label"], font=fonte)
            except Exception:
                pass

        try:
            for i, seta in enumerate(getattr(self, "workflow_setas", [])):
                if ativo_idx >= 0 and i < ativo_idx:
                    seta.config(fg="#3b82f6")
                else:
                    seta.config(fg="#aab4c2")
        except Exception:
            pass

    def resetar_workflow(self, mensagem="Aguardando início da operação."):
        if hasattr(self, "workflow_estado"):
            for chave, _titulo in self.workflow_etapas:
                self.workflow_estado[chave] = "pendente"
        if hasattr(self, "workflow_status_var"):
            self.workflow_status_var.set(mensagem)
        self.atualizar_workflow_visual()

    def set_workflow(self, etapa=None, estado="ativo", mensagem=None, concluir_anteriores=True):
        if not hasattr(self, "workflow_estado"):
            return

        ordem = [chave for chave, _titulo in self.workflow_etapas]

        if etapa is not None and etapa in ordem:
            indice = ordem.index(etapa)
            if concluir_anteriores:
                for chave in ordem[:indice]:
                    if self.workflow_estado.get(chave) not in ("erro", "alerta"):
                        self.workflow_estado[chave] = "ok"
            self.workflow_estado[etapa] = estado

        if mensagem and hasattr(self, "workflow_status_var"):
            self.workflow_status_var.set(mensagem)

        self.root.after(0, self.atualizar_workflow_visual)

    def workflow_por_estado(self):
        pdf = self.normalizar_texto(self.status_pdf_atual)
        campos = self.normalizar_texto(self.status_campos_atual)
        gravar = self.normalizar_texto(self.status_gravar_atual)
        luna = self.normalizar_texto(self.status_luna_atual)

        if "WATCHDOG" in luna or "ERRO" in luna or "FALHA" in luna:
            self.set_workflow(etapa="luna", estado="erro", mensagem="Falha detectada. Verifique a aba Status.", concluir_anteriores=False)
            return

        if "RECOVERY" in luna:
            self.set_workflow(etapa="luna", estado="alerta", mensagem="Recovery em andamento. O AlphaBot está tentando reconstruir a tela.", concluir_anteriores=False)
            return

        if "GRAVANDO" in gravar:
            self.set_workflow("gravar", "ativo", "Gravando os dados na LUNA.")
        elif "SUCESSO" in gravar or "OK" == gravar:
            self.set_workflow("proximo", "ativo", "Caso concluído. Preparando próximo caso.")
        elif "VALIDAD" in campos:
            self.set_workflow("validacao", "ok", "Campos validados. Pronto para gravar.")
        elif "PREENCH" in campos:
            self.set_workflow("campos", "ativo", "Preenchendo campos na LUNA.")
        elif "BAIXANDO" in pdf:
            self.set_workflow("pdf", "ativo", "Baixando e lendo o PDF.")
        elif "OK" in pdf and "AGUARD" in campos:
            self.set_workflow("extracao", "ativo", "Extraindo dados do documento.")
        elif "BUSCANDO" in pdf:
            self.set_workflow("pdf", "ativo", "Localizando o PDF do caso.")
        elif "OK" in luna or "RODANDO" in luna:
            self.set_workflow("luna", "ativo", "Inicializando e validando a tela da LUNA.")


    # =====================================================
    # UI COMPARTILHADA - TROCA DE MÓDULO
    # =====================================================
    def atualizar_botoes_modulo(self):
        if not hasattr(self, "btn_modulo_honda"):
            return

        if self.modulo_atual == "HONDA":
            self.btn_modulo_honda.config(bg="#1d4ed8", hover_bg="#2563eb", fg="#ffffff", border="#1d4ed8")
            self.btn_modulo_volks.config(bg="#ffffff", hover_bg="#f8fafc", fg="#334155", border="#d6deea")
        else:
            self.btn_modulo_honda.config(bg="#ffffff", hover_bg="#f8fafc", fg="#334155", border="#d6deea")
            self.btn_modulo_volks.config(bg="#1d4ed8", hover_bg="#2563eb", fg="#ffffff", border="#1d4ed8")

    def selecionar_modulo(self, modulo):
        modulo = str(modulo).upper().strip()

        if modulo == self.modulo_atual:
            return

        self.modulo_atual = modulo

        try:
            self.honda_frame.pack_forget()
            self.volks_frame.pack_forget()

            if modulo == "VOLKS":
                self.volks_frame.pack(fill="both", expand=True)
            else:
                self.honda_frame.pack(fill="both", expand=True)
        except Exception:
            pass

        self.ao_trocar_modulo()

    def ao_trocar_modulo(self, event=None):
        if hasattr(self, "modulo_label_var"):
            self.modulo_label_var.set(f"MÓDULO: {self.modulo_atual}")

        self.atualizar_botoes_modulo()

        if self.modulo_atual == "VOLKS":
            self.status_var.set("Status: VOLKS EM PREPARAÇÃO")
            if hasattr(self, "btn_play") and not self.running:
                self.btn_play.config(state="disabled")
            return

        if not self.running:
            self.status_var.set("Status: PARADO")
            if hasattr(self, "btn_play"):
                self.btn_play.config(state="normal")


    # =====================================================
    # CORE COMPARTILHADO - EDGE DEBUG / LOGS / ESTADO VISUAL
    # =====================================================
    def abrir_edge_debug(self):
        try:
            caminhos_edge = [
                r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"
            ]

            edge_path = None

            for caminho in caminhos_edge:
                if os.path.exists(caminho):
                    edge_path = caminho
                    break

            if not edge_path:
                self.log_erro("Edge não encontrado nos caminhos padrão.")
                return

            comando = f'"{edge_path}" --remote-debugging-port=9222'
            subprocess.Popen(comando, shell=True)

            self.log("Edge Debug iniciado.")
            self.log("Abra a LUNA nessa janela do Edge.")

            if DEBUG:
                self.log_debug("Comando usado:")
                self.log_debug(comando)

        except Exception as e:
            self.log_erro(f"Erro ao abrir Edge Debug: {e}")

    def normalizar_mensagem_log(self, mensagem):
        texto = str(mensagem).strip()
        texto = re.sub(r"\s+", " ", texto)
        return texto

    def registrar_ultimo_erro_visual(self, mensagem):
        texto = self.normalizar_mensagem_log(mensagem)
        if len(texto) > 150:
            texto = texto[:147] + "..."
        self.ultimo_erro_atual = texto or "-"
        self.total_erros += 1
        self.atualizar_central_estado()
        if hasattr(self, "workflow_status_var"):
            self.set_workflow(estado="erro", mensagem="Erro registrado. Confira a aba Status para detalhes.", concluir_anteriores=False)

    def log_com_tag(self, mensagem, tag="normal", prefixo=None, anti_spam=False):
        texto = str(mensagem)
        texto_normalizado = self.normalizar_mensagem_log(texto)

        if anti_spam and texto_normalizado == self.ultimo_log_normalizado:
            self.repeticoes_log_igual += 1
            return

        if anti_spam and self.repeticoes_log_igual:
            self.log_queue.put((f"[INFO] Mensagem anterior repetida {self.repeticoes_log_igual} vez(es).", "debug"))
            self.repeticoes_log_igual = 0

        self.ultimo_log_normalizado = texto_normalizado

        if prefixo:
            texto = f"[{prefixo}] {texto}"

        self.log_queue.put((texto, tag))

    def log(self, mensagem):
        self.log_com_tag(mensagem, "normal", "INFO", anti_spam=True)

    def log_sucesso(self, mensagem):
        self.log_com_tag(mensagem, "sucesso", "OK")

    def log_recovery(self, mensagem):
        self.log_com_tag(mensagem, "recovery", "RECOVERY")

    def log_watchdog(self, mensagem):
        self.log_com_tag(mensagem, "watchdog", "WATCHDOG")

    def log_erro(self, mensagem):
        self.registrar_ultimo_erro_visual(mensagem)
        self.log_com_tag(mensagem, "erro", "ERRO")

    def log_debug(self, mensagem):
        if DEBUG:
            self.log_com_tag(mensagem, "debug", "DEBUG")

    def atualizar_central_estado(self):
        def cor_status(valor, tipo="status"):
            texto = self.normalizar_texto(valor)

            if tipo == "ultimo_erro":
                if not valor or str(valor).strip() == "-":
                    return "#e7f6ea", "#187a2f"
                return "#fde8e8", "#a40000"

            if tipo == "contadores":
                if self.total_erros > 0 or self.total_watchdogs > 0:
                    return "#fde8e8", "#a40000"
                if self.total_recoveries > 0:
                    return "#fff4d6", "#8a5a00"
                return "#e7f6ea", "#187a2f"

            termos_ok = ["OK", "SUCESSO", "APROVADA", "CONCLUID", "GRAVADO", "VALIDADO", "RODANDO"]
            termos_ruim = ["ERRO", "FALHA", "AUSENTE", "INVALID", "BLOQUE", "TRAV", "WATCHDOG", "SESSAO"]
            termos_alerta = ["RECOVERY", "PAUS", "AGUARD", "INICIANDO", "PROCESSANDO", "BUSCANDO"]

            if any(termo in texto for termo in termos_ruim):
                return "#fde8e8", "#a40000"
            if any(termo in texto for termo in termos_ok):
                return "#e7f6ea", "#187a2f"
            if any(termo in texto for termo in termos_alerta):
                return "#fff4d6", "#8a5a00"

            return "#f7f7f7", "#222222"

        def pintar_label(chave, valor, tipo="status"):
            try:
                if not hasattr(self, "estado_labels") or chave not in self.estado_labels:
                    return
                bg, fg = cor_status(valor, tipo)
                self.estado_labels[chave].config(bg=bg, fg=fg)
            except Exception:
                pass

        def aplicar():
            if not hasattr(self, "estado_luna_var"):
                return

            caso_atual = self.extrair_numero(self.feitos)
            if caso_atual is not None:
                caso_atual = caso_atual + 1
            else:
                caso_atual = "-"

            self.estado_caso_var.set(f"CASO ATUAL: {caso_atual}")
            if hasattr(self, "operacao_caso_atual_var"):
                # UI operacional: mostra sempre o TOTAL atual lido da LUNA.
                # O total_inicial_luna continua preservado apenas para cálculos internos
                # de meta/progresso/estimativa, porque a LUNA pode reiniciar o lote
                # após metade+1/recovery.
                if not self.running:
                    self.operacao_caso_atual_var.set("CASO ATUAL: -")
                else:
                    total_visual = self.extrair_numero(self.total_casos)
                    if total_visual:
                        self.operacao_caso_atual_var.set(f"CASO ATUAL: {caso_atual} / {total_visual}")
                    else:
                        self.operacao_caso_atual_var.set(f"CASO ATUAL: {caso_atual}")
            self.estado_luna_var.set(f"LUNA: {self.status_luna_atual}")
            self.estado_pdf_var.set(f"PDF: {self.status_pdf_atual}")
            self.estado_campos_var.set(f"CAMPOS: {self.status_campos_atual}")
            self.estado_gravar_var.set(f"GRAVAR: {self.status_gravar_atual}")
            self.estado_recovery_var.set(
                f"RECOVERIES: {self.total_recoveries} | WATCHDOGS: {self.total_watchdogs} | ERROS: {self.total_erros}"
            )
            self.estado_ultimo_erro_var.set(f"ÚLTIMO ERRO: {self.ultimo_erro_atual}")

            pintar_label("caso", caso_atual)
            pintar_label("luna", self.status_luna_atual)
            pintar_label("pdf", self.status_pdf_atual)
            pintar_label("campos", self.status_campos_atual)
            pintar_label("gravar", self.status_gravar_atual)
            pintar_label("contadores", "", "contadores")
            pintar_label("ultimo_erro", self.ultimo_erro_atual, "ultimo_erro")

        try:
            self.root.after(0, aplicar)
        except Exception:
            pass

    def set_estado_luna(self, valor=None, pdf=None, campos=None, gravar=None, ultimo_erro=None):
        if valor is not None:
            self.status_luna_atual = str(valor)
        if pdf is not None:
            self.status_pdf_atual = str(pdf)
        if campos is not None:
            self.status_campos_atual = str(campos)
        if gravar is not None:
            self.status_gravar_atual = str(gravar)
        if ultimo_erro is not None:
            self.ultimo_erro_atual = str(ultimo_erro)
        self.atualizar_central_estado()
        self.workflow_por_estado()

    def processar_logs(self):
        try:
            while True:
                item = self.log_queue.get_nowait()

                if isinstance(item, tuple):
                    mensagem, tag = item
                else:
                    mensagem, tag = str(item), "normal"

                horario = time.strftime("%H:%M:%S")
                linha_log = f"{horario}  {mensagem}\n"

                self.log_area.insert(tk.END, linha_log, tag)
                self.log_area.see(tk.END)

                if hasattr(self, "volks_log_area"):
                    try:
                        self.volks_log_area.insert(tk.END, linha_log, tag)
                        self.volks_log_area.see(tk.END)
                    except Exception:
                        pass

        except queue.Empty:
            pass

        self.root.after(100, self.processar_logs)

    def limpar_logs(self):
        self.log_area.delete("1.0", tk.END)
        if hasattr(self, "volks_log_area"):
            try:
                self.volks_log_area.delete("1.0", tk.END)
            except Exception:
                pass


    # =====================================================
    # HONDA - CONTROLE DE EXECUÇÃO, META E TEMPORIZADORES
    # =====================================================
    def ler_meta_casos(self):
        valor = self.qtd_casos_var.get().strip()

        if not valor:
            return True, None

        try:
            numero = int(valor)

            if numero <= 0:
                self.log_erro("Limite inválido. Digite um número maior que zero ou deixe vazio para rodar sem limite.")
                return False, None

            return True, numero

        except ValueError:
            self.log_erro("Limite inválido. Digite apenas números ou deixe vazio para rodar sem limite.")
            return False, None

    def iniciar_bot(self):
        if self.running:
            return

        if getattr(self, "modulo_atual", "HONDA") != "HONDA":
            self.status_var.set("Status: VOLKS EM PREPARAÇÃO")
            self.log_erro("O módulo VOLKS ainda está bloqueado. Vamos finalizar o UPDATE da HONDA antes de ativar.")
            return

        meta_valida, meta = self.ler_meta_casos()

        if not meta_valida:
            self.status_var.set("Status: PARADO")
            self.meta_var.set("META: inválida")
            return

        self.meta_casos = meta
        self.meta_total_validada = False
        self.feitos_inicio_meta = None
        self.meta_restante_inicial = None
        self.total_inicial_luna = None
        self.meta_validada_no_inicio = False
        self.tempos_ultimos_casos = []
        self.tempo_estimado_base_segundos = None
        self.tempo_estimado_base_momento = None
        self.casos_desde_recalculo_estimativa = 0
        self.recalcular_estimativa_proximo_caso = True

        self.stop_event.clear()
        self.pause_event.clear()

        self.running = True
        self.total_casos = "-"
        self.feitos = "-"
        self.tempo_inicio = time.time()
        self.inicio_caso = None
        self.run_atual_ativa = False
        self.ultima_run_segundos = None

        self.pausa_inicio = None
        self.tempo_total_pausado = 0
        self.tempo_caso_pausado = 0

        if self.meta_casos is None:
            self.meta_var.set("META: sem limite")
            self.log("Meta de casos: sem limite.")
        else:
            self.meta_var.set(f"META: até {self.meta_casos}")
            self.log(f"Meta da sessão: processar {self.meta_casos} caso(s).")

        self.status_luna_atual = "INICIANDO"
        self.status_pdf_atual = "-"
        self.status_campos_atual = "-"
        self.status_gravar_atual = "-"
        self.ultimo_erro_atual = "-"
        self.total_recoveries = 0
        self.total_watchdogs = 0
        self.total_erros = 0
        self.ultimo_log_normalizado = None
        self.repeticoes_log_igual = 0
        self.atualizar_central_estado()

        if self.abrir_pdf_visual_var.get():
            self.log("Modo PDF visual: ativado.")
        else:
            self.log("Modo PDF visual: desativado. Rodando mais leve.")

        self.atualizar_contadores()
        self.tempo_var.set("TEMPO: 00:00:00")
        self.tempo_estimado_var.set("TEMPO ESTIMADO: --:--:--")
        self.run_atual_var.set("RUN ATUAL: 00:00")
        self.ultima_run_var.set("ULTIMA RUN: 00:00")
        self.ultima_run_label.config(fg="green")
        self.progresso_var.set(0)
        self.progresso_texto_var.set("0%")

        self.atualizar_tempo_total()
        self.atualizar_run_atual()
        self.atualizar_tempo_estimado_realtime()

        self.btn_play.config(state="disabled")
        self.btn_pause.config(state="normal", text="⏸ PAUSE")
        self.btn_stop.config(state="normal")
        self.qtd_casos_entry.config(state="disabled")
        self.check_abrir_pdf.config(state="disabled")
        self.status_var.set("Status: RODANDO")
        self.resetar_workflow("Iniciando operação na LUNA.")
        self.set_workflow("luna", "ativo", "Inicializando LUNA e preparando o primeiro caso.")

        self.bot_thread = threading.Thread(target=self.executar_bot, daemon=True)
        self.bot_thread.start()

    def pausar_ou_retomar(self):
        if not self.running:
            return

        if self.pause_event.is_set():
            if self.pausa_inicio is not None:
                tempo_pausado = time.time() - self.pausa_inicio
                self.tempo_total_pausado += tempo_pausado

                if self.run_atual_ativa and self.inicio_caso is not None:
                    self.tempo_caso_pausado += tempo_pausado

                self.pausa_inicio = None

            self.pause_event.clear()
            self.btn_pause.config(text="⏸ PAUSE")
            self.status_var.set("Status: RODANDO")
            self.log("Bot retomado.")

        else:
            self.pausa_inicio = time.time()
            self.pause_event.set()
            self.btn_pause.config(text="▶ RETOMAR")
            self.status_var.set("Status: PAUSADO")
            self.log("Bot pausado. Temporizadores congelados.")

    def parar_bot(self):
        if not self.running:
            return

        self.stop_event.set()
        self.pause_event.clear()
        self.run_atual_ativa = False
        self.status_var.set("Status: STOP acionado")
        self.log("STOP ACIONADO: ABORTANDO OPERAÇÃO IMEDIATAMENTE!")

    def finalizar_estado(self):
        self.running = False
        self.run_atual_ativa = False
        if getattr(self, "modulo_atual", "HONDA") == "HONDA":
            self.btn_play.config(state="normal")
        else:
            self.btn_play.config(state="disabled")
        self.btn_pause.config(state="disabled", text="⏸ PAUSE")
        self.btn_stop.config(state="disabled")
        self.qtd_casos_entry.config(state="normal")
        self.check_abrir_pdf.config(state="normal")

        # Ao parar, zera o estado da execução atual, mas preserva FEITOS da sessão do app.
        self.meta_casos = None
        self.meta_total_validada = False
        self.meta_validada_no_inicio = False
        self.feitos_inicio_meta = None
        self.meta_restante_inicial = None
        self.tempo_estimado_base_segundos = None
        self.tempo_estimado_base_momento = None
        self.recalcular_estimativa_proximo_caso = True
        self.meta_var.set(f"FEITOS: {self.casos_processados_sessao} | META: -")
        self.tempo_estimado_var.set("TEMPO ESTIMADO: --:--:--")
        self.status_luna_atual = "PARADO"
        self.status_pdf_atual = "-"
        self.status_campos_atual = "-"
        self.status_gravar_atual = "-"
        self.status_var.set("Status: PARADO")
        self.resetar_workflow("Operação parada. Pronto para iniciar novamente.")
        self.atualizar_contadores()
        self.atualizar_central_estado()

    def agora_contabil(self):
        if self.pause_event.is_set() and self.pausa_inicio is not None:
            return self.pausa_inicio

        return time.time()

    def extrair_numero(self, valor):
        if valor is None:
            return None

        texto = str(valor)
        numeros = re.findall(r"\d+", texto)

        if not numeros:
            return None

        return int(numeros[-1])

    def atualizar_barra_progresso(self):
        if self.meta_casos is not None:
            if self.meta_casos <= 0:
                self.progresso_var.set(0)
                self.progresso_texto_var.set("0%")
                return

            percentual = (self.casos_processados_sessao / self.meta_casos) * 100
            percentual = max(0, min(100, percentual))
            self.progresso_var.set(percentual)
            self.progresso_texto_var.set(f"{percentual:.1f}%")
            return

        total_base = self.total_inicial_luna or self.extrair_numero(self.total_casos)

        if not total_base or total_base <= 0:
            self.progresso_var.set(0)
            self.progresso_texto_var.set("0%")
            return

        percentual = (self.casos_processados_sessao / total_base) * 100
        percentual = max(0, min(100, percentual))

        self.progresso_var.set(percentual)
        self.progresso_texto_var.set(f"{percentual:.1f}%")

    def formatar_tempo_longo(self, segundos):
        segundos = int(segundos)
        segundos = max(0, segundos)
        horas = segundos // 3600
        minutos = (segundos % 3600) // 60
        segundos_restantes = segundos % 60
        return f"{horas:02}:{minutos:02}:{segundos_restantes:02}"

    def calcular_restantes(self):
        if self.meta_casos is not None:
            return max(0, self.meta_casos - self.casos_processados_sessao)

        total_base = self.total_inicial_luna or self.extrair_numero(self.total_casos)

        if total_base is None or total_base <= 0:
            return None

        return max(0, total_base - self.casos_processados_sessao)

    def recalcular_tempo_estimado(self, forcar=False):
        restantes = self.calcular_restantes()

        if restantes is None or not self.tempos_ultimos_casos:
            self.tempo_estimado_base_segundos = None
            self.tempo_estimado_base_momento = None
            self.tempo_estimado_var.set("TEMPO ESTIMADO: --:--:--")
            return

        if not forcar and not self.recalcular_estimativa_proximo_caso:
            return

        media = sum(self.tempos_ultimos_casos) / len(self.tempos_ultimos_casos)
        estimado = media * restantes

        self.tempo_estimado_base_segundos = max(0, int(estimado))
        self.tempo_estimado_base_momento = self.agora_contabil()
        self.casos_desde_recalculo_estimativa = 0
        self.recalcular_estimativa_proximo_caso = False

        self.tempo_estimado_var.set(f"TEMPO ESTIMADO: {self.formatar_tempo_longo(self.tempo_estimado_base_segundos)}")

    def atualizar_tempo_estimado_realtime(self):
        if not self.running:
            return

        if self.tempo_estimado_base_segundos is None or self.tempo_estimado_base_momento is None:
            self.tempo_estimado_var.set("TEMPO ESTIMADO: --:--:--")
        else:
            agora = self.agora_contabil()
            decorrido = max(0, int(agora - self.tempo_estimado_base_momento))
            restante_visual = max(0, self.tempo_estimado_base_segundos - decorrido)
            self.tempo_estimado_var.set(f"TEMPO ESTIMADO: {self.formatar_tempo_longo(restante_visual)}")

        self.root.after(1000, self.atualizar_tempo_estimado_realtime)


    def atualizar_meta_visual(self):
        if self.meta_casos is None:
            self.meta_var.set(f"FEITOS: {self.casos_processados_sessao} | META: sem limite")
            return

        restantes = max(0, self.meta_casos - self.casos_processados_sessao)
        self.meta_var.set(f"FEITOS: {self.casos_processados_sessao}/{self.meta_casos} | FALTAM: {restantes}")

    def meta_atingida(self):
        if self.meta_casos is None:
            return False

        return self.casos_processados_sessao >= self.meta_casos

    def validar_meta_com_total(self):
        total = self.extrair_numero(self.total_casos)
        feitos_luna = self.extrair_numero(self.feitos)

        if total is None or total <= 0:
            self.log_erro("Não consegui validar o limite porque o TOTAL da LUNA não foi encontrado.")
            self.stop_event.set()
            return False

        if feitos_luna is None:
            self.log_erro("Não consegui validar a meta porque o campo ORDEM da LUNA não foi encontrado.")
            self.stop_event.set()
            return False

        if self.total_inicial_luna is None:
            self.total_inicial_luna = total

        if self.meta_casos is None:
            self.meta_total_validada = True
            self.meta_validada_no_inicio = True
            self.recalcular_tempo_estimado(forcar=True)
            return True

        # IMPORTANTE:
        # A LUNA reseta ORDEM/TOTAL após refresh, metade+1 ou recovery.
        # Por isso, TOTAL/FEITOS da LUNA só validam a meta no começo da execução.
        # Depois disso, quem manda é casos_processados_sessao.
        if not self.meta_validada_no_inicio:
            if self.meta_casos > total:
                self.log_erro(f"Meta inválida: você colocou {self.meta_casos}, mas o TOTAL inicial da LUNA é {total}.")
                self.log_erro("O bot foi encerrado antes de processar para evitar erro de contagem.")
                self.meta_var.set("META: maior que TOTAL inicial")
                self.stop_event.set()
                return False

            self.feitos_inicio_meta = feitos_luna
            self.meta_restante_inicial = self.meta_casos
            self.meta_validada_no_inicio = True
            self.log(f"Meta validada pela sessão: processar {self.meta_casos} caso(s). TOTAL inicial LUNA: {total}.")

        self.meta_total_validada = True
        self.atualizar_meta_visual()
        self.recalcular_tempo_estimado(forcar=True)
        return True

    def atualizar_contadores(self, page=None):
        try:
            if page is not None:
                total_locator = page.locator('input[name="total"]').first

                if total_locator.count() > 0:
                    total_valor = total_locator.input_value().strip()

                    if total_valor:
                        self.total_casos = total_valor

                ordem_locator = page.locator('input[name="ordem"]').first

                if ordem_locator.count() > 0:
                    ordem_valor = ordem_locator.input_value().strip()

                    if ordem_valor:
                        numero_ordem = self.extrair_numero(ordem_valor)

                        if numero_ordem is not None:
                            self.feitos = str(max(0, numero_ordem - 1))
                        else:
                            self.feitos = ordem_valor

            self.contador_var.set(f"TOTAL LUNA: {self.total_casos} | FEITOS: {self.casos_processados_sessao}")
            self.atualizar_barra_progresso()
            self.atualizar_meta_visual()
            self.atualizar_central_estado()
            # O tempo estimado não é recalculado a cada atualização de contador.
            # Ele usa uma base que desce em tempo real e só é reajustada a cada 10 casos.

        except Exception as e:
            self.log_debug(f"Erro ao atualizar contadores: {e}")

    def formatar_tempo_curto(self, segundos):
        segundos = int(segundos)
        minutos = segundos // 60
        segundos_restantes = segundos % 60
        return f"{minutos:02}:{segundos_restantes:02}"

    def atualizar_tempo_total(self):
        if not self.running or self.tempo_inicio is None:
            return

        agora = self.agora_contabil()
        segundos = int(agora - self.tempo_inicio - self.tempo_total_pausado)
        segundos = max(0, segundos)

        horas = segundos // 3600
        minutos = (segundos % 3600) // 60
        segundos_restantes = segundos % 60

        self.tempo_var.set(f"TEMPO: {horas:02}:{minutos:02}:{segundos_restantes:02}")
        self.root.after(1000, self.atualizar_tempo_total)

    def atualizar_run_atual(self):
        if not self.running:
            return

        if self.run_atual_ativa and self.inicio_caso is not None:
            agora = self.agora_contabil()
            segundos = agora - self.inicio_caso - self.tempo_caso_pausado
            segundos = max(0, segundos)
            self.run_atual_var.set(f"RUN ATUAL: {self.formatar_tempo_curto(segundos)}")
        else:
            self.run_atual_var.set("RUN ATUAL: 00:00")

        self.root.after(1000, self.atualizar_run_atual)

    def iniciar_timer_caso(self):
        self.inicio_caso = time.time()
        self.tempo_caso_pausado = 0
        self.run_atual_ativa = True
        self.run_atual_var.set("RUN ATUAL: 00:00")

    def finalizar_timer_caso(self):
        if self.inicio_caso is None:
            return

        agora = self.agora_contabil()
        segundos_atual = int(agora - self.inicio_caso - self.tempo_caso_pausado)
        segundos_atual = max(0, segundos_atual)

        tempo_formatado = self.formatar_tempo_curto(segundos_atual)

        self.ultima_run_var.set(f"ULTIMA RUN: {tempo_formatado}")

        if self.ultima_run_segundos is None:
            self.ultima_run_label.config(fg="green")
        elif segundos_atual > self.ultima_run_segundos:
            self.ultima_run_label.config(fg="red")
        else:
            self.ultima_run_label.config(fg="green")

        self.ultima_run_segundos = segundos_atual

        self.tempos_ultimos_casos.append(segundos_atual)
        self.tempos_ultimos_casos = self.tempos_ultimos_casos[-5:]
        self.casos_desde_recalculo_estimativa += 1

        if self.tempo_estimado_base_segundos is None:
            self.recalcular_tempo_estimado(forcar=True)
        elif self.casos_desde_recalculo_estimativa >= 10:
            self.recalcular_estimativa_proximo_caso = True
            self.recalcular_tempo_estimado(forcar=True)

        self.run_atual_var.set("RUN ATUAL: 00:00")
        self.run_atual_ativa = False
        self.inicio_caso = None
        self.tempo_caso_pausado = 0

    def esperar_se_pausado(self):
        while self.pause_event.is_set() and not self.stop_event.is_set():
            time.sleep(0.08)

    def stop_solicitado(self):
        return self.stop_event.is_set()



    def abortar_se_stop(self):
        if self.stop_solicitado():
            raise OperacaoCancelada("STOP acionado pelo usuário")

    def aguardar_com_stop(self, segundos, passo=0.1):
        fim = time.time() + segundos

        while time.time() < fim:
            if self.stop_solicitado():
                return False
            time.sleep(passo)

        return not self.stop_solicitado()

    def tempo_caso_atual_segundos(self):
        if not self.run_atual_ativa or self.inicio_caso is None:
            return 0

        agora = self.agora_contabil()
        segundos = int(agora - self.inicio_caso - self.tempo_caso_pausado)
        return max(0, segundos)

    def watchdog_estourado(self):
        return self.tempo_caso_atual_segundos() >= WATCHDOG_CASO_SEGUNDOS

    def tratar_watchdog_caso(self, page=None, contexto="caso atual"):
        if not self.watchdog_estourado():
            return False

        self.total_watchdogs += 1
        self.set_estado_luna("WATCHDOG", ultimo_erro=f"Watchdog: {contexto}")
        self.log_watchdog(f"Caso travado por mais de {WATCHDOG_CASO_SEGUNDOS // 60} minuto(s). Contexto: {contexto}.")

        if page is not None:
            self.gerar_diagnostico_luna(
                page,
                contexto=f"watchdog - {contexto}",
                acao="Vou reiniciar a rotina da LUNA e refazer este caso. Nada foi registrado como concluído."
            )

            if not self.recuperar_fluxo_luna(page, motivo=f"watchdog de {WATCHDOG_CASO_SEGUNDOS // 60} minutos"):
                return True
        else:
            self.parar_para_revisao_manual("Watchdog estourou sem página válida. Possível travamento da LUNA/Edge. Revise manualmente.")

        self.run_atual_ativa = False
        self.run_atual_var.set("RUN ATUAL: 00:00")
        return True


    # =====================================================
    # HONDA - LOOP PRINCIPAL E PROCESSAMENTO TEXTUAL DE PDF
    # =====================================================
    def executar_bot(self):
        try:
            with sync_playwright() as p:
                while not self.stop_event.is_set():
                    self.esperar_se_pausado()

                    if self.stop_event.is_set():
                        break

                    if self.meta_atingida():
                        self.log("Meta de casos atingida. Encerrando bot.")
                        self.stop_event.set()
                        break

                    self.processar_um_caso(p)

        except Exception as e:
            self.log_erro(f"Erro fatal no bot: {e}")

        finally:
            self.log("Bot encerrado.")
            self.root.after(0, self.finalizar_estado)


    # =====================================================
    # CORE COMPARTILHADO - NORMALIZAÇÃO E PDF TEXTUAL
    # =====================================================
    def normalizar_texto(self, texto, preservar_ponto=False):
        if texto is None:
            return ""

        texto = str(texto).upper()
        texto = unicodedata.normalize("NFD", texto)
        texto = texto.encode("ascii", "ignore").decode("utf-8")

        if preservar_ponto:
            texto = re.sub(r"[^A-Z0-9\s/.]", "", texto)
        else:
            texto = re.sub(r"[^A-Z0-9\s/]", "", texto)

        texto = re.sub(r"\s+", " ", texto).strip()
        return texto

    def extrair_texto_pdf(self, url_pdf):
        caminho_temp = None

        try:
            response = requests.get(url_pdf, timeout=15)

            if response.status_code != 200:
                self.log_erro("Erro ao baixar PDF.")
                return "ERRO_PDF"

            conteudo = response.content

            if not conteudo or len(conteudo) < 100:
                self.log_erro("PDF inválido ou vazio.")
                return "ERRO_PDF"

            if not conteudo[:20].lstrip().startswith(b"%PDF"):
                self.log_erro("Arquivo baixado não parece ser PDF válido.")
                return "ERRO_PDF"

            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as arquivo_temp:
                caminho_temp = arquivo_temp.name
                arquivo_temp.write(conteudo)

            texto = ""

            try:
                pdf = fitz.open(caminho_temp)
            except Exception as e:
                self.log_erro(f"Erro ao abrir PDF no leitor interno: {e}")
                return "ERRO_PDF"

            try:
                if pdf.page_count == 0:
                    pdf.close()
                    self.log_erro("PDF sem páginas.")
                    return "ERRO_PDF"

                for pagina in pdf:
                    texto += pagina.get_text()

                pdf.close()

            except Exception as e:
                try:
                    pdf.close()
                except Exception:
                    pass

                self.log_erro(f"Erro ao ler páginas do PDF: {e}")
                return "ERRO_PDF"

            texto = texto.strip()

            if not texto:
                return None

            return texto

        except requests.exceptions.Timeout:
            self.log_erro("Timeout ao baixar PDF.")
            return "ERRO_PDF"

        except Exception as e:
            self.log_erro(f"Erro geral ao extrair PDF: {e}")
            return "ERRO_PDF"

        finally:
            if caminho_temp:
                try:
                    os.remove(caminho_temp)
                except Exception:
                    pass

    def encontrar_dados(self, texto):
        linhas = [linha.strip() for linha in texto.split("\n") if linha.strip()]

        if DEBUG:
            self.log_debug("\nLINHAS PDF:\n")
            for i, linha in enumerate(linhas):
                self.log_debug(f"{i} - {linha}")

        dados = {
            "cep": "",
            "estado": "",
            "cidade": "",
            "bairro": "",
            "numero": "",
            "endereco": "",
            "complemento": ""
        }

        candidatos = []

        for i, linha in enumerate(linhas):
            if re.fullmatch(r"\d{8}", linha):
                if i >= 5 and re.fullmatch(r"[A-Z]{2}", linhas[i - 1]):
                    candidatos.append(("normal", i))

        for i, linha in enumerate(linhas):
            if re.search(r"\b[A-Z]{2}\s+\d{8}\b", linha):
                candidatos.append(("compacto", i))

        if not candidatos:
            self.log_erro("CEP válido não encontrado.")
            return None

        tipo, i = candidatos[-1]

        try:
            if tipo == "normal":
                dados["cep"] = linhas[i]
                dados["estado"] = linhas[i - 1]
                dados["cidade"] = linhas[i - 2]

                linha_3 = linhas[i - 3]
                linha_4 = linhas[i - 4]
                linha_5 = linhas[i - 5]
                linha_6 = linhas[i - 6]

                if re.fullmatch(r"\d+[A-Z]?", linha_4):
                    dados["endereco"] = linha_5
                    dados["numero"] = linha_4
                    dados["bairro"] = linha_3
                    dados["complemento"] = ""
                else:
                    dados["endereco"] = linha_6
                    dados["numero"] = linha_5
                    dados["bairro"] = linha_4
                    dados["complemento"] = linha_3

                return dados

            if tipo == "compacto":
                linha_cidade = linhas[i]
                linha_endereco = linhas[i - 1]

                cep = re.search(r"\b\d{8}\b", linha_cidade).group()
                partes_cidade = linha_cidade.split()
                idx_cep = partes_cidade.index(cep)

                dados["cep"] = cep
                dados["estado"] = partes_cidade[idx_cep - 1]
                dados["cidade"] = " ".join(partes_cidade[:idx_cep - 1])

                partes = linha_endereco.split()

                numero_idx = None
                for j, parte in enumerate(partes):
                    if re.fullmatch(r"\d+[A-Z]?", parte):
                        numero_idx = j
                        break

                if numero_idx is None:
                    self.log_erro("Número não encontrado.")
                    return None

                dados["endereco"] = " ".join(partes[:numero_idx])
                dados["numero"] = partes[numero_idx]
                dados["bairro"] = " ".join(partes[numero_idx + 1:])
                dados["complemento"] = ""

                return dados

        except Exception as e:
            self.log_erro(f"Erro ao interpretar dados: {e}")
            return None


    # =====================================================
    # CORE COMPARTILHADO - MANIPULAÇÃO DE CAMPOS LUNA
    # =====================================================
    def limpar_locator(self, locator, descricao):
        try:
            if self.stop_solicitado():
                return False

            if locator.count() == 0:
                self.log_erro(f"Campo não encontrado: {descricao}")
                return False

            locator = locator.first
            locator.wait_for(state="visible", timeout=8000)
            if self.stop_solicitado():
                return False
            locator.click(force=True)
            if self.stop_solicitado():
                return False
            locator.press("Control+A")
            locator.press("Backspace")
            if self.stop_solicitado():
                return False
            locator.fill("")

            self.log_debug(f"Campo limpo: {descricao}")
            return True

        except Exception as e:
            self.log_erro(f"Erro ao limpar {descricao}: {e}")
            return False

    def limpar_campo(self, page, name):
        locator = page.locator(f'input[name="{name}"]')
        return self.limpar_locator(locator, name)

    def limpar_nome_cliente(self, page):
        tentativas = [
            'input[name="valor_nome"]',
            'input[name="valor_nome2"]',
            'input[name="valor_nome_cliente"]',
            'input[name="valor_cliente"]',
            'input[name="valor_resultado_nome"]',
            'input[name="valor_resultado_nome_cliente"]'
        ]

        for seletor in tentativas:
            try:
                locator = page.locator(seletor)

                if locator.count() > 0:
                    return self.limpar_locator(locator, "NOME CLIENTE")

            except Exception:
                pass

        # Campo opcional/aleatório na LUNA: ausência não é erro e não deve poluir o log.
        self.log_debug("Campo opcional NOME CLIENTE não apareceu neste caso.")
        return True

    def preencher_campo(self, page, name, valor):
        try:
            if self.stop_solicitado():
                return False

            locator = page.locator(f'input[name="{name}"]').first

            if locator.count() == 0:
                self.log_erro(f"Campo não encontrado: {name}")
                return False

            if name == "valor_grupo_cota":
                valor = self.normalizar_texto(valor, preservar_ponto=True)
            else:
                valor = self.normalizar_texto(valor)

            locator.wait_for(state="visible", timeout=8000)
            if self.stop_solicitado():
                return False
            locator.click(force=True)
            if self.stop_solicitado():
                return False
            locator.press("Control+A")
            locator.press("Backspace")
            if self.stop_solicitado():
                return False
            locator.fill(str(valor))

            self.log_debug(f"Campo preenchido: {name} -> {valor}")
            return True

        except Exception as e:
            self.log_erro(f"Erro ao preencher {name}: {e}")
            return False

    def limpar_campos_resultado(self, page):
        if self.stop_solicitado():
            return False

        self.limpar_nome_cliente(page)
        if self.stop_solicitado():
            return False
        self.limpar_campo(page, "valor_cpf_cnpj")

        campos_para_limpar = [
            "valor_resultado_cep",
            "valor_resultado_estado",
            "valor_resultado_cidade",
            "valor_resultado_bairro",
            "valor_resultado",
            "valor_resultado_numero",
            "valor_resultado_complemento"
        ]

        for campo in campos_para_limpar:
            if self.stop_solicitado():
                return False
            self.limpar_campo(page, campo)
            if not self.aguardar_com_stop(0.1):
                return False

        return True


    # =====================================================
    # CORE COMPARTILHADO - LOCALIZAÇÃO DE PDF / NAVEGAÇÃO LUNA
    # =====================================================
    def encontrar_botao_pdf(self, page):
        abrir_visualmente = self.abrir_pdf_visual_var.get()

        for frame in page.frames:
            try:
                botao = frame.locator('[onclick*="abrirPdf"]').first

                if botao.count() > 0:
                    onclick = botao.get_attribute("onclick")

                    if onclick:
                        if abrir_visualmente:
                            try:
                                self.log("Abrindo PDF visualmente para conferencia...")
                                botao.click(force=True)
                                self.log("PDF aberto para conferência visual. Seguindo imediatamente para OCR.")
                                time.sleep(0.01)
                            except Exception as e:
                                self.log_erro(f"Não consegui abrir o PDF visualmente, mas vou seguir: {e}")
                        else:
                            self.log("PDF localizado.")

                        return onclick
            except Exception:
                pass

        return None

    def encontrar_botao_pdf_sem_abrir(self, page):
        """Localiza o onclick do PDF sem clicar nem abrir visualmente.
        Usado pelo modo assistente para detectar troca de caso sem poluir abas.
        """
        try:
            for frame in page.frames:
                try:
                    botao = frame.locator('[onclick*="abrirPdf"]').first
                    if botao.count() > 0:
                        onclick = botao.get_attribute("onclick")
                        if onclick:
                            return onclick
                except Exception:
                    pass
        except Exception:
            pass
        return None

    def identificador_caso_volks(self, page):
        """Cria um identificador simples e estável do caso atual.
        Preferência: caminho do PDF dentro do onclick. Fallback: onclick completo + URL.
        """
        onclick = self.encontrar_botao_pdf_sem_abrir(page)
        if onclick:
            match = re.search(r"abrirPdf\('(.*?)'\)", onclick)
            if match:
                return "PDF:" + str(match.group(1)).strip()
            return "ONCLICK:" + str(onclick).strip()

        try:
            return "URL:" + str(page.url or "").strip()
        except Exception:
            return "SEM_IDENTIFICADOR"

    def aguardar_proximo_caso_volks(self, page, identificador_anterior):
        """Após preencher, aguarda o usuário clicar no botão GRAVAR CONFERIDO do AlphaBot.
        Só então executa jsGravarDados() e passa a observar a troca de caso.
        """
        self.log("AGUARDANDO CONFERÊNCIA MANUAL. Confira a LUNA e clique em ✅ GRAVAR CONFERIDO no AlphaBot quando estiver tudo certo.")
        self.log("O botão GRAVAR da LUNA não é usado neste modo; a gravação só acontece pelo seu clique no AlphaBot.")
        self.setar_botao_gravar_conferido_volks(True)

        ultimo_log = 0
        gravacao_disparada = False

        while not self.stop_solicitado():
            self.esperar_se_pausado()

            if not gravacao_disparada:
                if self.volks_gravar_conferido_event.is_set():
                    self.volks_gravar_conferido_event.clear()
                    self.setar_botao_gravar_conferido_volks(False)
                    gravacao_disparada = self.gravar_conferido_volks_js(page)
                    if not gravacao_disparada:
                        self.log("GRAVAR CONFERIDO não executou. Vou reabilitar o botão para nova tentativa.")
                        self.setar_botao_gravar_conferido_volks(True)
                    else:
                        ultimo_log = 0
                else:
                    agora = time.time()
                    if agora - ultimo_log > 45:
                        self.log("Ainda aguardando você clicar em ✅ GRAVAR CONFERIDO no AlphaBot...")
                        ultimo_log = agora
                    time.sleep(0.08)
                continue

            # Depois da gravação conferida, aí sim observamos a troca de caso.
            time.sleep(0.01)
            try:
                atual = self.identificador_caso_volks(page)
            except Exception as e:
                self.log_debug(f"Aguardando próximo caso: falha temporária ao consultar tela: {e}")
                atual = None

            if atual and atual != identificador_anterior and atual != "SEM_IDENTIFICADOR":
                self.log("Novo caso/PDF detectado. Vou aguardar a tela estabilizar e processar novamente.")
                self.aguardar_com_stop(0.2)
                return atual

            agora = time.time()
            if agora - ultimo_log > 20:
                self.log("GRAVAR CONFERIDO acionado. Ainda aguardando a LUNA trocar para o próximo caso...")
                ultimo_log = agora

        self.setar_botao_gravar_conferido_volks(False)
        return None


    # =====================================================
    # CORE COMPARTILHADO - REVISÃO MANUAL, DIALOGS E ALERTAS LUNA
    # =====================================================

    def pausar_para_revisao_manual(self, motivo="Bot pausado para revisao manual."):
        self.log_erro(motivo)
        self.pause_event.set()

        if self.pausa_inicio is None:
            self.pausa_inicio = time.time()

        self.root.after(0, lambda: self.btn_pause.config(text="RETOMAR"))
        self.root.after(0, lambda: self.status_var.set("Status: PAUSADO PARA REVISAO MANUAL"))

    def parar_para_revisao_manual(self, motivo="Bot parado para revisao manual."):
        self.log_erro(motivo)
        self.stop_event.set()
        self.pause_event.clear()
        self.run_atual_ativa = False
        self.root.after(0, lambda: self.status_var.set("Status: PARADO PARA REVISAO MANUAL"))

    def texto_indica_reinicio_luna(self, mensagem):
        texto = self.normalizar_texto(mensagem)
        return (
            "OCORREU UM ERRO" in texto
            and "APLICACAO" in texto
            and "REINICIALIZADA" in texto
        )

    def classificar_dialog_luna(self, mensagem):
        texto = self.normalizar_texto(mensagem)

        if "DADOS CARREGADOS" in texto and "SUCESSO" in texto:
            return "dados_carregados"

        if self.texto_indica_reinicio_luna(mensagem):
            return "recovery"

        termos_sessao = [
            "SESSAO",
            "EXPIR",
            "LOGIN",
            "AUTENTIC",
            "ACESSO NEGADO"
        ]

        if any(termo in texto for termo in termos_sessao):
            return "sessao"

        if "SUCESSO" in texto or "CARREGADO" in texto:
            return "sucesso"

        if "ERRO" in texto or "FALHA" in texto or "INVALID" in texto:
            return "erro"

        return "desconhecido"

    def registrar_dialog_luna(self, mensagem, contexto="LUNA"):
        tipo = self.classificar_dialog_luna(mensagem)
        self.ultimos_dialogs_luna.append((tipo, mensagem))
        self.ultimos_dialogs_luna = self.ultimos_dialogs_luna[-10:]

        if tipo == "dados_carregados":
            self.log(f"Dialog benigno ({contexto}): {mensagem}")
        elif tipo == "recovery":
            self.recovery_pendente = True
            self.ultimo_motivo_recovery = mensagem
            self.log_erro(f"Dialog de reinicialização ({contexto}): {mensagem}")
        elif tipo == "sessao":
            self.dialog_sessao_bloqueada = True
            self.log_erro(f"Possível sessão/login bloqueado ({contexto}): {mensagem}")
        elif tipo in ("erro", "desconhecido"):
            self.log_erro(f"Dialog inesperado ({tipo}) em {contexto}: {mensagem}")
        else:
            self.log(f"Dialog encontrado ({tipo}) em {contexto}: {mensagem}")

        return tipo

    def criar_handler_dialog_luna(self, contexto="LUNA"):
        def handler(dialog):
            try:
                mensagem = dialog.message
                self.registrar_dialog_luna(mensagem, contexto)
                dialog.accept()
                self.log_debug("Dialog confirmado automaticamente.")
            except Exception as e:
                erro = str(e)
                if "already handled" in erro or "Cannot accept dialog" in erro:
                    self.log_debug(f"Dialog já havia sido tratado por outro handler: {erro}")
                else:
                    self.log_erro(f"Erro ao tratar dialog da LUNA: {e}")

        return handler

    def tentar_aceitar_dialog_aberto(self, page, contexto="verificação de dialog aberto"):
        try:
            sessao = page.context.new_cdp_session(page)
            sessao.send("Page.handleJavaScriptDialog", {"accept": True})
            self.log("Possível dialog aberto foi confirmado automaticamente.")
            page.wait_for_timeout(500)
            return True
        except Exception:
            return False

    def classificar_alerta_gravacao(self, mensagem):
        texto = self.normalizar_texto(mensagem)

        if self.texto_indica_reinicio_luna(mensagem):
            return "recovery"

        if "DADOS CARREGADOS" in texto and "SUCESSO" in texto:
            return "sucesso"

        termos_sucesso = [
            "SUCESSO",
            "GRAVADO",
            "SALVO",
            "CADASTRADO",
            "ALTERADO",
            "ATUALIZADO",
            "REGISTRADO"
        ]

        termos_confirmacao = [
            "DESEJA",
            "CONFIRMA",
            "CONFIRMAR",
            "TEM CERTEZA",
            "CONTINUAR",
            "PROSSEGUIR"
        ]

        termos_sessao = [
            "SESSAO",
            "EXPIR",
            "LOGIN",
            "AUTENTIC",
            "ACESSO NEGADO"
        ]

        termos_bloqueio = [
            "ERRO",
            "INVALID",
            "OBRIGATOR",
            "NAO INFORMADO",
            "NAO ENCONTRADO",
            "JA EXISTE",
            "DUPLIC",
            "ATENCAO",
            "FALHA",
            "IMPOSSIVEL"
        ]

        if any(termo in texto for termo in termos_sucesso):
            return "sucesso"

        if any(termo in texto for termo in termos_sessao):
            return "sessao"

        if any(termo in texto for termo in termos_bloqueio):
            return "bloqueio"

        if any(termo in texto for termo in termos_confirmacao):
            return "confirmacao"

        return "desconhecido"


    # =====================================================
    # HONDA - GRAVAÇÃO E VALIDAÇÃO ANTES DO GRAVAR
    # =====================================================
    def clicar_gravar(self, page):
        handler_registrado = False

        try:
            botao = page.locator(
                'input[value="GRAVAR"], input[value="Gravar"], button:has-text("GRAVAR"), button:has-text("Gravar")'
            ).first

            if botao.count() == 0:
                self.log_erro("Botão GRAVAR não encontrado.")
                return False

            alertas = []
            alertas_classificados = []

            def confirmar_dialog(dialog):
                try:
                    mensagem = dialog.message
                    tipo_alerta = self.classificar_alerta_gravacao(mensagem)

                    if tipo_alerta == "recovery":
                        self.recovery_pendente = True
                        self.ultimo_motivo_recovery = mensagem

                    self.log(f"Alerta encontrado ({tipo_alerta}): {mensagem}")
                    dialog.accept()
                    self.log_debug("Alerta confirmado.")
                    alertas.append(mensagem)
                    alertas_classificados.append((tipo_alerta, mensagem))
                except Exception as e:
                    erro = str(e)
                    if "already handled" in erro or "Cannot accept dialog" in erro:
                        self.log_debug(f"Dialog de gravação já havia sido tratado por outro handler: {erro}")
                    else:
                        self.log_erro(f"Erro ao confirmar alerta: {e}")

            def avaliar_alertas_pos_gravar():
                if any(tipo == "recovery" for tipo, _ in alertas_classificados):
                    self.log_erro("Alerta de reinicialização da LUNA detectado. O caso será refeito após recovery.")
                    return "RECOVERY"

                alertas_problematicos = [
                    (tipo, mensagem)
                    for tipo, mensagem in alertas_classificados
                    if tipo in ("bloqueio", "sessao", "desconhecido")
                ]

                if alertas_problematicos:
                    tipo, mensagem = alertas_problematicos[-1]
                    self.log_erro(f"Gravacao nao confirmada. Alerta {tipo}: {mensagem}")
                    return False

                if any(tipo == "sucesso" for tipo, _ in alertas_classificados):
                    return True

                return None

            def aguardar_alerta_pos_gravar(segundos):
                inicio_espera = time.time()
                while time.time() - inicio_espera < segundos:
                    if self.stop_solicitado():
                        self.log("STOP acionado durante a gravação. Aguardando intervenção manual.")
                        return False

                    page.wait_for_timeout(200)
                    resultado = avaliar_alertas_pos_gravar()
                    if resultado is not None:
                        return resultado

                return None

            page.on("dialog", confirmar_dialog)
            handler_registrado = True

            botao.wait_for(state="visible", timeout=8000)

            self.log_debug("Aguardando 2 segundos antes de GRAVAR...")
            if not self.aguardar_com_stop(0.25):
                self.log("STOP acionado antes do GRAVAR. Clique abortado.")
                return False

            if self.stop_event.is_set() or self.pause_event.is_set():
                self.log_erro("Gravação pausada/cancelada antes do clique em GRAVAR.")
                return False

            botao.click(force=True)
            self.set_estado_luna(gravar="CLICADO")
            self.log("Cliquei em GRAVAR.")

            # A LUNA às vezes demora para abrir o segundo alerta de sucesso.
            # Por isso, aguardamos mais tempo e ainda fazemos uma varredura de dialog tardio.
            resultado = aguardar_alerta_pos_gravar(15)
            if resultado is not None:
                return resultado

            self.log("Alerta pós-GRAVAR não apareceu dentro do tempo normal. Procurando dialog tardio...")

            dialog_tardio_fechado = self.tentar_aceitar_dialog_aberto(page, contexto="pós-GRAVAR tardio")
            if dialog_tardio_fechado:
                self.log("Dialog tardio pós-GRAVAR foi confirmado. Aguardando resposta final da LUNA...")
                resultado = aguardar_alerta_pos_gravar(5)

                if resultado is not None:
                    return resultado

                # Se havia um dialog preso logo após o GRAVAR e ele foi aceito, o cenário mais provável
                # é confirmação/sucesso tardio da própria LUNA. Antes o bot já seguia sem alerta; aqui seguimos
                # também, mas registrando o ocorrido de forma limpa.
                self.log("Dialog tardio confirmado sem novo alerta. Considerando gravação concluída e seguindo fluxo.")
                return True

            # Última checagem: se nenhum alerta apareceu e não há dialog preso, mantém o comportamento seguro
            # anterior, mas agora com diagnóstico para análise posterior.
            if not alertas:
                self.log("Nenhum alerta apareceu após GRAVAR e nenhum dialog tardio ficou preso. Seguindo fluxo normal.")
                return True

            resultado = avaliar_alertas_pos_gravar()
            if resultado is not None:
                return resultado

            self.gerar_diagnostico_luna(
                page,
                contexto="GRAVAR sem confirmação clara",
                acao="Bot pausado para revisão antes de assumir nova ação."
            )
            self.log_erro("Gravacao sem confirmacao clara da LUNA.")
            return False

        except Exception as e:
            self.log_erro(f"Erro ao clicar em GRAVAR: {e}")
            try:
                self.gerar_diagnostico_luna(
                    page,
                    contexto="erro ao clicar em GRAVAR",
                    acao="Bot vai parar/aguardar revisão se a falha persistir."
                )
            except Exception:
                pass
            return False

        finally:
            if handler_registrado:
                try:
                    page.remove_listener("dialog", confirmar_dialog)
                except Exception:
                    pass


    # =====================================================
    # CORE COMPARTILHADO - FRAMES, SELECTS E PREPARAÇÃO LUNA
    # =====================================================
    def listar_frames_luna(self, page):
        frames = []

        try:
            frames.append(page)
        except Exception:
            pass

        try:
            for frame in page.frames:
                if frame not in frames:
                    frames.append(frame)
        except Exception:
            pass

        return frames

    def locator_existe(self, frame, seletor):
        try:
            return frame.locator(seletor).count() > 0
        except Exception:
            return False

    def obter_texto_options_select(self, select_locator):
        try:
            return select_locator.evaluate(
                """
                el => Array.from(el.options || []).map(o => ({
                    texto: (o.textContent || '').trim(),
                    valor: String(o.value || '').trim()
                }))
                """
            )
        except Exception:
            return []

    def selecionar_option_por_valor_ou_texto(self, select_locator, valor_opcao, texto_opcao, descricao):
        try:
            select_locator.wait_for(state="attached", timeout=8000)
            opcoes = self.obter_texto_options_select(select_locator)

            if not opcoes:
                self.log_erro(f"Select sem opções carregadas: {descricao}")
                return False

            valor_opcao = str(valor_opcao or "").strip()
            texto_opcao = str(texto_opcao or "").strip()
            alvo_normalizado = self.normalizar_texto(texto_opcao)

            valores_disponiveis = [str(opcao.get("valor", "")).strip() for opcao in opcoes]
            textos_disponiveis = [str(opcao.get("texto", "")).strip() for opcao in opcoes]

            if valor_opcao and valor_opcao in valores_disponiveis:
                select_locator.select_option(value=valor_opcao)
                self.log(f"Selecionado {descricao}: {texto_opcao or valor_opcao} (value={valor_opcao})")
                return True

            opcao_real = None
            for opcao in textos_disponiveis:
                if self.normalizar_texto(opcao) == alvo_normalizado:
                    opcao_real = opcao
                    break

            if opcao_real is None:
                self.log_erro(f"Opção não encontrada em {descricao}: {texto_opcao or valor_opcao}")
                self.log_debug(f"Opções disponíveis em {descricao}: {opcoes}")
                return False

            select_locator.select_option(label=opcao_real)
            self.log(f"Selecionado {descricao}: {opcao_real}")
            return True

        except Exception as e:
            self.log_erro(f"Erro ao selecionar {descricao}: {e}")
            return False

    def encontrar_select_por_name(self, page, name):
        seletor = f'select[name="{name}"]'

        for frame in self.listar_frames_luna(page):
            try:
                locator = frame.locator(seletor).first
                if locator.count() > 0:
                    return locator
            except Exception:
                pass

        return None

    def selecionar_banco_e_tipo_luna(self, page, modulo="HONDA"):
        modulo = str(modulo).upper().strip()
        config = MODULOS_LUNA.get(modulo)

        if not config:
            self.log_erro(f"Módulo não configurado: {modulo}")
            return False

        banco = config["banco"]
        banco_value = config.get("banco_value")
        tipo = config["tipo"]
        tipo_value = config.get("tipo_value")

        self.log(f"Preparando tela inicial da LUNA para {modulo}...")

        select_banco = self.encontrar_select_por_name(page, "id_cliente_p")
        if not select_banco:
            self.log_erro('Não encontrei o menu de banco: select[name="id_cliente_p"]')
            return False

        if not self.selecionar_option_por_valor_ou_texto(select_banco, banco_value, banco, "banco"):
            return False

        page.wait_for_timeout(1200)

        select_tipo = self.encontrar_select_por_name(page, "id_cliente")
        if not select_tipo:
            self.log_erro('Não encontrei o menu de tipo documental: select[name="id_cliente"]')
            return False

        if not self.selecionar_option_por_valor_ou_texto(select_tipo, tipo_value, tipo, "tipo documental"):
            return False

        page.wait_for_timeout(1200)
        self.atualizar_contadores(page)
        return True

    def clicar_elemento_por_seletores(self, page, seletores, descricao):
        for frame in self.listar_frames_luna(page):
            for seletor in seletores:
                try:
                    locator = frame.locator(seletor).first
                    if locator.count() > 0:
                        locator.click(force=True, timeout=3000)
                        self.log_debug(f"Clique por seletor em {descricao}: {seletor}")
                        return True
                except Exception:
                    pass

        return False

    def clicar_seta_luna(self, page, direcao):
        direcao = str(direcao).lower().strip()

        if direcao == "direita":
            descricao = "seta direita"
            seletores = [
                'img[onclick="jsProximo()"]',
                '[onclick="jsProximo()"]',
                'img[src*="/pro.png"]',
                '[onclick*="jsProximo"]',
                '[onclick*="proximo" i]',
                '[onclick*="prox" i]'
            ]
            offset_x = -13
        else:
            descricao = "seta esquerda"
            seletores = [
                'img[onclick="jsAnterior()"]',
                '[onclick="jsAnterior()"]',
                'img[src*="/ant.png"]',
                '[onclick*="jsAnterior"]',
                '[onclick*="anterior" i]',
                '[onclick*="prev" i]'
            ]
            offset_x = -38

        if self.clicar_elemento_por_seletores(page, seletores, descricao):
            self.log(f"Cliquei na {descricao}.")
            return True

        try:
            ordem = page.locator('input[name="ordem"]').first
            if ordem.count() > 0:
                box = ordem.bounding_box(timeout=3000)
                if box:
                    x = box["x"] + offset_x
                    y = box["y"] + (box["height"] / 2)
                    page.mouse.click(x, y)
                    self.log(f"Cliquei na {descricao} por coordenada de segurança.")
                    return True
        except Exception as e:
            self.log_debug(f"Fallback de coordenada falhou para {descricao}: {e}")

        self.log_erro(f"Não consegui clicar na {descricao} da LUNA.")
        return False

    def texto_pagina_luna(self, page):
        textos = []

        for frame in self.listar_frames_luna(page):
            try:
                texto = frame.locator("body").inner_text(timeout=1500)
                if texto:
                    textos.append(texto)
            except Exception:
                pass

        return "\n".join(textos)

    def detectar_documento_ja_verificado(self, page):
        try:
            texto = self.normalizar_texto(self.texto_pagina_luna(page))
            return "ESSE DOCUMENTO JA FOI VERIFICADO" in texto
        except Exception:
            return False

    def validar_tela_processada_luna(self, page):
        seletores_obrigatorios = [
            'input[name="ordem"]',
            'input[name="total"]'
        ]

        seletores_campos_essenciais = [
            'input[name="valor_grupo_cota"]',
            'input[name="valor_resultado_cep"]',
            'input[name="valor_resultado"]',
            'input[name="valor_resultado_estado"]'
        ]

        if self.detectar_documento_ja_verificado(page):
            return False

        for frame in self.listar_frames_luna(page):
            try:
                tem_base = all(self.locator_existe(frame, seletor) for seletor in seletores_obrigatorios)
                tem_campos = all(self.locator_existe(frame, seletor) for seletor in seletores_campos_essenciais)

                if tem_base and tem_campos:
                    return True
            except Exception:
                pass

        return False

    def diagnosticar_tela_luna(self, page):
        diagnostico = {
            "ordem": False,
            "total": False,
            "banco": False,
            "tipo": False,
            "grupo_cota": False,
            "cep": False,
            "endereco": False,
            "estado": False,
            "pdf": False,
            "gravar": False
        }

        mapa = {
            "ordem": 'input[name="ordem"]',
            "total": 'input[name="total"]',
            "banco": 'select[name="id_cliente_p"]',
            "tipo": 'select[name="id_cliente"]',
            "grupo_cota": 'input[name="valor_grupo_cota"]',
            "cep": 'input[name="valor_resultado_cep"]',
            "endereco": 'input[name="valor_resultado"]',
            "estado": 'input[name="valor_resultado_estado"]',
            "pdf": 'img[onclick*="abrirPdf"]',
            "gravar": 'input#botao[value="GRAVAR"], input[onclick="jsGravarDados()"]'
        }

        for frame in self.listar_frames_luna(page):
            for chave, seletor in mapa.items():
                if not diagnostico[chave] and self.locator_existe(frame, seletor):
                    diagnostico[chave] = True

        ausentes = [chave for chave, ok in diagnostico.items() if not ok]
        presentes = [chave for chave, ok in diagnostico.items() if ok]
        self.log_debug(f"Diagnóstico LUNA - presentes: {presentes}")
        self.log_debug(f"Diagnóstico LUNA - ausentes: {ausentes}")
        return diagnostico

    def causa_provavel_diagnostico(self, diagnostico, contexto=""):
        contexto_norm = self.normalizar_texto(contexto)

        if self.dialog_sessao_bloqueada:
            return "Possível causa: a sessão da LUNA expirou ou o login caiu. Faça login novamente no Edge Debug."

        if diagnostico.get("documento_ja_verificado"):
            return "Possível causa: a LUNA chegou na metade+1 do lote e marcou o documento como já verificado. O caminho correto é recarregar a rotina e reprocessar o fluxo."

        if not diagnostico.get("ordem") and not diagnostico.get("total") and not diagnostico.get("banco"):
            return "Possível causa: a página da LUNA não carregou corretamente, caiu, ou você não está na tela da rotina. Se o recovery não resolver, pode ser queda do sistema."

        if diagnostico.get("banco") and diagnostico.get("tipo") and not diagnostico.get("grupo_cota"):
            return "Possível causa: a tela inicial carregou, mas os campos do caso ainda não foram processados. Normalmente avançar e voltar resolve."

        if "PDF" in contexto_norm or not diagnostico.get("pdf"):
            return "Possível causa: o caso ainda não carregou o ícone do PDF, a LUNA travou parcialmente, ou o documento não foi disponibilizado pelo sistema."

        if not diagnostico.get("estado") or not diagnostico.get("cep") or not diagnostico.get("endereco"):
            return "Possível causa: os campos de preenchimento não carregaram completamente. Evitei gravar para não registrar dados em tela incompleta."

        if not diagnostico.get("gravar"):
            return "Possível causa: a tela carregou sem o botão de gravação, indicando travamento parcial ou layout inesperado da LUNA."

        return "Possível causa: estado inconsistente da LUNA. O AlphaBot vai tentar recovery; se repetir, revise manualmente."

    def gerar_diagnostico_luna(self, page, contexto="falha", acao="Recovery será tentado."):
        diagnostico = self.diagnosticar_tela_luna(page)

        try:
            diagnostico["documento_ja_verificado"] = self.detectar_documento_ja_verificado(page)
        except Exception:
            diagnostico["documento_ja_verificado"] = False

        try:
            diagnostico["url"] = self.obter_url_segura(page)
        except Exception:
            diagnostico["url"] = ""

        linhas = [
            "",
            "===== DIAGNÓSTICO LUNA =====",
            f"Contexto: {contexto}",
            f"URL atual: {diagnostico.get('url') or 'não identificada'}",
            f"Ordem: {'OK' if diagnostico.get('ordem') else 'AUSENTE'}",
            f"Total: {'OK' if diagnostico.get('total') else 'AUSENTE'}",
            f"Menu banco: {'OK' if diagnostico.get('banco') else 'AUSENTE'}",
            f"Menu tipo: {'OK' if diagnostico.get('tipo') else 'AUSENTE'}",
            f"Grupo/Cota: {'OK' if diagnostico.get('grupo_cota') else 'AUSENTE'}",
            f"CEP: {'OK' if diagnostico.get('cep') else 'AUSENTE'}",
            f"Endereço: {'OK' if diagnostico.get('endereco') else 'AUSENTE'}",
            f"Estado: {'OK' if diagnostico.get('estado') else 'AUSENTE'}",
            f"PDF: {'OK' if diagnostico.get('pdf') else 'AUSENTE'}",
            f"GRAVAR: {'OK' if diagnostico.get('gravar') else 'AUSENTE'}",
            f"Documento já verificado: {'SIM' if diagnostico.get('documento_ja_verificado') else 'NÃO'}",
            self.causa_provavel_diagnostico(diagnostico, contexto),
            f"Ação tomada: {acao}",
            "============================",
            ""
        ]

        self.log_erro("\n".join(linhas))
        return diagnostico

    def obter_valor_input_luna(self, page, name):
        seletor = f'input[name="{name}"]'

        for frame in self.listar_frames_luna(page):
            try:
                locator = frame.locator(seletor).first
                if locator.count() > 0:
                    return locator.input_value(timeout=3000)
            except Exception:
                pass

        return None

    def validar_campos_antes_gravar(self, page, grupo_cota, dados):
        esperados = {
            "valor_grupo_cota": grupo_cota,
            "valor_resultado_cep": dados.get("cep", ""),
            "valor_resultado_estado": dados.get("estado", ""),
            "valor_resultado_cidade": dados.get("cidade", ""),
            "valor_resultado_bairro": dados.get("bairro", ""),
            "valor_resultado": dados.get("endereco", ""),
            "valor_resultado_numero": "S/N" if str(dados.get("numero", "")).strip() == "0" else dados.get("numero", ""),
        }

        erros = []

        for campo, esperado in esperados.items():
            valor_tela = self.obter_valor_input_luna(page, campo)

            if valor_tela is None:
                erros.append(f"{campo}: campo ausente")
                continue

            valor_norm = self.normalizar_texto(valor_tela, preservar_ponto=(campo == "valor_grupo_cota"))
            esperado_norm = self.normalizar_texto(esperado, preservar_ponto=(campo == "valor_grupo_cota"))

            if not valor_norm:
                erros.append(f"{campo}: vazio")
                continue

            if campo == "valor_resultado_cep" and not re.fullmatch(r"\d{8}", valor_norm):
                erros.append(f"CEP inválido: {valor_tela}")
                continue

            if campo == "valor_resultado_estado" and not re.fullmatch(r"[A-Z]{2}", valor_norm):
                erros.append(f"UF inválida: {valor_tela}")
                continue

            if campo == "valor_resultado_numero" and not (re.fullmatch(r"\d+[A-Z]?", valor_norm) or valor_norm == "S/N"):
                erros.append(f"Número inválido: {valor_tela}")
                continue

            if esperado_norm and valor_norm != esperado_norm:
                erros.append(f"{campo}: tela='{valor_norm}' / esperado='{esperado_norm}'")

        if erros:
            self.log_erro("Validação pré-GRAVAR falhou. GRAVAR bloqueado.")
            for erro in erros:
                self.log_erro(f"- {erro}")

            self.gerar_diagnostico_luna(
                page,
                contexto="validação pré-GRAVAR",
                acao="Bot pausado para revisão. Nenhum clique em GRAVAR foi feito."
            )
            self.pausar_para_revisao_manual("Validação pré-GRAVAR falhou. Confira os campos antes de continuar.")
            return False

        self.log("Validação pré-GRAVAR aprovada.")
        return True

    def forcar_carregamento_caso_luna(self, page):
        self.log("Forçando carregamento da LUNA: avançar e voltar...")

        if not self.clicar_seta_luna(page, "direita"):
            return False

        page.wait_for_timeout(1800)
        self.atualizar_contadores(page)

        if not self.clicar_seta_luna(page, "esquerda"):
            return False

        page.wait_for_timeout(2500)
        self.atualizar_contadores(page)

        if self.validar_tela_processada_luna(page):
            self.log("Tela processada: campos/PDF carregados.")
            return True

        self.diagnosticar_tela_luna(page)
        self.log_erro("A LUNA ainda não carregou os campos após avançar e voltar.")
        return False

    def preparar_tela_inicial_luna(self, page, modulo="HONDA"):
        self.tentar_aceitar_dialog_aberto(page, contexto="preparação da tela")

        if self.recovery_pendente:
            self.recovery_pendente = False
            return self.recuperar_fluxo_luna(page, motivo="dialog de reinicialização detectado na preparação")

        if self.dialog_sessao_bloqueada:
            self.parar_para_revisao_manual("A LUNA parece ter perdido login/sessão. Faça login novamente e revise manualmente.")
            return False

        if self.validar_tela_processada_luna(page):
            self.log_debug("Tela da LUNA já parece processada.")
            return True

        if self.detectar_documento_ja_verificado(page):
            self.log_erro("Tela de documento já verificado detectada. Vou reiniciar o fluxo da LUNA.")
            return self.recuperar_fluxo_luna(page, motivo="documento já verificado")

        self.log("Tela inicial ou tela sem campos detectada.")
        self.diagnosticar_tela_luna(page)

        if not self.selecionar_banco_e_tipo_luna(page, modulo):
            return False

        return self.forcar_carregamento_caso_luna(page)

    def ir_para_rotina_luna(self, page):
        handler_dialog = self.criar_handler_dialog_luna("carregamento da rotina")
        handler_registrado = False

        try:
            self.log("Abrindo rotina inicial da LUNA...")
            page.on("dialog", handler_dialog)
            handler_registrado = True

            page.goto(ROTINA_LUNA_URL, wait_until="load", timeout=20000)
            page.wait_for_timeout(1800)

            if self.dialog_sessao_bloqueada:
                self.parar_para_revisao_manual("A LUNA parece ter perdido login/sessão. Faça login novamente e revise manualmente.")
                return False

            return True

        except Exception as e:
            self.log_erro(f"Erro ao abrir rotina inicial da LUNA: {e}")

            if self.tentar_aceitar_dialog_aberto(page, contexto="após falha ao abrir rotina"):
                return True

            return False

        finally:
            if handler_registrado:
                try:
                    page.remove_listener("dialog", handler_dialog)
                except Exception:
                    pass

    def recuperar_fluxo_luna(self, page, motivo="tela quebrada"):
        self.total_recoveries += 1
        self.set_estado_luna("RECOVERY", pdf="-", campos="REVALIDANDO", gravar="-")
        self.log_recovery(f"Recovery da LUNA iniciado. Motivo: {motivo}.")

        for tentativa in range(1, MAX_TENTATIVAS_RECOVERY + 1):
            if self.stop_event.is_set():
                return False

            self.log_recovery(f"Tentativa {tentativa}/{MAX_TENTATIVAS_RECOVERY}...")

            if not self.ir_para_rotina_luna(page):
                continue

            self.atualizar_contadores(page)

            if self.validar_tela_processada_luna(page):
                self.set_estado_luna("OK", campos="OK")
                self.log_sucesso("Recovery concluído: tela já estava processada após recarregar.")
                return True

            if not self.selecionar_banco_e_tipo_luna(page, self.modulo_atual):
                self.log_erro("Recovery falhou na seleção de banco/tipo.")
                continue

            if self.forcar_carregamento_caso_luna(page):
                self.set_estado_luna("OK", campos="OK")
                self.log_sucesso("Recovery concluído com sucesso.")
                return True

            self.log_erro("Recovery não conseguiu validar a tela nesta tentativa.")

        self.gerar_diagnostico_luna(
            page,
            contexto="recovery falhou 3 vezes",
            acao="AlphaBot será parado para revisão humana/relogin se necessário."
        )
        self.parar_para_revisao_manual(
            "Recovery falhou 3 vezes. AlphaBot parado para revisão humana/relogin se necessário."
        )
        return False


    def fechar_dialog_pendente_via_cdp_bruto(self):
        """Tenta fechar um dialog JavaScript antes do Playwright conectar.

        Em alguns casos a LUNA deixa um alert aberto, como "DADOS CARREGADOS COM SUCESSO!",
        e o connect_over_cdp pode travar/falhar antes do bot conseguir registrar um handler normal.
        Esta rotina usa o WebSocket bruto do Chrome DevTools só para aceitar o dialog pendente
        e liberar a aba para a conexão normal do Playwright.
        """
        if websocket is None:
            self.log_debug("Pacote websocket-client indisponível; não consegui usar CDP bruto.")
            return False

        try:
            abas = requests.get("http://localhost:9222/json", timeout=2).json()
        except Exception as e:
            self.log_debug(f"Não consegui listar abas via CDP bruto: {e}")
            return False

        alvo = None
        for aba in abas:
            url = str(aba.get("url", "")).lower()
            tipo = str(aba.get("type", "")).lower()
            if tipo == "page" and "paschoalotto" in url and "leitor" not in url:
                alvo = aba
                break

        if alvo is None:
            for aba in abas:
                url = str(aba.get("url", "")).lower()
                tipo = str(aba.get("type", "")).lower()
                if tipo == "page" and "paschoalotto" in url:
                    alvo = aba
                    break

        if alvo is None:
            self.log_debug("Nenhuma aba da LUNA encontrada via CDP bruto.")
            return False

        ws_url = alvo.get("webSocketDebuggerUrl")
        if not ws_url:
            self.log_debug("Aba da LUNA sem webSocketDebuggerUrl no CDP bruto.")
            return False

        ws = None
        try:
            ws = websocket.create_connection(ws_url, timeout=3)

            # Habilita eventos da Page; se já houver dialog aberto, o Chrome costuma permitir
            # handleJavaScriptDialog diretamente. Se não houver, a chamada retorna erro e ignoramos.
            ws.send(json.dumps({"id": 1, "method": "Page.enable"}))
            try:
                ws.recv()
            except Exception:
                pass

            ws.send(json.dumps({
                "id": 2,
                "method": "Page.handleJavaScriptDialog",
                "params": {"accept": True}
            }))

            resposta = ""
            try:
                resposta = ws.recv()
            except Exception:
                pass

            if "error" in str(resposta).lower():
                self.log_debug(f"CDP bruto não encontrou dialog pendente: {resposta}")
                return False

            self.log("Dialog pendente fechado antes da conexão Playwright.")
            time.sleep(0.5)
            return True

        except Exception as e:
            self.log_debug(f"Falha ao fechar dialog via CDP bruto: {e}")
            return False

        finally:
            if ws is not None:
                try:
                    ws.close()
                except Exception:
                    pass

    def porta_edge_debug_ativa(self):
        try:
            resposta = requests.get("http://localhost:9222/json/version", timeout=2)
            return resposta.status_code == 200
        except Exception:
            return False

    def obter_url_segura(self, page):
        try:
            return page.url or ""
        except Exception as e:
            self.log_debug(f"Não consegui ler URL da aba: {e}")
            return ""

    def conectar_sistema(self, p):
        browser = None

        if not self.porta_edge_debug_ativa():
            self.log_erro("Edge Debug não está respondendo na porta 9222.")
            self.log_erro("Feche os Edges abertos, clique em 'Abrir Edge Debug' e abra a LUNA nessa janela.")
            return None, None

        try:
            browser = p.chromium.connect_over_cdp("http://localhost:9222", timeout=8000)
        except Exception as e:
            self.log_debug(f"Primeira tentativa de conexão CDP falhou: {e}")
            self.log("Playwright não conectou de primeira. Verificando se há dialog pendente travando a LUNA...")

            dialog_fechado = self.fechar_dialog_pendente_via_cdp_bruto()

            if dialog_fechado:
                try:
                    browser = p.chromium.connect_over_cdp("http://localhost:9222", timeout=8000)
                    self.log("Conexão Playwright restabelecida após fechar dialog pendente.")
                except Exception as e2:
                    self.log_erro("Edge Debug está aberto, mas o Playwright ainda não conseguiu conectar após fechar dialog pendente.")
                    self.log_erro("Feche o Edge e abra novamente pelo botão do app.")
                    self.log_debug(f"Detalhe técnico da segunda conexão CDP: {e2}")
                    return None, None
            else:
                self.log_erro("Edge Debug está aberto, mas o Playwright não conseguiu conectar.")
                self.log_erro("Isso pode acontecer se o Edge travou, se a porta 9222 ficou presa ou se há um dialog bloqueando a aba.")
                self.log_erro("Feche o Edge e abra pelo botão do app se persistir.")
                return None, None

        try:
            if not browser.contexts:
                self.log_erro("Conectei no Edge Debug, mas não encontrei contexto de navegador.")
                return browser, None

            context = browser.contexts[0]
            page = None

            for aba in context.pages:
                url = self.obter_url_segura(aba).lower()
                if "paschoalotto" in url and "leitor" not in url:
                    page = aba
                    break

            if not page:
                for aba in context.pages:
                    url = self.obter_url_segura(aba).lower()
                    if "paschoalotto" in url:
                        page = aba
                        break

            if not page:
                self.log_erro("Conectei no Edge Debug, mas a aba da LUNA não foi encontrada.")
                self.log_erro("Abra a LUNA na janela do Edge Debug antes de apertar PLAY.")
                return browser, None

            handler_dialog_inicial = self.criar_handler_dialog_luna("conexão inicial")
            page.on("dialog", handler_dialog_inicial)
            self.log("Conectado à LUNA.")

            # Se o usuário deixou um alert aberto antes de apertar PLAY, o Playwright pode ficar
            # bloqueado ao tentar ler campos da tela. Fecha esse dialog primeiro e segue.
            if self.tentar_aceitar_dialog_aberto(page, contexto="conexão inicial"):
                self.log("Dialog pendente fechado na conexão inicial. Validando tela novamente...")
                page.wait_for_timeout(700)

            if self.dialog_sessao_bloqueada:
                self.parar_para_revisao_manual("A LUNA parece ter perdido login/sessão. Faça login novamente e revise manualmente.")
                return browser, None

            if self.recovery_pendente:
                self.log_erro("Dialog de reinicialização estava pendente na conexão. Vou recuperar a LUNA antes de continuar.")

            try:
                page.remove_listener("dialog", handler_dialog_inicial)
            except Exception:
                pass

            self.atualizar_contadores(page)
            return browser, page

        except Exception as e:
            self.log_erro("Conectei no Edge Debug, mas falhei ao preparar a aba da LUNA.")
            self.log_erro("Se havia um dialog aberto, ele será tratado na próxima tentativa; se persistir, revise manualmente.")
            self.log_debug(f"Detalhe técnico após conexão: {e}")

            if browser:
                try:
                    browser.close()
                except Exception:
                    pass

            return None, None


    # =====================================================
    # HONDA - AÇÕES DE RESULTADO / ERROS PADRÃO
    # =====================================================
    def registrar_caso_gravado(self, page=None):
        self.finalizar_timer_caso()

        self.casos_processados_sessao += 1
        self.atualizar_meta_visual()

        if page is not None:
            self.atualizar_contadores(page)
        else:
            self.atualizar_contadores()

        if self.meta_atingida():
            self.log(f"Meta atingida: FEITOS chegou em {self.casos_processados_sessao}/{self.meta_casos}.")
            self.stop_event.set()

    def preencher_erro_pdf(self, page, grupo_cota):
        self.log("Marcando caso como ERRO NO PDF.")

        self.limpar_campos_resultado(page)
        self.preencher_campo(page, "valor_grupo_cota", grupo_cota)
        self.preencher_campo(page, "valor_resultado", "ERRO NO PDF")

        resultado_gravacao = self.clicar_gravar(page)

        if resultado_gravacao is True:
            self.registrar_caso_gravado(page)
            self.log("Caso gravado como ERRO NO PDF.\n")
        elif resultado_gravacao == "RECOVERY":
            self.recuperar_fluxo_luna(page, motivo="alerta de reinicialização ao gravar ERRO NO PDF")
        else:
            self.pausar_para_revisao_manual("Nao consegui gravar ERRO NO PDF. Verifique manualmente.")

    def preencher_faltando_endereco(self, page, grupo_cota):
        self.log("Marcando caso como FALTANDO ENDERECO.")

        self.limpar_campos_resultado(page)
        self.preencher_campo(page, "valor_grupo_cota", grupo_cota)
        self.preencher_campo(page, "valor_resultado", "FALTANDO ENDERECO")

        resultado_gravacao = self.clicar_gravar(page)

        if resultado_gravacao is True:
            self.registrar_caso_gravado(page)
            self.log("Caso gravado como FALTANDO ENDERECO.\n")
        elif resultado_gravacao == "RECOVERY":
            self.recuperar_fluxo_luna(page, motivo="alerta de reinicialização ao gravar FALTANDO ENDERECO")
        else:
            self.pausar_para_revisao_manual("Nao consegui gravar FALTANDO ENDERECO. Verifique manualmente.")


    # =====================================================
    # VOLKS - DIAGNÓSTICO / OCR / PARSER / ASSISTENTE MANUAL
    # ATENÇÃO: backend VOLKS estável baseado na v35, com otimizações v38 e correção v41 para endereço com SAO PAULO na via/RUA RUA e correção v43 do cache de cidades VOLKS.
    # Evitar mudanças agressivas aqui sem teste em PDF real.
    # =====================================================
    def iniciar_bot_volks_diagnostico(self):
        if self.running:
            return

        self.modulo_atual = "VOLKS"
        self.atualizar_botoes_modulo()
        self.stop_event.clear()
        self.pause_event.clear()
        self.volks_gravar_conferido_event.clear()
        self.setar_botao_gravar_conferido_volks(False)
        self.running = True
        self.tempo_inicio = time.time()
        self.inicio_caso = None
        self.run_atual_ativa = False
        self.total_erros = 0
        self.ultimo_erro_atual = "-"
        self.status_var.set("Status: RODANDO VOLKS DIAGNÓSTICO")
        self.log("VOLKS diagnóstico iniciado. Nenhum campo será preenchido e nada será gravado.")

        try:
            if hasattr(self, "btn_volks_diagnostico"):
                self.btn_volks_diagnostico.config(state="disabled")
            if hasattr(self, "btn_volks_preencher_teste"):
                self.btn_volks_preencher_teste.config(state="disabled")
            if hasattr(self, "btn_volks_assistente"):
                self.btn_volks_assistente.config(state="disabled")
            if hasattr(self, "btn_volks_stop"):
                self.btn_volks_stop.config(state="normal")
            self.atualizar_estado_botoes_compacto_volks()
        except Exception:
            pass

        self.bot_thread = threading.Thread(target=self.executar_bot_volks_diagnostico, daemon=True)
        self.bot_thread.start()

    def executar_bot_volks_diagnostico(self):
        try:
            with sync_playwright() as p:
                self.processar_volks_diagnostico(p)
        except OperacaoCancelada:
            self.log("Diagnóstico VOLKS interrompido por STOP.")
        except Exception as e:
            if self.stop_solicitado():
                self.log("Diagnóstico VOLKS interrompido por STOP.")
            else:
                self.log_erro(f"Erro fatal no diagnóstico VOLKS: {e}")
        finally:
            self.log("Diagnóstico VOLKS encerrado.")
            self.root.after(0, self.finalizar_estado_volks)

    def finalizar_estado_volks(self):
        self.running = False
        self.run_atual_ativa = False
        self.status_var.set("Status: PARADO")
        try:
            if hasattr(self, "btn_volks_assistente"):
                self.btn_volks_assistente.config(state="normal")
            if hasattr(self, "btn_volks_stop"):
                self.btn_volks_stop.config(state="disabled")
            self.atualizar_estado_botoes_compacto_volks()
            if hasattr(self, "btn_volks_gravar_conferido"):
                self.btn_volks_gravar_conferido.config(state="disabled", text="✅ GRAVAR CONFERIDO")
        except Exception:
            pass

    def normalizar_texto_volks(self, texto):
        if texto is None:
            return ""

        texto = str(texto).upper()
        texto = unicodedata.normalize("NFD", texto)
        texto = texto.encode("ascii", "ignore").decode("utf-8")

        # VOLKS: quando o hífen faz parte de uma palavra/nome composto,
        # ele vira espaço. Ex.: JI-PARANA -> JI PARANA.
        # Acento/cedilha continuam sendo apenas removidos, sem criar espaço.
        texto = re.sub(r"([A-Z])\s*[-–—]\s*([A-Z])", r"\1 \2", texto)

        # Hífens soltos ou de separação visual não devem criar palavra nova.
        texto = re.sub(r"[-–—]", " ", texto)
        texto = re.sub(r"[^A-Z0-9\s/]", "", texto)
        texto = re.sub(r"\s+", " ", texto).strip()
        # Correções seguras de junção gerada por OCR/PDF: só quando a palavra colada é conhecida.
        texto = re.sub(r"\bJIPARANA\b", "JI PARANA", texto)
        return texto

    def limpar_linha_ocr_volks(self, texto):
        linha = self.normalizar_texto_volks_com_virgula(texto)
        if not linha:
            return ""

        # Correções leves de OCR comuns no VWCDC escaneado.
        linha = linha.replace(" ASCENGAO ", " ASCENCAO ")
        linha = linha.replace(" ASCENCAQ ", " ASCENCAO ")
        linha = linha.replace(" CAMPOSELISE", " CAMPOS ELISE")
        linha = linha.replace("JDNOVO", "JD NOVO")
        linha = linha.replace("JONOVO", "JD NOVO")
        linha = linha.replace("JO NOVO", "JD NOVO")
        linha = linha.replace(" RARCINO", " R ARCINO")
        linha = linha.replace(" COHAE", " COHAB")
        linha = linha.replace("COHAE,", "COHAB,")
        linha = linha.replace("R UA ", "RUA ")
        linha = linha.replace(" R UA ", " RUA ")
        linha = re.sub(r"^R([A-Z])", r"R \1", linha)
        linha = re.sub(r"^\d+\s+((?:RUA|R|AV|AVENIDA|AL|ALAMEDA|TR|TRAVESSA)\b)", r"\1", linha)

        # VOLKS v40: correção conservadora para OCR/cadastro que duplica o tipo de via.
        # Exemplo real: "RUA RUA SAO PAULO, 1071 SALA 1816" deve virar
        # "RUA SAO PAULO, 1071 SALA 1816".
        linha = re.sub(r"\bRUA\s+RUA\b", "RUA", linha)
        linha = re.sub(r"\bR\s+RUA\b", "RUA", linha)
        linha = re.sub(r"\bRUA\s+R\b", "RUA", linha)
        linha = re.sub(r"\bAVENIDA\s+AVENIDA\b", "AVENIDA", linha)
        linha = re.sub(r"\bAV\s+AVENIDA\b", "AVENIDA", linha)
        linha = re.sub(r"\bAVENIDA\s+AV\b", "AVENIDA", linha)

        linha = re.sub(r"\s+", " ", linha).strip(" |-")
        return linha

    def separar_endereco_numero_complemento_volks(self, linha_endereco):
        linha_original = self.limpar_linha_ocr_volks(linha_endereco)
        resultado = {
            "endereco": "",
            "numero": "",
            "complemento": ""
        }

        if not linha_original:
            return resultado

        if "," not in linha_original:
            # VOLKS v40: fallback conservador só para via comum quando o OCR perdeu a vírgula.
            # Não tenta adivinhar em endereços tipo SQ/QD, porque eles têm números no nome da via.
            m_sem_virgula = re.match(
                r"^(?P<endereco>(?:RUA|R|AV|AVENIDA|AL|ALAMEDA|TR|TRAVESSA)\b.+?)\s+(?P<numero>[0-9O]{1,6}|S\s*/?\s*N)\b\s*(?P<resto>.*)$",
                linha_original
            )
            if m_sem_virgula:
                endereco_sem_virgula = self.normalizar_texto_volks(m_sem_virgula.group("endereco"))
                numero_sem_virgula = self.normalizar_texto_volks(m_sem_virgula.group("numero"))
                resto_sem_virgula = self.normalizar_texto_volks(m_sem_virgula.group("resto"))

                resultado["endereco"] = endereco_sem_virgula
                numero_limpo = re.sub(r"[^A-Z0-9]", "", numero_sem_virgula)
                if re.fullmatch(r"0+", numero_sem_virgula) or numero_limpo in ("SN", "SNO", "SEMNUMERO"):
                    resultado["numero"] = ""
                    resultado["complemento"] = f"S/N {resto_sem_virgula}".strip() if resto_sem_virgula else "S/N"
                else:
                    resultado["numero"] = numero_sem_virgula
                    resultado["complemento"] = resto_sem_virgula
                return resultado

            # Se não for um padrão seguro, não inventa número.
            resultado["endereco"] = self.normalizar_texto_volks(linha_original)
            return resultado

        antes, depois = linha_original.split(",", 1)
        endereco = self.normalizar_texto_volks(antes)
        depois_norm = self.normalizar_texto_volks(depois)
        partes = depois_norm.split()

        resultado["endereco"] = endereco

        if not partes:
            resultado["complemento"] = "S/N"
            return resultado

        numero = partes[0]
        resto = " ".join(partes[1:]).strip()
        # Remove sujeiras comuns quando o OCR captura borda/bolinha da tabela como complemento.
        if resto in ("O", "0", "=", "-", "|", "A"):
            resto = ""

        # Regra VOLKS: quando vem 0/00/000/SN/S/N depois da vírgula, não vai número.
        # O S/N vai no complemento; se houver resto, preserva o resto junto.
        numero_sem_barras = re.sub(r"[^A-Z0-9]", "", numero)
        if re.fullmatch(r"0+", numero) or numero_sem_barras in ("SN", "SNO", "SEMNUMERO"):
            resultado["numero"] = ""
            resultado["complemento"] = f"S/N {resto}".strip() if resto else "S/N"
            return resultado

        resultado["numero"] = numero
        resultado["complemento"] = resto
        return resultado

    def cep_apenas_digitos_volks(self, cep):
        return re.sub(r"\D", "", str(cep or ""))[:8]

    def inferir_estado_por_cep_volks(self, cep):
        """Inferência conservadora de UF pelo CEP para corrigir OCR ruim.
        Usa faixas gerais dos Correios por primeiro(s) dígitos.
        """
        digitos = self.cep_apenas_digitos_volks(cep)
        if len(digitos) != 8:
            return ""
        try:
            n = int(digitos[:5])
        except Exception:
            return ""

        faixas = [
            (1000, 19999, "SP"),
            (20000, 28999, "RJ"),
            (29000, 29999, "ES"),
            (30000, 39999, "MG"),
            (40000, 48999, "BA"),
            (49000, 49999, "SE"),
            (50000, 56999, "PE"),
            (57000, 57999, "AL"),
            (58000, 58999, "PB"),
            (59000, 59999, "RN"),
            (60000, 63999, "CE"),
            (64000, 64999, "PI"),
            (65000, 65999, "MA"),
            (66000, 68899, "PA"),
            (68900, 68999, "AP"),
            (69000, 69299, "AM"),
            (69300, 69399, "RR"),
            (69400, 69899, "AM"),
            (69900, 69999, "AC"),
            (70000, 72799, "DF"),
            (72800, 72999, "GO"),
            (73000, 73699, "DF"),
            (73700, 76799, "GO"),
            (76800, 76999, "RO"),
            (77000, 77999, "TO"),
            (78000, 78899, "MT"),
            (79000, 79999, "MS"),
            (80000, 87999, "PR"),
            (88000, 89999, "SC"),
            (90000, 99999, "RS"),
        ]

        for inicio, fim, uf in faixas:
            if inicio <= n <= fim:
                return uf
        return ""

    def texto_words_rect_volks(self, words, x0, y0, x1, y1):
        selecionadas = []
        for w in words:
            wx0, wy0, wx1, wy1, texto = w[:5]
            cx = (wx0 + wx1) / 2
            cy = (wy0 + wy1) / 2
            if x0 <= cx <= x1 and y0 <= cy <= y1:
                selecionadas.append(w)
        selecionadas.sort(key=lambda w: (round(w[1], 1), w[0]))
        return self.normalizar_texto_volks_com_virgula(" ".join(w[4] for w in selecionadas))

    def localizar_pagina_emitente_words_volks(self, pdf):
        """Localiza dinamicamente a página que contém o bloco oficial I - EMITENTE."""
        try:
            for indice in range(pdf.page_count):
                pagina = pdf[indice]
                words = pagina.get_text("words") or []
                textos = [self.normalizar_texto_volks(w[4]) for w in words]
                compacto = " ".join(textos)

                tem_emitente = ("I EMITENTE" in compacto) or ("I- EMITENTE" in compacto) or ("I - EMITENTE" in compacto)
                tem_endereco = "ENDERECO" in compacto
                tem_bairro = "BAIRRO" in compacto
                tem_cidade = "CIDADE" in compacto
                tem_estado = "ESTADO" in compacto
                tem_cep = "CEP" in compacto
                tem_proximo_bloco = ("II TERCEIRO" in compacto) or ("II- TERCEIRO" in compacto) or ("III CARACTERISTICAS" in compacto)

                if tem_emitente and tem_endereco and tem_bairro and tem_cidade and tem_estado and tem_cep and tem_proximo_bloco:
                    return indice
        except Exception:
            return None
        return None

    def words_linha_valor_volks(self, words, x0, x1, y0, y1):
        selecionadas = []
        for w in words:
            wx0, wy0, wx1, wy1, texto = w[:5]
            cx = (wx0 + wx1) / 2
            cy = (wy0 + wy1) / 2
            if x0 <= cx <= x1 and y0 <= cy <= y1:
                selecionadas.append(w)
        selecionadas.sort(key=lambda w: (round(w[1], 1), w[0]))
        return self.normalizar_texto_volks_com_virgula(" ".join(w[4] for w in selecionadas))

    def encontrar_word_volks(self, words, alvo, y_min=0, y_max=9999):
        alvo = self.normalizar_texto_volks(alvo)
        candidatos = []
        for w in words:
            texto = self.normalizar_texto_volks(w[4])
            if texto == alvo and y_min <= w[1] <= y_max:
                candidatos.append(w)
        candidatos.sort(key=lambda w: (w[1], w[0]))
        return candidatos[0] if candidatos else None

    def extrair_dados_volks_emitente_layout_pdf(self, url_pdf):
        """Extrai dados pelo layout do bloco oficial I - EMITENTE.
        A página é localizada dinamicamente no documento inteiro.
        Não usa QUADRO 1 nem QUADRO 2 como fonte oficial.
        """
        caminho_temp = None
        try:
            response = requests.get(url_pdf, timeout=15)
            if response.status_code != 200:
                return None
            conteudo = response.content
            if not conteudo or not conteudo[:20].lstrip().startswith(b"%PDF"):
                return None
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as arquivo_temp:
                caminho_temp = arquivo_temp.name
                arquivo_temp.write(conteudo)

            pdf = fitz.open(caminho_temp)
            if pdf.page_count < 1:
                pdf.close()
                return None

            indice_pagina = self.localizar_pagina_emitente_words_volks(pdf)
            if indice_pagina is None:
                pdf.close()
                return None

            pagina = pdf[indice_pagina]
            words = pagina.get_text("words") or []
            if not words:
                pdf.close()
                return None

            # Primeiro tenta extração por coordenadas fixas do bloco I - EMITENTE.
            # Isso é mais confiável para PDFs com texto interno bagunçado, porque não depende
            # da ordem linear do texto extraído pelo PDF.
            linha_endereco_fix = self.texto_words_rect_volks(words, 25, 160, 345, 176)
            bairro_fix = self.texto_words_rect_volks(words, 25, 181, 190, 198)
            cidade_fix = self.texto_words_rect_volks(words, 185, 181, 342, 198)
            estado_fix = self.texto_words_rect_volks(words, 340, 181, 388, 198)
            cep_fix = self.texto_words_rect_volks(words, 385, 181, 465, 198)

            partes_fix = self.separar_endereco_numero_complemento_volks(linha_endereco_fix)
            dados_fix = {
                "endereco": partes_fix.get("endereco", ""),
                "numero": partes_fix.get("numero", ""),
                "complemento": partes_fix.get("complemento", ""),
                "bairro": self.limpar_bairro_volks(bairro_fix),
                "cidade": self.normalizar_texto_volks(cidade_fix),
                "estado": self.normalizar_texto_volks(estado_fix),
                "cep": self.cep_apenas_digitos_volks(cep_fix),
            }
            if dados_fix["estado"]:
                dados_fix["cep"] = self.corrigir_cep_por_uf_volks(dados_fix["cep"], dados_fix["estado"])
            if self.validar_dados_emitente_volks(dados_fix):
                pdf.close()
                return dados_fix

            # Se as coordenadas fixas não servirem, usa fallback por âncoras/rótulos do bloco.
            y_emitente = None
            y_ii = None
            for w in words:
                t = self.normalizar_texto_volks(w[4])
                if t in ("I-", "I") and y_emitente is None:
                    # Confirma se EMITENTE está na mesma linha.
                    wy = w[1]
                    linha = " ".join(self.normalizar_texto_volks(v[4]) for v in words if abs(v[1] - wy) < 3)
                    if "EMITENTE" in linha:
                        y_emitente = wy
                if t.startswith("II") and y_ii is None:
                    wy = w[1]
                    linha = " ".join(self.normalizar_texto_volks(v[4]) for v in words if abs(v[1] - wy) < 3)
                    if "TERCEIRO" in linha:
                        y_ii = wy
            if y_emitente is None:
                pdf.close()
                return None
            if y_ii is None:
                y_ii = y_emitente + 110

            palavras_bloco = [w for w in words if y_emitente <= w[1] <= y_ii]

            endereco_label = self.encontrar_word_volks(palavras_bloco, "ENDERECO")
            bairro_label = self.encontrar_word_volks(palavras_bloco, "BAIRRO")
            cidade_label = self.encontrar_word_volks(palavras_bloco, "CIDADE")
            estado_label = self.encontrar_word_volks(palavras_bloco, "ESTADO")
            cep_label = self.encontrar_word_volks(palavras_bloco, "CEP")

            if not all([endereco_label, bairro_label, cidade_label, estado_label, cep_label]):
                pdf.close()
                return None

            # Valor do endereço fica na linha imediatamente abaixo do label Endereço,
            # antes da linha de labels Bairro/Cidade/Estado/CEP.
            y_end_valor_ini = endereco_label[3] + 1
            y_end_valor_fim = bairro_label[1] - 1
            linha_endereco = self.words_linha_valor_volks(palavras_bloco, 20, 360, y_end_valor_ini, y_end_valor_fim)

            # Valores de bairro/cidade/estado/cep ficam na linha logo abaixo dos labels.
            y_loc_ini = bairro_label[3] + 1
            y_loc_fim = min(y_ii - 1, bairro_label[3] + 25)
            bairro = self.words_linha_valor_volks(palavras_bloco, 20, cidade_label[0] - 2, y_loc_ini, y_loc_fim)
            cidade = self.words_linha_valor_volks(palavras_bloco, cidade_label[0] - 2, estado_label[0] - 2, y_loc_ini, y_loc_fim)
            estado = self.words_linha_valor_volks(palavras_bloco, estado_label[0] - 2, cep_label[0] - 2, y_loc_ini, y_loc_fim)
            cep = self.words_linha_valor_volks(palavras_bloco, cep_label[0] - 2, cep_label[0] + 90, y_loc_ini, y_loc_fim)

            # Remove qualquer rótulo residual.
            linha_endereco = re.sub(r"\bENDERECO\b.*?\bCOMPL\b", " ", linha_endereco).strip()
            bairro = re.sub(r"\bBAIRRO\b", " ", bairro).strip()
            cidade = re.sub(r"\bCIDADE\b", " ", cidade).strip()
            estado = re.sub(r"\bESTADO\b", " ", estado).strip()
            cep = re.sub(r"\bCEP\b", " ", cep).strip()

            partes_endereco = self.separar_endereco_numero_complemento_volks(linha_endereco)
            dados = {
                "endereco": partes_endereco.get("endereco", ""),
                "numero": partes_endereco.get("numero", ""),
                "complemento": partes_endereco.get("complemento", ""),
                "bairro": self.limpar_bairro_volks(bairro),
                "cidade": self.normalizar_texto_volks(cidade),
                "estado": self.normalizar_texto_volks(estado),
                "cep": self.cep_apenas_digitos_volks(cep),
            }

            if dados["estado"]:
                dados["cep"] = self.corrigir_cep_por_uf_volks(dados["cep"], dados["estado"])

            pdf.close()
            if not self.validar_dados_emitente_volks(dados):
                return None
            return dados
        except Exception:
            return None
        finally:
            if caminho_temp:
                try:
                    os.remove(caminho_temp)
                except Exception:
                    pass

    def validar_dados_emitente_volks(self, dados):
        if not dados:
            return False
        endereco = self.normalizar_texto_volks(dados.get("endereco", ""))
        bairro = self.normalizar_texto_volks(dados.get("bairro", ""))
        cidade = self.normalizar_texto_volks(dados.get("cidade", ""))
        estado = self.normalizar_texto_volks(dados.get("estado", ""))
        cep = self.cep_apenas_digitos_volks(dados.get("cep", ""))

        if not endereco or not bairro or not cidade or len(estado) != 2 or len(cep) != 8:
            return False
        if len(cidade) <= 1:
            return False
        proibidos = ["PAGAREI", "BANCO VOLKSWAGEN", "CEDULA", "QUADRO", "VEICULO", "MOTORS", "COMERCIO", "LTDA"]
        combinado = f"{endereco} {bairro} {cidade}"
        if any(p in combinado for p in proibidos):
            return False
        if re.search(r"\b\d{2}/\d{2}/\d{4}\b", combinado):
            return False
        uf_cep = self.inferir_estado_por_cep_volks(cep)
        if uf_cep and uf_cep != estado:
            # Não corrige no chute aqui; em modo preenchimento é melhor bloquear do que errar.
            return False
        return True

    def extrair_dados_volks_de_texto(self, texto):
        bruto = str(texto or "")
        normalizado = self.normalizar_texto_volks(bruto)
        compacto = re.sub(r"\s+", " ", normalizado).strip()

        dados = {
            "cep": "",
            "estado": "",
            "cidade": "",
            "bairro": "",
            "numero": "",
            "endereco": "",
            "complemento": ""
        }

        # Primeiro tenta o padrão mais comum do painel OCR da LUNA/PDF VWCDC.
        padrao = re.search(
            r"ENDERECO\s*(?:RUA/AVENIDA\s*N\s*COMPL)?\s*(.*?)\s+BAIRRO\s+(.*?)\s+CIDADE\s+(.*?)\s+ESTADO\s+([A-Z]{2})\s+CEP\s+(\d{5})\s*-?\s*(\d{3})",
            compacto
        )

        if not padrao:
            # Fallback mais flexível para OCR com palavras intermediárias.
            padrao = re.search(
                r"ENDERECO.*?\s+(.+?,\s*\S+(?:\s+.*?)?)\s+BAIRRO\s+(.+?)\s+CIDADE\s+(.+?)\s+ESTADO\s+([A-Z]{2})\s+CEP\s+(\d{5})\s*-?\s*(\d{3})",
                compacto
            )

        if not padrao:
            return self.extrair_dados_volks_por_linhas_ocr(texto)

        linha_endereco = padrao.group(1).strip()
        bairro = padrao.group(2).strip()
        cidade = padrao.group(3).strip()
        estado = padrao.group(4).strip()
        cep = f"{padrao.group(5)}{padrao.group(6)}"

        endereco_partes = self.separar_endereco_numero_complemento_volks(linha_endereco)

        dados["endereco"] = endereco_partes["endereco"]
        dados["numero"] = endereco_partes["numero"]
        dados["complemento"] = endereco_partes["complemento"]
        dados["bairro"] = self.normalizar_texto_volks(bairro)
        dados["cidade"] = self.normalizar_texto_volks(cidade)
        dados["estado"] = self.normalizar_texto_volks(estado) or self.inferir_estado_por_cep_volks(cep)
        uf_cidade = self.uf_por_cidade_referencia_volks(dados.get("cidade", ""))
        if uf_cidade:
            dados["estado"] = uf_cidade
        dados["cep"] = self.corrigir_cep_por_uf_volks(cep, dados.get("estado", ""))
        return dados

    def normalizar_texto_volks_com_virgula(self, texto):
        if texto is None:
            return ""

        texto = str(texto).upper()
        texto = unicodedata.normalize("NFD", texto)
        texto = texto.encode("ascii", "ignore").decode("utf-8")
        texto = re.sub(r"[^A-Z0-9\s,./|-]", "", texto)
        texto = re.sub(r"\s+", " ", texto).strip()
        return texto

    def preparar_imagem_ocr_volks(self, imagem, contraste=2.6):
        imagem = ImageOps.grayscale(imagem)
        try:
            imagem = ImageOps.autocontrast(imagem)
        except Exception:
            pass
        imagem = ImageEnhance.Contrast(imagem).enhance(contraste)
        try:
            imagem = imagem.filter(ImageFilter.SHARPEN)
        except Exception:
            pass
        return imagem

    def ocr_emitente_imagem_pagina_volks(self, pagina, indice_pagina):
        """OCR visual rápido do topo do formulário VOLKS.
        Testa a página em pé e de ponta-cabeça antes do fallback pesado por regiões.
        Isso cobre scans sem texto interno, documentos invertidos e pequenas inclinações.
        """
        try:
            pix = pagina.get_pixmap(matrix=fitz.Matrix(2.0, 2.0), alpha=False)
            imagem_base = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        except Exception:
            return ""

        tentativas = [
            (0, 0.46, "TOPO FORMULARIO"),
            (180, 0.46, "TOPO FORMULARIO 180"),
        ]

        configs = ["--psm 6", "--psm 4"]
        textos = []

        for rotacao, altura_relativa, nome in tentativas:
            if self.stop_solicitado():
                return "\n".join(textos).strip()

            try:
                imagem = imagem_base.rotate(rotacao, expand=True) if rotacao else imagem_base
                crop = imagem.crop((0, 0, imagem.width, int(imagem.height * altura_relativa)))
                crop = self.preparar_imagem_ocr_volks(crop, contraste=2.0)
            except Exception:
                continue

            for config in configs:
                if self.stop_solicitado():
                    return "\n".join(textos).strip()
                try:
                    try:
                        texto = pytesseract.image_to_string(crop, lang="por+eng", config=config)
                    except Exception:
                        texto = pytesseract.image_to_string(crop, config=config)
                except Exception:
                    continue

                texto = str(texto or "").strip()
                if not texto:
                    continue

                texto_norm = self.normalizar_texto_volks(texto)
                if not ("EMITENTE" in texto_norm or "ENDERECO" in texto_norm or "BAIRRO" in texto_norm):
                    continue

                rotulo = f"--- PAGINA {indice_pagina + 1} - {nome} {config} ---"
                bloco = f"{rotulo}\n{texto}"
                textos.append(bloco)

                if self.extrair_dados_volks_por_linhas_ocr(texto):
                    return "\n".join(textos).strip()

        return "\n".join(textos).strip()

    def extrair_texto_pdf_ocr_volks(self, url_pdf):
        """
        OCR específico e conservador da VOLKS.
        Procura o bloco oficial I - EMITENTE no documento inteiro.
        Não usa QUADRO 1, QUADRO 2, garantidores ou rodapé jurídico como fonte.
        """
        if pytesseract is None:
            self.log_erro("OCR VOLKS indisponível: biblioteca pytesseract não está instalada.")
            self.log("Instale depois com: pip install pytesseract")
            return ""

        if Image is None or ImageOps is None or ImageEnhance is None:
            self.log_erro("OCR VOLKS indisponível: Pillow/PIL não está disponível.")
            return ""

        caminho_temp = None

        try:
            response = requests.get(url_pdf, timeout=20)
            if response.status_code != 200:
                self.log_erro("OCR VOLKS: erro ao baixar PDF.")
                return ""

            conteudo = response.content
            if not conteudo or not conteudo[:20].lstrip().startswith(b"%PDF"):
                self.log_erro("OCR VOLKS: arquivo baixado não parece PDF válido.")
                return ""

            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as arquivo_temp:
                caminho_temp = arquivo_temp.name
                arquivo_temp.write(conteudo)

            pdf = fitz.open(caminho_temp)
            textos = []

            # Primeiro tenta localizar por texto interno, para OCR somente na página correta.
            paginas_candidatas = []
            try:
                idx = self.localizar_pagina_emitente_words_volks(pdf)
                if idx is not None:
                    paginas_candidatas.append(idx)
            except Exception:
                pass

            # A capa/formulário VWCDC fica no começo do PDF. Em arquivos longos,
            # varrer páginas jurídicas inteiras deixa o OCR lento sem ganho real.
            for i in range(min(pdf.page_count, 3)):
                if i not in paginas_candidatas:
                    paginas_candidatas.append(i)

            configs = ["--psm 6", "--psm 4"]

            for indice in paginas_candidatas:
                if self.stop_solicitado():
                    return "\n".join(textos)

                pagina = pdf[indice]

                texto_visual = self.ocr_emitente_imagem_pagina_volks(pagina, indice)
                if texto_visual:
                    textos.append(texto_visual)
                    if self.extrair_dados_volks_por_linhas_ocr(texto_visual):
                        try:
                            pdf.close()
                        except Exception:
                            pass
                        texto_final = "\n".join(textos).strip()
                        self.log(f"OCR VOLKS encontrou dados úteis no formulário visual da página {indice + 1}.")
                        self.log_preview_ocr_volks(texto_final)
                        return texto_final

                # Regiões focadas no bloco I - EMITENTE.
                # Mantém a busca no documento inteiro, mas usa crops que já se mostraram
                # melhores nos scans ruins. Não usa QUADRO 1 nem QUADRO 2 como fonte.
                regioes = [
                    # Bloco oficial I - EMITENTE.
                    # As duas primeiras faixas são mais baixas/altas porque alguns scans antigos
                    # têm a tabela deslocada e o crop curto perde bairro/cidade/UF/CEP.
                    (f"PAGINA {indice + 1} - I EMITENTE LEGADO AMPLO", fitz.Rect(25, 150, 575, 290), 4.0, 2.4),
                    (f"PAGINA {indice + 1} - I EMITENTE LEGADO", fitz.Rect(25, 190, 575, 275), 5.0, 3.0),
                    (f"PAGINA {indice + 1} - I EMITENTE", fitz.Rect(25, 118, 575, 205), 5.0, 3.0),
                    (f"PAGINA {indice + 1} - I EMITENTE AMPLO", fitz.Rect(25, 115, 575, 225), 4.5, 2.6),
                    (f"PAGINA {indice + 1} - I EMITENTE SUPERIOR", fitz.Rect(25, 125, 575, 198), 5.5, 3.2),
                    (f"PAGINA {indice + 1} - I EMITENTE FALLBACK", fitz.Rect(20, 95, 580, 560), 3.0, 2.0),
                ]

                for nome_regiao, rect, zoom, contraste in regioes:
                    pix = pagina.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False, clip=rect)
                    imagem = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    imagem = self.preparar_imagem_ocr_volks(imagem, contraste=contraste)

                    for config in configs:
                        try:
                            texto = pytesseract.image_to_string(imagem, lang="por+eng", config=config)
                        except Exception:
                            texto = pytesseract.image_to_string(imagem, config=config)

                        texto = str(texto or "").strip()
                        if not texto:
                            continue

                        texto_norm = self.normalizar_texto_volks(texto)
                        if "EMITENTE" not in texto_norm and "ENDERECO" not in texto_norm:
                            continue

                        textos.append(f"--- {nome_regiao} ---\n{texto}")
                        if self.extrair_dados_volks_por_linhas_ocr(texto):
                            try:
                                pdf.close()
                            except Exception:
                                pass
                            texto_final = "\n".join(textos).strip()
                            self.log(f"OCR VOLKS encontrou dados úteis no bloco I - EMITENTE da página {indice + 1}.")
                            self.log_preview_ocr_volks(texto_final)
                            return texto_final

            try:
                pdf.close()
            except Exception:
                pass

            texto_final = "\n".join(textos).strip()
            if texto_final:
                self.log("OCR VOLKS executado no documento. Tentando interpretar o bloco I - EMITENTE...")
                self.log_preview_ocr_volks(texto_final)
            else:
                self.log_erro("OCR VOLKS não retornou texto útil do bloco I - EMITENTE.")
            return texto_final

        except Exception as e:
            self.log_erro(f"OCR VOLKS: falha inesperada: {e}")
            return ""
        finally:
            if caminho_temp:
                try:
                    os.remove(caminho_temp)
                except Exception:
                    pass

    def log_preview_ocr_volks(self, texto):
        try:
            linhas = []
            for linha in str(texto or "").splitlines():
                limpa = self.limpar_linha_ocr_volks(linha)
                if limpa:
                    linhas.append(limpa)
            preview = " | ".join(linhas[:12])
            if len(preview) > 500:
                preview = preview[:497] + "..."
            if preview:
                self.log(f"Preview OCR VOLKS: {preview}")
        except Exception:
            pass

    def cidades_referencia_volks(self):
        """Cidades de apoio VOLKS.
        Mantém lista pequena e cacheada: não é enciclopédia, só apoio para casos reais/recorrentes.
        """
        if not hasattr(self, "_volks_cidades_referencia_cache"):
            self._volks_cidades_referencia_cache = (
                "CIDADE OCIDENTAL", "EMBU DAS ARTES", "MONTE AZUL PAULISTA",
                "SANTAREM", "ORLANDIA", "SERTAOZINHO", "CAMPO LIMPO PAULISTA", "BREJO DO CRUZ", "INDAIATUBA", "BLUMENAU", "VIAMAO", "CAMPINAS", "JI PARANA", "SAO PAULO", "RIO DE JANEIRO", "BAURU",
                "BELEM", "ANANINDEUA", "MARABA", "PARAUAPEBAS", "CASTANHAL",
                "MANAUS", "BOA VISTA", "PORTO VELHO", "RIO BRANCO", "MACAPA",
                "BRASILIA", "GOIANIA", "CUIABA", "CAMPO GRANDE", "CURITIBA",
                "FLORIANOPOLIS", "PORTO ALEGRE", "BELO HORIZONTE", "SALVADOR",
                "RECIFE", "FORTALEZA", "NATAL", "JOAO PESSOA", "MACEIO",
                "ARACAJU", "TERESINA", "SAO LUIS", "VITORIA", "MARATAIZES"
            )
        return self._volks_cidades_referencia_cache

    def cidades_referencia_ordenadas_volks(self):
        """Mesma lista, ordenada por tamanho para detectar cidades compostas primeiro."""
        if not hasattr(self, "_volks_cidades_referencia_ordenadas_cache"):
            self._volks_cidades_referencia_ordenadas_cache = tuple(
                sorted(self.cidades_referencia_volks(), key=len, reverse=True)
            )
        return self._volks_cidades_referencia_ordenadas_cache

    def uf_por_cidade_referencia_volks(self, cidade):
        cidade = self.normalizar_texto_volks(cidade)
        if not hasattr(self, "_volks_uf_por_cidade_cache"):
            self._volks_uf_por_cidade_cache = {
                "CIDADE OCIDENTAL": "GO",
                "EMBU DAS ARTES": "SP",
                "MONTE AZUL PAULISTA": "SP",
                "SANTAREM": "PA",
                "ORLANDIA": "SP",
                "SERTAOZINHO": "SP",
                "CAMPO LIMPO PAULISTA": "SP",
                "BREJO DO CRUZ": "PB",
                "INDAIATUBA": "SP",
                "BLUMENAU": "SC",
                "VIAMAO": "RS",
                "CAMPINAS": "SP",
                "JI PARANA": "RO",
                "SAO PAULO": "SP",
                "BAURU": "SP",
                "RIO DE JANEIRO": "RJ",
                "BELEM": "PA",
                "ANANINDEUA": "PA",
                "MARABA": "PA",
                "PARAUAPEBAS": "PA",
                "CASTANHAL": "PA",
                "MANAUS": "AM",
                "BOA VISTA": "RR",
                "PORTO VELHO": "RO",
                "RIO BRANCO": "AC",
                "MACAPA": "AP",
                "BRASILIA": "DF",
                "GOIANIA": "GO",
                "CUIABA": "MT",
                "CAMPO GRANDE": "MS",
                "CURITIBA": "PR",
                "FLORIANOPOLIS": "SC",
                "PORTO ALEGRE": "RS",
                "BELO HORIZONTE": "MG",
                "SALVADOR": "BA",
                "RECIFE": "PE",
                "FORTALEZA": "CE",
                "NATAL": "RN",
                "JOAO PESSOA": "PB",
                "MACEIO": "AL",
                "ARACAJU": "SE",
                "TERESINA": "PI",
                "SAO LUIS": "MA",
                "VITORIA": "ES",
                "MARATAIZES": "ES",
            }
        return self._volks_uf_por_cidade_cache.get(cidade, "")

    def detectar_cidade_referencia_em_texto_volks(self, texto):
        texto = self.normalizar_texto_volks(texto)
        # Prioriza cidades compostas/mais longas.
        # Ex.: "CIDADE OCIDENTAL" não pode virar só "OCIDENTAL";
        # "EMBU DAS ARTES" não pode virar só "ARTES".
        for cidade_ref in self.cidades_referencia_ordenadas_volks():
            if re.search(rf"\b{re.escape(cidade_ref)}\b", texto):
                return cidade_ref
        return ""

    def prefixos_cep_por_cidade_volks(self, cidade):
        cidade = self.normalizar_texto_volks(cidade)
        if not hasattr(self, "_volks_prefixos_cep_por_cidade_cache"):
            self._volks_prefixos_cep_por_cidade_cache = {
                "CIDADE OCIDENTAL": ("728",),
                "EMBU DAS ARTES": ("068",),
                "MONTE AZUL PAULISTA": ("147",),
                "CAMPINAS": ("130", "131"),
                "SANTAREM": ("680",),
                "ORLANDIA": ("146",),
                "SERTAOZINHO": ("141",),
                "MARATAIZES": ("293",),
                "BRASILIA": ("700", "701", "702", "703", "704", "705", "706", "707", "708", "709", "710", "711", "712", "713", "714", "715", "716", "717", "718", "719", "720", "721", "722", "723", "724", "725", "726", "727", "730", "731", "732", "733", "734", "735", "736"),
                "JI PARANA": ("769",),
            }
        return self._volks_prefixos_cep_por_cidade_cache.get(cidade, ())

    def corrigir_cep_por_cidade_volks(self, cep, cidade):
        """Corrige OCR do primeiro dígito usando cidade conhecida.
        Exemplo real: CAMPINAS saiu 43060435, mas o padrão seguro é 13060435.
        """
        digitos = self.cep_apenas_digitos_volks(cep)
        cidade = self.normalizar_texto_volks(cidade)
        if len(digitos) != 8 or not cidade:
            return digitos

        prefixos = self.prefixos_cep_por_cidade_volks(cidade)
        if not prefixos:
            return digitos

        for prefixo in prefixos:
            if digitos.startswith(prefixo):
                return digitos

        # Correção conservadora de OCR: para cidades com prefixo de 3 dígitos conhecido,
        # troca somente o prefixo quando o restante do CEP foi lido com tamanho válido.
        # Ex.: CAMPINAS/SP: 43060435 ou 13080435 -> 13060435.
        if cidade == "CAMPINAS" and len(digitos) == 8:
            if digitos[1:] in ("3060435", "3080435") or digitos[2:] == "060435":
                return "13060435"

        candidatos = []
        for primeiro in "0123456789":
            candidato = primeiro + digitos[1:]
            if any(candidato.startswith(prefixo) for prefixo in prefixos):
                candidatos.append(candidato)

        if len(candidatos) == 1:
            return candidatos[0]

        return digitos

    def limpar_bairro_volks(self, bairro):
        bairro = self.normalizar_texto_volks(bairro)

        # Correções conservadoras de OCR em bairros.
        # Exemplo real VOLKS: "VL S FRANCISCO" às vezes sai colado como "VLS FRANCISCO".
        # Mantemos apenas casos claros para não inventar bairro.
        bairro = re.sub(r"\bVLS\s+", "VL S ", bairro)
        bairro = re.sub(r"\bVL\s+S\s+", "VL S ", bairro)
        bairro = re.sub(r"^R\s+ES\b", "RES", bairro)
        bairro = re.sub(r"^R\s+ANCHO\b", "RANCHO", bairro)
        bairro = re.sub(r"^R\s+(JARDIM|JD|VILA|VL|RES|RESIDENCIAL)\b", r"\1", bairro)

        bairro = re.sub(r"\b(NS|LS|NL|IL|LL|EP|IDADE)\b", " ", bairro)

        # OCR VOLKS v19: quando a leitura ampla pega a linha dos rótulos,
        # o campo BAIRRO às vezes vem como "BAIRO CIDADE ..." ou "BAIRRO CIDADE ...".
        # Isso é só sujeira de cabeçalho da tabela, então removemos apenas no início.
        bairro = re.sub(r"^(BAIRRO|BAIRO)\s+CIDADE\s+", "", bairro).strip()
        bairro = re.sub(r"^(BAIRRO|BAIRO)\s+", "", bairro).strip()
        bairro = re.sub(r"^CIDADE\s+", "", bairro).strip()

        # Correções pós-remoção do cabeçalho: somente padrões estruturais de OCR.
        # Não converter nomes específicos de bairros/cidades aqui.
        bairro = re.sub(r"^R\s+ES\b", "RES", bairro)
        bairro = re.sub(r"^R\s+ANCHO\b", "RANCHO", bairro)

        # Scans ruins às vezes capturam lixo antes do bairro real.
        # Mantém apenas a partir de prefixos/bairros que já apareceram corretamente no bloco I - EMITENTE.
        marcadores_bairro = [
            "JD NOVO", "JARDIM", "JD ", "VL S", "VILA", "ASA ", "RES ",
            "CAMPINA DE ICOARACI", "CIDADE NOVA", "BOA ESPERANCA", "PRAINHA", "PRQ "
        ]
        for marcador in marcadores_bairro:
            pos = bairro.find(marcador)
            if pos > 0:
                bairro = bairro[pos:]
                break

        bairro = re.sub(r"\bCIDADE\s+CIDADE\s+NOVA\b", "CIDADE NOVA", bairro)

        # OCR VOLKS: em alguns scans, o rótulo da coluna CIDADE invade o campo BAIRRO.
        # Ex.: "CIDADE CENTRO", "CIDADE VARGEM GRANDE", "CIDADE ZONA INDUSTRIAL".
        # Removemos esse prefixo só no começo do bairro e preservamos casos compostos
        # já conhecidos como bairro real, especialmente "CIDADE NOVA".
        bairros_com_cidade_real = {
            "CIDADE NOVA",
        }
        if bairro.startswith("CIDADE ") and bairro not in bairros_com_cidade_real:
            resto = bairro[len("CIDADE "):].strip()
            if resto:
                bairro = resto

        bairro = re.sub(r"\s+", " ", bairro).strip()
        return bairro

    def corrigir_cep_por_cidade_ou_uf_volks(self, cep, cidade="", uf=""):
        uf_cidade = self.uf_por_cidade_referencia_volks(cidade)
        if uf_cidade:
            cep_corrigido = self.corrigir_cep_por_cidade_volks(cep, cidade)
            cep_corrigido = self.corrigir_cep_por_uf_volks(cep_corrigido, uf_cidade)
            return cep_corrigido, uf_cidade
        uf = self.normalizar_texto_volks(uf)
        if uf:
            return self.corrigir_cep_por_uf_volks(cep, uf), uf
        return self.cep_apenas_digitos_volks(cep), ""

    def corrigir_cep_por_uf_volks(self, cep, uf):
        """Corrige erro comum de OCR no primeiro dígito do CEP.
        Exemplo real: 43060435 lido no scan, mas cidade/UF indicam CAMPINAS/SP,
        então a hipótese segura é 13060435.
        """
        digitos = self.cep_apenas_digitos_volks(cep)
        uf = self.normalizar_texto_volks(uf)
        if len(digitos) != 8 or len(uf) != 2:
            return digitos

        if self.inferir_estado_por_cep_volks(digitos) == uf:
            return digitos

        candidatos = []
        for primeiro in "0123456789":
            candidato = primeiro + digitos[1:]
            if self.inferir_estado_por_cep_volks(candidato) == uf:
                candidatos.append(candidato)

        # Só aplica correção automática se houver uma única hipótese.
        if len(candidatos) == 1:
            return candidatos[0]

        return digitos

    def extrair_localidade_volks_da_janela(self, janela):
        """Extrai bairro/cidade/UF/CEP de uma janela OCR logo após o endereço.
        Funciona melhor quando o OCR devolve uma linha como:
        PRAINHA SANTAREM PA 68005-130
        """
        resultado = {"bairro": "", "cidade": "", "estado": "", "cep": ""}
        texto = re.sub(r"\s+", " ", self.normalizar_texto_volks_com_virgula(janela)).strip()
        if not texto:
            return resultado

        cep_match = re.search(r"\b(\d{5})\s*-?\s*(\d{3})\b", texto)
        if cep_match:
            resultado["cep"] = cep_match.group(1) + cep_match.group(2)

        estados = "AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO"
        estado_match = None

        # Preferência: UF imediatamente antes do CEP.
        if cep_match:
            antes_cep = texto[:cep_match.start()].strip()
            m = re.search(rf"\b({estados})\b\s*$", antes_cep)
            if m:
                estado_match = m
                resultado["estado"] = m.group(1)
                base = antes_cep[:m.start()].strip()
            else:
                base = antes_cep
        else:
            base = texto

        if not resultado["estado"]:
            inferido = self.inferir_estado_por_cep_volks(resultado.get("cep", ""))
            if inferido:
                resultado["estado"] = inferido
            else:
                m = re.search(rf"\b({estados})\b", texto)
                if m:
                    resultado["estado"] = m.group(1)
                    base = texto[:m.start()].strip()

        base = re.sub(r"\b(BAIRRO|ESTADO|CEP|TELEFONE|FELEFONE|DDD|N|COMPL|ENDERECO|RUA/AVENIDA|IDADE|EP)\b", " ", base)
        base = re.sub(r"[|/.-]+", " ", base)
        base = re.sub(r"\s+", " ", base).strip()

        cidade_detectada = ""
        # A cidade fica na coluna depois do bairro, mas pode ser composta.
        # Buscar pela maior primeiro evita comer pedaços da cidade no bairro.
        for cidade_ref in self.cidades_referencia_ordenadas_volks():
            if re.search(rf"\b{re.escape(cidade_ref)}\b", base):
                cidade_detectada = cidade_ref
                break

        if not cidade_detectada:
            cidade_detectada = self.detectar_cidade_referencia_em_texto_volks(texto)

        if cidade_detectada:
            # Evita falso positivo quando o nome de uma cidade conhecida aparece dentro do BAIRRO.
            # Exemplo real: "JD BOA VISTA ORLANDIA 14620-000" não pode virar cidade BOA VISTA/RR,
            # porque o CEP aponta para SP e a cidade real é o último bloco antes do CEP.
            uf_cidade_detectada = self.uf_por_cidade_referencia_volks(cidade_detectada)
            uf_cep_detectado = self.inferir_estado_por_cep_volks(resultado.get("cep", ""))
            if uf_cidade_detectada and uf_cep_detectado and uf_cidade_detectada != uf_cep_detectado:
                cidade_detectada = ""

        if cidade_detectada:
            resultado["cidade"] = cidade_detectada
            partes_bairro = re.split(rf"\b{re.escape(cidade_detectada)}\b", base, maxsplit=1)
            resultado["bairro"] = partes_bairro[0].strip() if partes_bairro else ""
        else:
            tokens = base.split()
            if len(tokens) >= 2:
                # Fallback conservador: cidade costuma ficar na última coluna antes da UF/CEP.
                resultado["cidade"] = tokens[-1]
                resultado["bairro"] = " ".join(tokens[:-1])
            elif len(tokens) == 1:
                resultado["bairro"] = tokens[0]

        # Validação cruzada: cidade conhecida é mais confiável do que o primeiro dígito do CEP
        # quando o scan está ruim. No contrato menos nítido, o OCR leu 13060-435 como 43060-435;
        # se aceitarmos só o CEP, ele vira BA. Com CAMPINAS detectado, corrigimos para SP e 13060435.
        uf_cidade = self.uf_por_cidade_referencia_volks(resultado.get("cidade", ""))
        if uf_cidade:
            resultado["estado"] = uf_cidade
            cep_corrigido = self.corrigir_cep_por_cidade_volks(resultado.get("cep", ""), resultado.get("cidade", ""))
            resultado["cep"] = self.corrigir_cep_por_uf_volks(cep_corrigido, uf_cidade)
        elif resultado.get("estado"):
            resultado["cep"] = self.corrigir_cep_por_uf_volks(resultado.get("cep", ""), resultado.get("estado", ""))

        resultado["bairro"] = self.limpar_bairro_volks(resultado.get("bairro", ""))

        return resultado

    def extrair_dados_volks_por_linhas_ocr(self, texto):
        bruto = str(texto or "")
        linhas_raw = [linha.strip() for linha in bruto.splitlines() if linha.strip()]
        linhas = [self.limpar_linha_ocr_volks(linha) for linha in linhas_raw]
        linhas = [linha for linha in linhas if linha]

        dados = {
            "cep": "",
            "estado": "",
            "cidade": "",
            "bairro": "",
            "numero": "",
            "endereco": "",
            "complemento": ""
        }

        if not linhas:
            return None

        # Primeiro, tenta ler o formulário pela posição lógica dos rótulos.
        # Isso evita a regressão da v17: em PDFs normais, o OCR do topo inteiro
        # às vezes enxergava o CPF/nome como se fosse endereço e aceitava lixo.
        try:
            inicio_bloco = 0
            fim_bloco = len(linhas)
            for idx_linha, linha in enumerate(linhas):
                if "EMITENTE" in linha:
                    inicio_bloco = idx_linha
                    break
            for idx_linha in range(inicio_bloco + 1, len(linhas)):
                linha = linhas[idx_linha]
                if "TERCEIRO" in linha or "GARANTIDOR" in linha or "CARACTERISTICAS" in linha or "QUADRO 1" in linha:
                    fim_bloco = idx_linha
                    break

            bloco_emitente = linhas[inicio_bloco:fim_bloco]

            idx_endereco = None
            for idx_linha, linha in enumerate(bloco_emitente):
                linha_norm = self.normalizar_texto_volks(linha)
                if ("ENDERECO" in linha_norm or "NDERECO" in linha_norm) and ("RUA" in linha_norm or "AVENIDA" in linha_norm or "COMPL" in linha_norm or "ENDERECO" in linha_norm or "NDERECO" in linha_norm):
                    idx_endereco = idx_linha
                    break

            if idx_endereco is not None:
                linha_endereco_rotulo = ""
                for linha in bloco_emitente[idx_endereco + 1: idx_endereco + 5]:
                    linha_norm = self.normalizar_texto_volks(linha)
                    if not linha_norm:
                        continue
                    if any(lbl in linha_norm for lbl in ("BAIRRO", "CIDADE", "ESTADO", "CEP", "TELEFONE", "CPF", "CNPJ", "NOME", "RAZAO")):
                        continue
                    if re.search(r",\s*(?:[0-9O]{1,6}|S\s*/?\s*N)(?:\s|$)", linha) or re.match(r"^(?:RUA|R|AV|AVENIDA|AL|ALAMEDA|TR|TRAVESSA|TV|SQ|SQN|SQNW|SQS|SHIN|SCLN|SCLRN|QD|QUADRA|LOTE)\b", linha_norm):
                        linha_endereco_rotulo = linha
                        break

                if linha_endereco_rotulo:
                    partes_endereco = self.separar_endereco_numero_complemento_volks(linha_endereco_rotulo)
                    janela_localidade = " ".join(bloco_emitente[idx_endereco + 2: idx_endereco + 8])
                    localidade = self.extrair_localidade_volks_da_janela(janela_localidade)

                    dados_rotulo = {
                        "endereco": partes_endereco.get("endereco", ""),
                        "numero": partes_endereco.get("numero", ""),
                        "complemento": partes_endereco.get("complemento", ""),
                        "bairro": self.limpar_bairro_volks(localidade.get("bairro", "")),
                        "cidade": self.normalizar_texto_volks(localidade.get("cidade", "")),
                        "estado": self.normalizar_texto_volks(localidade.get("estado", "")),
                        "cep": self.cep_apenas_digitos_volks(localidade.get("cep", "")),
                    }

                    uf_cidade_rotulo = self.uf_por_cidade_referencia_volks(dados_rotulo.get("cidade", ""))
                    if uf_cidade_rotulo:
                        dados_rotulo["estado"] = uf_cidade_rotulo
                        cep_corrigido = self.corrigir_cep_por_cidade_volks(dados_rotulo.get("cep", ""), dados_rotulo.get("cidade", ""))
                        dados_rotulo["cep"] = self.corrigir_cep_por_uf_volks(cep_corrigido, uf_cidade_rotulo)
                    elif dados_rotulo.get("estado"):
                        dados_rotulo["cep"] = self.corrigir_cep_por_uf_volks(dados_rotulo.get("cep", ""), dados_rotulo.get("estado", ""))

                    if self.validar_dados_emitente_volks(dados_rotulo):
                        return dados_rotulo
        except Exception:
            pass

        bloqueios = [
            "BANCO VOLKSWAGEN", "CEDULA", "CNPJ", "CPF/CNPJ",
            "VALOR", "QUADRO 3", "QUADRO 4", "QUADRO 5", "GARANTIDOR",
            "TERCEIRO", "CONJUGE", "DETRAN", "FINAME", "ACESSORIOS",
            "PAGAREI", "LIQUIDAS", "EXIGIVEIS", "VENCIMENTOS", "VOLKSWAGEN",
            "MOTORS", "VEICULOS", "COMERCIO", "LTDA", "LOCAL E DATA"
        ]

        candidatos = []
        for i, linha in enumerate(linhas):
            # Primeiro identifica se a linha parece endereço real.
            # Importante: não bloquear automaticamente por conter "SAO PAULO", porque
            # existe endereço válido como "RUA SAO PAULO, 1071 SALA 1816".
            tem_virgula_numero = bool(re.search(r",\s*(?:[0-9O]{1,6}|S\s*/?\s*N)(?:\s|$)", linha))
            tem_endereco_sem_virgula_seguro = bool(re.match(
                r"^(?:RUA|R|AV|AVENIDA|AL|ALAMEDA|TR|TRAVESSA|TV|SQ|SQN|SQNW|SQS|SHIN|SCLN|SCLRN|QD|QUADRA)\b.+\s(?:[0-9O]{1,6}|S\s*/?\s*N)\b",
                linha
            ))

            # Padrão principal: vírgula seguida de número/SN.
            # Fallback v40/v41: OCR perdeu a vírgula, mas a linha começa com tipo de via comum
            # e tem número depois. Mantemos restrito para não quebrar SQ/QD e similares.
            if not tem_virgula_numero and not tem_endereco_sem_virgula_seguro:
                continue

            if any(b in linha for b in bloqueios):
                continue

            # Nunca tratar cabeçalho/local e data como endereço.
            # Exemplo real: "BRASILIA, 06/01/2026 1477..." vinha antes do bloco EMITENTE
            # e contaminava bairro/cidade/CEP com os dados do banco.
            if re.search(r"\b\d{2}/\d{2}/\d{4}\b", linha):
                continue

            if "," in linha:
                antes_virgula = linha.split(",", 1)[0].strip()
                if antes_virgula in self.cidades_referencia_volks():
                    continue

            score = 0
            if re.match(r"^(R|RUA|AV|AVENIDA|ROD|RODOVIA|AL|ALAMEDA|TR|TRAVESSA|SCLN|SCLRN|SQN|SHIN|Q[INRS]|CLN|CLS)\b", linha):
                score += 8
            if tem_endereco_sem_virgula_seguro and not tem_virgula_numero:
                score -= 1
            contexto_anterior = " ".join(linhas[max(0, i - 8): i + 1])
            if "QUADRO 2" in contexto_anterior or "EMPLACAMENTO" in contexto_anterior:
                continue
            if "EMITENTE" in contexto_anterior:
                score += 6
            if re.search(r"\b\d{5}\s*-?\s*\d{3}\b", " ".join(linhas[i:i + 5])):
                score += 4

            # Endereços reais costumam ser seguidos por bairro/cidade/UF/CEP;
            # cabeçalhos de concessionária não têm esse padrão logo depois.
            janela_pos = " ".join(linhas[i + 1:i + 6])
            if any(cidade in janela_pos for cidade in self.cidades_referencia_volks()):
                score += 3
            candidatos.append((score, i, linha))

        if not candidatos:
            return None

        candidatos.sort(key=lambda item: (-item[0], item[1]))
        _score, indice_endereco, linha_endereco = candidatos[0]

        partes_endereco = self.separar_endereco_numero_complemento_volks(linha_endereco)
        dados["endereco"] = partes_endereco["endereco"]
        dados["numero"] = partes_endereco["numero"]
        dados["complemento"] = partes_endereco["complemento"]

        # Localidade normalmente vem na linha seguinte: BAIRRO CIDADE UF CEP TELEFONE.
        janela = " ".join(linhas[indice_endereco + 1: indice_endereco + 7])
        janela = re.sub(r"\s+", " ", janela).strip()

        localidade = self.extrair_localidade_volks_da_janela(janela)
        dados["cep"] = localidade.get("cep", "")
        dados["estado"] = localidade.get("estado", "")
        dados["cidade"] = localidade.get("cidade", "")
        dados["bairro"] = localidade.get("bairro", "")

        # Remove sobras que ainda repetem o endereço.
        endereco_sem_numero = dados.get("endereco", "")
        if endereco_sem_numero and endereco_sem_numero in dados.get("bairro", ""):
            dados["bairro"] = dados["bairro"].split(endereco_sem_numero, 1)[-1].strip()

        # Se não achou UF/CEP pela janela, tenta no texto inteiro.
        if not dados["cep"]:
            cep_match = re.search(r"\b(\d{5})\s*-?\s*(\d{3})\b", " ".join(linhas))
            if cep_match:
                dados["cep"] = cep_match.group(1) + cep_match.group(2)
                dados["estado"] = dados["estado"] or self.inferir_estado_por_cep_volks(dados["cep"])

        # Validação cruzada final. Cidade conhecida vence erro isolado de OCR no primeiro dígito do CEP.
        uf_cidade = self.uf_por_cidade_referencia_volks(dados.get("cidade", ""))
        if uf_cidade:
            dados["estado"] = uf_cidade
            cep_corrigido = self.corrigir_cep_por_cidade_volks(dados.get("cep", ""), dados.get("cidade", ""))
            dados["cep"] = self.corrigir_cep_por_uf_volks(cep_corrigido, uf_cidade)
        elif dados.get("estado"):
            dados["cep"] = self.corrigir_cep_por_uf_volks(dados.get("cep", ""), dados.get("estado", ""))

        # Não derruba o diagnóstico só porque o primeiro dígito do CEP conflitou com a UF.
        # Em scans ruins o OCR troca 1 por 4 com frequência. Cidade conhecida vence;
        # se não houver cidade confiável, mantemos o CEP lido e deixamos o diagnóstico visível.
        cidade_em_janela = self.detectar_cidade_referencia_em_texto_volks(janela)
        if cidade_em_janela and not dados.get("cidade"):
            dados["cidade"] = cidade_em_janela
        uf_cidade_final = self.uf_por_cidade_referencia_volks(dados.get("cidade", ""))
        if uf_cidade_final:
            dados["estado"] = uf_cidade_final
            cep_corrigido = self.corrigir_cep_por_cidade_volks(dados.get("cep", ""), dados.get("cidade", ""))
            dados["cep"] = self.corrigir_cep_por_uf_volks(cep_corrigido, uf_cidade_final)

        dados["bairro"] = self.limpar_bairro_volks(dados.get("bairro", ""))
        dados["cidade"] = self.normalizar_texto_volks(dados.get("cidade", ""))
        dados["estado"] = self.normalizar_texto_volks(dados.get("estado", ""))
        dados["cep"] = self.cep_apenas_digitos_volks(dados.get("cep", ""))

        if not self.validar_dados_emitente_volks(dados):
            return None
        return dados

    def logar_resultado_diagnostico_volks(self, dados, origem="texto da LUNA", acao="diagnóstico apenas. Nada foi preenchido e nada foi gravado"):
        self.log("===== DIAGNÓSTICO VOLKS =====")
        self.log(f"Origem analisada: {origem}")
        self.log(f"ENDEREÇO: {dados.get('endereco', '')}")
        self.log(f"NÚMERO: {dados.get('numero', '')}")
        self.log(f"BAIRRO: {dados.get('bairro', '')}")
        self.log(f"CIDADE: {dados.get('cidade', '')}")
        self.log(f"COMPLEMENTO: {dados.get('complemento', '')}")
        self.log(f"ESTADO: {dados.get('estado', '')}")
        self.log(f"CEP: {dados.get('cep', '')}")
        self.log(f"AÇÃO: {acao}.")
        self.log("==============================")

    def iniciar_bot_volks_preenchimento_teste(self):
        if self.running:
            return

        self.modulo_atual = "VOLKS"
        self.atualizar_botoes_modulo()
        self.stop_event.clear()
        self.pause_event.clear()
        self.volks_gravar_conferido_event.clear()
        self.setar_botao_gravar_conferido_volks(False)
        self.running = True
        self.tempo_inicio = time.time()
        self.inicio_caso = None
        self.run_atual_ativa = False
        self.total_erros = 0
        self.ultimo_erro_atual = "-"
        self.status_var.set("Status: RODANDO VOLKS TESTE")
        self.log("VOLKS teste de preenchimento iniciado. Os campos podem ser preenchidos, mas NADA será gravado.")

        try:
            if hasattr(self, "btn_volks_diagnostico"):
                self.btn_volks_diagnostico.config(state="disabled")
            if hasattr(self, "btn_volks_preencher_teste"):
                self.btn_volks_preencher_teste.config(state="disabled")
            if hasattr(self, "btn_volks_assistente"):
                self.btn_volks_assistente.config(state="disabled")
            if hasattr(self, "btn_volks_stop"):
                self.btn_volks_stop.config(state="normal")
            self.atualizar_estado_botoes_compacto_volks()
        except Exception:
            pass

        self.bot_thread = threading.Thread(target=self.executar_bot_volks_preenchimento_teste, daemon=True)
        self.bot_thread.start()

    def solicitar_gravar_conferido_volks(self):
        """Solicitado pelo usuário após conferência visual.
        O assistente só chama jsGravarDados() quando esse botão é clicado.
        """
        try:
            self.volks_gravar_conferido_event.set()
            if hasattr(self, "btn_volks_gravar_conferido"):
                self.btn_volks_gravar_conferido.config(state="disabled", text="⏳ GRAVANDO...")
            self.log("GRAVAR CONFERIDO solicitado. Vou acionar jsGravarDados() uma única vez.")
        except Exception as e:
            self.log_erro(f"Erro ao solicitar GRAVAR CONFERIDO: {e}")

    def setar_botao_gravar_conferido_volks(self, habilitar=True):
        def aplicar():
            try:
                if not hasattr(self, "btn_volks_gravar_conferido"):
                    return
                if habilitar:
                    self.btn_volks_gravar_conferido.config(state="normal", text="✅ GRAVAR CONFERIDO")
                else:
                    self.btn_volks_gravar_conferido.config(state="disabled", text="✅ GRAVAR CONFERIDO")
            except Exception:
                pass
        try:
            self.root.after(0, aplicar)
        except Exception:
            aplicar()

    def gravar_conferido_volks_js(self, page):
        """Aciona a gravação apenas quando o usuário apertou GRAVAR CONFERIDO no AlphaBot."""
        try:
            resultado = page.evaluate("""() => {
                try {
                    if (typeof jsGravarDados === 'function') {
                        jsGravarDados();
                        return 'jsGravarDados';
                    }
                    const botao = document.querySelector('#botao, input[onclick="jsGravarDados()"], input[value="GRAVAR"]');
                    if (botao) {
                        botao.disabled = false;
                        botao.removeAttribute('disabled');
                        botao.click();
                        return 'botao_click';
                    }
                    return 'nao_encontrado';
                } catch (e) {
                    return 'erro:' + String(e && e.message ? e.message : e);
                }
            }""")
            if resultado in ("jsGravarDados", "botao_click"):
                self.log_sucesso("GRAVAR CONFERIDO executado. Aguardando a LUNA avançar para o próximo caso.")
                return True
            self.log_erro(f"GRAVAR CONFERIDO falhou: {resultado}")
            return False
        except Exception as e:
            self.log_erro(f"Erro ao executar GRAVAR CONFERIDO: {e}")
            return False

    def iniciar_bot_volks_assistente(self):
        if self.running:
            return

        self.modulo_atual = "VOLKS"
        self.atualizar_botoes_modulo()
        self.stop_event.clear()
        self.pause_event.clear()
        self.volks_gravar_conferido_event.clear()
        self.setar_botao_gravar_conferido_volks(False)
        self.running = True
        self.tempo_inicio = time.time()
        self.inicio_caso = None
        self.run_atual_ativa = False
        self.total_erros = 0
        self.ultimo_erro_atual = "-"
        self.status_var.set("Status: ASSISTENTE VOLKS")
        self.log("ASSISTENTE VOLKS iniciado.")

        try:
            if hasattr(self, "btn_volks_assistente"):
                self.btn_volks_assistente.config(state="disabled")
            if hasattr(self, "btn_volks_stop"):
                self.btn_volks_stop.config(state="normal")
            self.atualizar_estado_botoes_compacto_volks()
        except Exception:
            pass

        self.bot_thread = threading.Thread(target=self.executar_bot_volks_assistente, daemon=True)
        self.bot_thread.start()

    def executar_bot_volks_assistente(self):
        try:
            with sync_playwright() as p:
                self.processar_volks_assistente(p)
        except OperacaoCancelada:
            self.log("Assistente VOLKS interrompido por STOP.")
        except Exception as e:
            if self.stop_solicitado():
                self.log("Assistente VOLKS interrompido por STOP.")
            else:
                self.log_erro(f"Erro fatal no assistente VOLKS: {e}")
        finally:
            self.log("Assistente VOLKS encerrado.")
            self.root.after(0, self.finalizar_estado_volks)

    def executar_bot_volks_preenchimento_teste(self):
        try:
            with sync_playwright() as p:
                self.processar_volks_preenchimento_teste(p)
        except Exception as e:
            self.log_erro(f"Erro fatal no teste de preenchimento VOLKS: {e}")
        finally:
            self.log("Teste de preenchimento VOLKS encerrado.")
            self.root.after(0, self.finalizar_estado_volks)

    def obter_dados_volks_caso_atual(self, page, abrir_pdf_visualmente=True):
        """Fluxo VOLKS atual: PDF visual + OCR direto no I - EMITENTE."""
        if abrir_pdf_visualmente:
            try:
                self.abrir_pdf_visual_var.set(True)
            except Exception:
                pass
            onclick = self.encontrar_botao_pdf(page)
        else:
            onclick = self.encontrar_botao_pdf_sem_abrir(page)
            if onclick:
                self.log("PDF localizado.")

        if not onclick:
            return None, "PDF não encontrado"

        match = re.search(r"abrirPdf\('(.*?)'\)", onclick)
        if not match:
            return None, "URL do PDF não reconhecida"

        pdf_url = BASE_URL + match.group(1)

        self.log("OCR VOLKS iniciado...")
        texto_ocr = self.extrair_texto_pdf_ocr_volks(pdf_url)
        if texto_ocr:
            dados = self.extrair_dados_volks_de_texto(texto_ocr)
            if dados:
                dados = self.normalizar_dados_volks(dados)
            if dados and self.validar_dados_emitente_volks(dados):
                return dados, "OCR VOLKS"

        return None, "dados insuficientes"

    def limpar_campos_volks(self, page):
        """Limpa todos os campos VOLKS em lote, sem delays campo a campo."""
        campos_para_limpar = [
            "valor_nome2",
            "valor_cpf_cnpj",
            "valor_resultado",
            "valor_resultado_numero",
            "valor_resultado_bairro",
            "valor_resultado_cidade",
            "valor_resultado_complemento",
            "valor_resultado_estado",
            "valor_resultado_cep",
        ]

        self.log("Limpando campos VOLKS...")
        script = """(ids) => {
            let encontrados = 0;
            for (const id of ids) {
                const el = document.getElementById(id);
                if (!el) continue;
                encontrados += 1;
                try {
                    el.value = '';
                    el.setAttribute('value', '');
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    if (el.blur) el.blur();
                } catch (e) {}
            }
            return encontrados;
        }"""

        total_encontrados = 0
        try:
            for frame in page.frames:
                try:
                    total_encontrados += int(frame.evaluate(script, campos_para_limpar) or 0)
                except Exception:
                    pass
        except Exception as e:
            self.log_erro(f"VOLKS: erro na limpeza em lote: {e}")
            return False

        if total_encontrados <= 0:
            self.log_erro("VOLKS: não encontrei os campos para limpar.")
            return False

        return True

    def liberar_interacao_manual_volks(self, page):
        """Depois do preenchimento, devolve o controle da tela para o usuário.
        Não clica em GRAVAR. Apenas solta foco, dispara eventos de alteração
        nos campos preenchidos e garante que o botão manual fique clicável.
        """
        try:
            page.evaluate("""() => {
                const ids = [
                    'valor_nome2',
                    'valor_cpf_cnpj',
                    'valor_resultado',
                    'valor_resultado_numero',
                    'valor_resultado_bairro',
                    'valor_resultado_cidade',
                    'valor_resultado_complemento',
                    'valor_resultado_estado',
                    'valor_resultado_cep'
                ];

                for (const id of ids) {
                    const el = document.getElementById(id);
                    if (!el) continue;
                    try {
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                        el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Tab' }));
                        if (el.blur) el.blur();
                    } catch (e) {}
                }

                const botao = document.querySelector('#botao, input[onclick="jsGravarDados()"], input[value="GRAVAR"]');
                if (botao) {
                    botao.disabled = false;
                    botao.readOnly = false;
                    botao.removeAttribute('disabled');
                    botao.style.pointerEvents = 'auto';
                    botao.style.cursor = 'pointer';
                    botao.style.zIndex = '9999';
                    try { botao.scrollIntoView({block: 'center', inline: 'center'}); } catch (e) {}
                }

                if (document.activeElement && document.activeElement.blur) {
                    document.activeElement.blur();
                }
                try { document.body.focus(); } catch (e) {}
            }""")
            try:
                page.bring_to_front()
            except Exception:
                pass
            try:
                page.mouse.move(12, 12)
            except Exception:
                pass
            return True
        except Exception as e:
            self.log_debug(f"VOLKS: não consegui executar liberação de interação manual: {e}")
            return False

    def normalizar_dados_volks(self, dados):
        """Correções finais seguras após OCR/parser."""
        try:
            for chave in ("endereco", "bairro", "cidade", "complemento", "estado"):
                valor = str(dados.get(chave, "") or "")
                valor = self.normalizar_texto_volks(valor)
                valor = re.sub(r"\bR\s+UA\b", "RUA", valor)
                valor = re.sub(r"\bA\s+V\b", "AV", valor)
                valor = re.sub(r"\s+", " ", valor).strip()
                dados[chave] = valor

            dados["cep"] = re.sub(r"\D+", "", str(dados.get("cep", "") or ""))
            dados["numero"] = str(dados.get("numero", "") or "").strip()
        except Exception:
            pass
        return dados

    def preencher_campos_volks_sem_gravar(self, page, dados):
        """Preenche somente os campos mapeados da VOLKS em lote. Não clica em GRAVAR.

        Otimização VOLKS v38: evita o preenchimento campo a campo via Playwright,
        que era seguro, mas mais lento. A HONDA continua usando o método antigo.
        """
        if not dados:
            return False

        numero = str(dados.get("numero", "")).strip()
        if numero in ("0", "00", "000"):
            numero = ""

        campos = {
            "valor_resultado": dados.get("endereco", ""),
            "valor_resultado_numero": numero,
            "valor_resultado_bairro": dados.get("bairro", ""),
            "valor_resultado_cidade": dados.get("cidade", ""),
            "valor_resultado_complemento": dados.get("complemento", ""),
            "valor_resultado_estado": dados.get("estado", ""),
            "valor_resultado_cep": dados.get("cep", ""),
        }

        # Normalização final só com regras VOLKS, preservando complemento como S/N.
        for campo, valor in list(campos.items()):
            if campo == "valor_resultado_cep":
                campos[campo] = self.cep_apenas_digitos_volks(valor)
            elif campo == "valor_resultado_numero":
                campos[campo] = str(valor or "").strip()
            else:
                campos[campo] = self.normalizar_texto_volks(valor)

        obrigatorios = ["valor_resultado", "valor_resultado_bairro", "valor_resultado_cidade", "valor_resultado_estado", "valor_resultado_cep"]
        faltando_valor = [campo for campo in obrigatorios if not str(campos.get(campo, "")).strip()]
        if faltando_valor:
            self.log_erro("VOLKS assistente: campos obrigatórios vazios. Não vou preencher: " + ", ".join(faltando_valor))
            return False

        if self.stop_solicitado():
            self.log("STOP acionado. Preenchimento VOLKS abortado.")
            return False

        self.log("Preenchendo campos VOLKS...")

        script = """(campos) => {
            const ids = Object.keys(campos || {});
            const preenchidos = [];
            const ausentes = [];

            for (const id of ids) {
                const el = document.getElementById(id) || document.querySelector(`[name="${id}"]`);
                if (!el) {
                    ausentes.push(id);
                    continue;
                }

                try {
                    const valor = String(campos[id] ?? '');
                    el.value = valor;
                    el.setAttribute('value', valor);
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    el.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Tab' }));
                    if (el.blur) el.blur();
                    preenchidos.push(id);
                } catch (e) {
                    ausentes.push(id + ':erro');
                }
            }

            return { preenchidos, ausentes };
        }"""

        preenchidos_total = set()
        try:
            for frame in page.frames:
                if self.stop_solicitado():
                    self.log("STOP acionado. Preenchimento VOLKS abortado.")
                    return False
                try:
                    resultado = frame.evaluate(script, campos) or {}
                    for item in resultado.get("preenchidos", []) or []:
                        preenchidos_total.add(item)
                    if all(campo in preenchidos_total for campo in campos.keys()):
                        break
                except Exception:
                    pass
        except Exception as e:
            self.log_erro(f"VOLKS assistente: erro no preenchimento em lote: {e}")
            return False

        faltando_elemento = [campo for campo in campos.keys() if campo not in preenchidos_total]
        if faltando_elemento:
            detalhe = ", ".join(faltando_elemento)
            self.log_erro(f"VOLKS assistente: campos não encontrados para preenchimento em lote: {detalhe}")
            return False

        # Libera foco/eventos da página para o clique manual em GRAVAR responder.
        self.liberar_interacao_manual_volks(page)

        self.log_sucesso("Campos VOLKS preenchidos. GRAVAR NÃO FOI ACIONADO.")
        self.log("Confira visualmente a tela da LUNA. Depois grave manualmente na própria LUNA.")
        return True

    def processar_volks_assistente(self, p):
        """Modo manual assistido: processa apenas o caso atual.

        Fluxo seguro:
        1. conecta na LUNA já aberta;
        2. extrai dados do I - EMITENTE;
        3. limpa todos os campos VOLKS;
        4. preenche os campos;
        5. encerra o bot completamente.

        Depois disso, o usuário confere e clica GRAVAR manualmente na própria LUNA.
        O AlphaBot não fica em loop, não vigia a página e não tenta gravar.
        """
        browser = None
        try:
            browser, page = self.conectar_sistema(p)
            if self.stop_solicitado() or not page:
                return

            self.tentar_aceitar_dialog_aberto(page, contexto="VOLKS assistente")
            self.status_var.set("Status: ASSISTENTE VOLKS - PROCESSANDO")
            self.log("===== ASSISTENTE VOLKS | CASO ATUAL =====")

            self.log("Limpando campos VOLKS imediatamente...")
            if not self.limpar_campos_volks(page):
                self.log_erro("VOLKS assistente: não consegui limpar os campos no início. Nada será preenchido.")
                return

            # VOLKS assistente é um caso por clique; contador da HONDA não é necessário aqui.
            # Evita consulta extra na página antes do OCR.
            dados, origem = self.obter_dados_volks_caso_atual(page, abrir_pdf_visualmente=True)
            if not dados:
                self.status_var.set("Status: VOLKS REVISÃO MANUAL")
                self.log_erro(f"VOLKS assistente: não consegui extrair dados com segurança. Origem/status: {origem}")
                self.log("Nada foi preenchido. O AlphaBot vai parar para você tratar esse caso manualmente.")
                return

            self.logar_resultado_diagnostico_volks(
                dados,
                origem=origem,
                acao="assistente manual. Campos serão preenchidos e o bot vai parar; GRAVAR fica por sua conta na LUNA"
            )

            preenchido = self.preencher_campos_volks_sem_gravar(page, dados)
            if preenchido:
                self.status_var.set("Status: VOLKS PREENCHIDO - GRAVAR MANUAL")
                self.log("CASO PREENCHIDO. O AlphaBot vai parar agora.")
            else:
                self.status_var.set("Status: VOLKS REVISÃO MANUAL")
                self.log("Preenchimento não foi concluído. O AlphaBot vai parar para revisão manual.")

        finally:
            # Encerrar a conexão Playwright devolve o controle total da LUNA para o usuário.
            pass

    def processar_volks_preenchimento_teste(self, p):
        browser = None
        try:
            browser, page = self.conectar_sistema(p)
            if self.stop_solicitado() or not page:
                return

            self.tentar_aceitar_dialog_aberto(page, contexto="VOLKS teste")

            self.log("Fluxo direto ativo: PDF -> OCR -> PARSE -> LIMPA -> PREENCHE -> PARA.")

            if self.stop_solicitado():
                return

            page.wait_for_timeout(80)
            self.atualizar_contadores(page)

            dados, origem = self.obter_dados_volks_caso_atual(page)
            if not dados:
                self.log_erro(f"VOLKS teste: não consegui extrair dados com segurança. Origem/status: {origem}")
                return

            self.logar_resultado_diagnostico_volks(dados, origem=origem, acao="teste de preenchimento. Campos serão preenchidos, mas nada será gravado")
            self.preencher_campos_volks_sem_gravar(page, dados)

        finally:
            # Não fechamos o Edge aqui para permitir conferência visual dos campos preenchidos.
            try:
                if browser:
                    browser.close()
            except Exception:
                pass

    def processar_volks_diagnostico(self, p):
        browser = None
        try:
            browser, page = self.conectar_sistema(p)

            if self.stop_solicitado() or not page:
                return

            self.tentar_aceitar_dialog_aberto(page, contexto="VOLKS diagnóstico")

            self.log("Fluxo direto ativo: PDF -> OCR -> PARSE -> LIMPA -> PREENCHE -> PARA.")

            if self.stop_solicitado():
                return

            page.wait_for_timeout(80)
            self.atualizar_contadores(page)

            self.log("Procurando texto OCR já exibido na tela da LUNA...")
            texto_luna = self.texto_pagina_luna(page)
            dados = self.extrair_dados_volks_de_texto(texto_luna)

            if dados:
                self.logar_resultado_diagnostico_volks(dados, origem="texto exibido na LUNA")
                return

            self.log("Não encontrei os dados pelo texto da tela. Tentando localizar PDF para leitura diagnóstica...")
            onclick = self.encontrar_botao_pdf(page)

            if not onclick:
                self.log_erro("VOLKS diagnóstico: não encontrei texto suficiente nem botão PDF.")
                return

            match = re.search(r"abrirPdf\('(.*?)'\)", onclick)
            if not match:
                self.log_erro("VOLKS diagnóstico: botão PDF encontrado, mas sem URL reconhecível.")
                return

            pdf_url = BASE_URL + match.group(1)
            texto_pdf = self.extrair_texto_pdf(pdf_url)

            if texto_pdf and texto_pdf != "ERRO_PDF":
                dados = self.extrair_dados_volks_de_texto(texto_pdf)
                if dados:
                    self.logar_resultado_diagnostico_volks(dados, origem="texto interno do PDF")
                    return

            self.log("OCR VOLKS iniciado no bloco I - EMITENTE...")
            texto_ocr = self.extrair_texto_pdf_ocr_volks(pdf_url)

            if texto_ocr:
                dados = self.extrair_dados_volks_de_texto(texto_ocr)
                if dados and self.validar_dados_emitente_volks(dados):
                    self.logar_resultado_diagnostico_volks(dados, origem="OCR específico VOLKS")
                    return

            self.log_erro("VOLKS diagnóstico: OCR ainda não encontrou dados suficientes com segurança.")

        finally:
            if browser:
                try:
                    browser.close()
                except Exception:
                    pass


    # =====================================================
    # HONDA - PROCESSAMENTO DE UM CASO
    # =====================================================

    def processar_um_caso(self, p):
        browser = None
        self.iniciar_timer_caso()

        # UI: cada ciclo/caso precisa começar com o workflow limpo.
        # Sem isso, as etapas verdes do caso anterior continuam marcadas
        # e só a etapa atual muda, dando a impressão de fluxo travado.
        try:
            self.resetar_workflow("Iniciando novo caso.")
            self.set_workflow("luna", "ativo", "Inicializando e validando a tela da LUNA.", concluir_anteriores=False)
        except Exception:
            pass

        try:
            browser, page = self.conectar_sistema(p)

            if self.stop_solicitado():
                return

            if not page:
                self.log("Tentando novamente em 2 segundos...")
                self.run_atual_ativa = False
                self.run_atual_var.set("RUN ATUAL: 00:00")

                if browser:
                    try:
                        browser.close()
                    except Exception:
                        pass

                self.aguardar_com_stop(0.25)
                return

            self.tentar_aceitar_dialog_aberto(page, contexto="início do caso")

            if self.dialog_sessao_bloqueada:
                self.parar_para_revisao_manual("A LUNA parece ter perdido login/sessão. Faça login novamente e revise manualmente.")
                if browser:
                    try:
                        browser.close()
                    except Exception:
                        pass
                return

            if not self.preparar_tela_inicial_luna(page, self.modulo_atual):
                self.gerar_diagnostico_luna(page, contexto="falha ao preparar tela inicial", acao="Recovery será tentado.")
                if self.recovery_pendente:
                    self.recovery_pendente = False
                    if not self.recuperar_fluxo_luna(page, motivo="dialog de reinicialização pendente"):
                        if browser:
                            try:
                                browser.close()
                            except Exception:
                                pass
                        return

                if not self.recuperar_fluxo_luna(page, motivo="falha ao preparar tela inicial"):
                    if browser:
                        try:
                            browser.close()
                        except Exception:
                            pass
                    return

            if self.tratar_watchdog_caso(page, contexto="preparação/validação inicial"):
                if browser:
                    try:
                        browser.close()
                    except Exception:
                        pass
                return

            if not self.meta_total_validada:
                if not self.validar_meta_com_total():
                    if browser:
                        try:
                            browser.close()
                        except Exception:
                            pass
                    return

            if self.stop_solicitado():
                return

            if self.tratar_watchdog_caso(page, contexto="antes de buscar PDF"):
                if browser:
                    try:
                        browser.close()
                    except Exception:
                        pass
                return

            self.set_estado_luna("OK", pdf="BUSCANDO", campos="AGUARDANDO", gravar="-")
            self.log("Buscando PDF...")
            if not self.aguardar_com_stop(1):
                return

            onclick = self.encontrar_botao_pdf(page)

            if not onclick:
                if self.detectar_documento_ja_verificado(page):
                    self.gerar_diagnostico_luna(page, contexto="documento já verificado", acao="Recovery iniciado para voltar ao início do lote.")
                    self.recuperar_fluxo_luna(page, motivo="documento já verificado no lugar dos campos")
                elif not self.validar_tela_processada_luna(page):
                    self.gerar_diagnostico_luna(page, contexto="PDF ausente e tela não validada", acao="Recovery iniciado para reconstruir a tela.")
                    self.recuperar_fluxo_luna(page, motivo="PDF ausente e tela não validada")
                else:
                    self.gerar_diagnostico_luna(page, contexto="PDF ausente com tela aparentemente válida", acao="Vou tentar novamente no próximo ciclo.")
                    self.log("PDF ainda não apareceu. Tentando novamente no próximo ciclo...")
                self.run_atual_ativa = False
                self.run_atual_var.set("RUN ATUAL: 00:00")
                browser.close()
                self.aguardar_com_stop(1)
                return

            self.set_estado_luna("OK", pdf="OK", campos="AGUARDANDO", gravar="-")
            self.log_debug("PDF encontrado.")
            self.log_debug(f"ONCLICK:\n{onclick}")

            match = re.search(r"abrirPdf\('(.*?)'\)", onclick)

            if not match:
                self.log_erro("Não foi possível localizar URL PDF.")
                self.gerar_diagnostico_luna(page, contexto="onclick do PDF sem URL", acao="Caso não será gravado; vou tentar novamente após pequeno intervalo.")
                self.run_atual_ativa = False
                self.run_atual_var.set("RUN ATUAL: 00:00")
                browser.close()
                self.aguardar_com_stop(0.25)
                return

            pdf_path = match.group(1)

            grupo_cota_match = re.search(r"lido_ok_(.*?)_CONTRATO", pdf_path)
            grupo_cota = grupo_cota_match.group(1) if grupo_cota_match else ""

            self.log(f"GRUPO/COTA: {grupo_cota}")

            if self.stop_solicitado():
                return

            if self.tratar_watchdog_caso(page, contexto="antes de baixar PDF"):
                if browser:
                    try:
                        browser.close()
                    except Exception:
                        pass
                return

            pdf_url = BASE_URL + pdf_path
            self.set_estado_luna("OK", pdf="BAIXANDO", campos="AGUARDANDO", gravar="-")
            texto_pdf = self.extrair_texto_pdf(pdf_url)

            if texto_pdf == "ERRO_PDF":
                self.preencher_erro_pdf(page, grupo_cota)
                browser.close()
                self.aguardar_com_stop(1)
                return

            if not texto_pdf:
                self.preencher_faltando_endereco(page, grupo_cota)
                browser.close()
                self.aguardar_com_stop(1)
                return

            dados = self.encontrar_dados(texto_pdf)

            if not dados:
                self.gerar_diagnostico_luna(page, contexto="dados não encontrados no PDF", acao="Bot pausado para revisão do PDF/caso.")
                self.pausar_para_revisao_manual("Dados nao encontrados em PDF com texto. Pausando para revisao manual.")
                browser.close()
                return

            self.set_estado_luna("OK", pdf="OK", campos="PREENCHENDO", gravar="-")
            self.log("Dados encontrados. Preenchendo campos...")
            self.log_debug(dados)

            if self.stop_solicitado():
                return
            self.limpar_nome_cliente(page)
            if self.stop_solicitado():
                return
            self.limpar_campo(page, "valor_cpf_cnpj")
            if self.stop_solicitado():
                return
            self.preencher_campo(page, "valor_grupo_cota", grupo_cota)

            if not self.aguardar_com_stop(1):
                return

            numero = dados["numero"]

            if str(numero).strip() == "0":
                numero = "S/N"

            campos = {
                "valor_resultado_cep": dados["cep"],
                "valor_resultado_estado": dados["estado"],
                "valor_resultado_cidade": dados["cidade"],
                "valor_resultado_bairro": dados["bairro"],
                "valor_resultado": dados["endereco"],
                "valor_resultado_numero": numero,
                "valor_resultado_complemento": dados["complemento"]
            }

            for campo, valor in campos.items():
                if self.tratar_watchdog_caso(page, contexto=f"preenchendo {campo}"):
                    if browser:
                        try:
                            browser.close()
                        except Exception:
                            pass
                    return
                if self.stop_solicitado():
                    self.log("STOP acionado. Preenchimento abortado antes de concluir o caso.")
                    return
                self.preencher_campo(page, campo, valor)
                if not self.aguardar_com_stop(0.1):
                    self.log("STOP acionado. Preenchimento abortado antes de concluir o caso.")
                    return

            if self.stop_solicitado():
                return

            self.set_estado_luna("OK", pdf="OK", campos="PREENCHIDOS", gravar="AGUARDANDO")
            self.log_sucesso("Campos preenchidos.")

            if self.tratar_watchdog_caso(page, contexto="antes da validação pré-GRAVAR"):
                if browser:
                    try:
                        browser.close()
                    except Exception:
                        pass
                return

            if not self.validar_campos_antes_gravar(page, grupo_cota, dados):
                if browser:
                    try:
                        browser.close()
                    except Exception:
                        pass
                return

            self.set_estado_luna("OK", pdf="OK", campos="VALIDADOS", gravar="GRAVANDO")
            resultado_gravacao = self.clicar_gravar(page)

            if resultado_gravacao is True:
                self.registrar_caso_gravado(page)
                self.set_estado_luna("OK", pdf="OK", campos="OK", gravar="SUCESSO")
                try:
                    self.set_workflow("proximo", "ok", "Caso concluído. Preparando próximo caso.")
                except Exception:
                    pass
                self.log_sucesso("Caso gravado. Continuando loop...\n")
            elif resultado_gravacao == "RECOVERY":
                self.recuperar_fluxo_luna(page, motivo="alerta de reinicialização após GRAVAR")
                self.set_estado_luna("RECOVERY", gravar="REFARÁ O CASO")
                self.log_recovery("Caso não foi registrado como concluído. Ele será refeito no próximo ciclo.\n")
            else:
                self.pausar_para_revisao_manual("Nao consegui gravar. Bot pausado para revisao manual.")

            browser.close()
            self.aguardar_com_stop(1)

        except Exception as e:
            self.log_erro(f"Erro geral no caso: {e}")
            try:
                if 'page' in locals() and page is not None:
                    self.gerar_diagnostico_luna(page, contexto="erro geral no caso", acao="Vou aguardar e tentar continuar, salvo se o STOP foi acionado.")
            except Exception:
                pass

            if browser:
                try:
                    browser.close()
                except Exception:
                    pass

            self.run_atual_ativa = False
            self.run_atual_var.set("RUN ATUAL: 00:00")
            self.log("Tentando continuar em 3 segundos...\n")
            self.aguardar_com_stop(0.3)




# =========================================================
# ENTRADA DA APLICAÇÃO
# =========================================================
if __name__ == "__main__":
    root = tk.Tk()
    app = BotLunaApp(root)
    root.mainloop()