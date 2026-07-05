"""
Janela principal do Fênix — v5.

Novidades desta versão:
- `_ao_fechar_janela` agora espera o engine terminar a rotina de
  encerramento (`aguardar_encerramento`) antes de destruir a janela —
  necessário para o handoff do Edge funcionar (ver
  modules/honda/engine.py v15+): o engine fecha o Edge automatizado e
  reabre um Edge comum com as abas restauradas, tudo isso rodando na
  thread do engine. Sem esperar por isso aqui, o processo do Fênix
  podia morrer no meio dessa rotina antes do Edge comum ser reaberto.

Histórico (v4):
- Checkbox "Modo de Teste" no painel Honda: quando ativo, o engine
  abre o PDF fisicamente e pausa antes de GRAVAR, esperando o
  usuário revisar e confirmar pela barra de confirmação que aparece
  entre os cartões de status e o log.
- Checkbox some ao trocar para Volks (lá o fluxo já é manual por
  padrão) e trava enquanto o bot está em execução.

Histórico (v3):
- Ícones de módulo (sidebar) agora são as LOGOS reais da Honda/Volks,
  não mais letra "H"/"V".
- Ícones de ação (engrenagem, tema, campos, gravação, atividade)
  trocados de fonte de glifo para PNG vetorial nítido (ver
  core/icon_loader.py) — corrige o serrilhado relatado.
- Sidebar mais larga e ícones maiores — corrige o "tudo muito pequeno".
- Bug do tooltip grudado e do botão vazando da sidebar (reportados
  nos prints) corrigidos na origem em ui/components.py.
"""

import threading
import customtkinter as ctk
from config import settings
from core.logger import logger
from core.icon_loader import logo_marca, icone_tingido
from ui import theme
from ui.components import BotaoIcone, BotaoLogoNav, CartaoStatus

ctk.set_default_color_theme("blue")


class FenixApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.gerenciador_tema = theme.GerenciadorTema(modo="light")
        self.cores = self.gerenciador_tema.cores()

        self.title(f"{settings.APP_NAME} {settings.APP_VERSION}")
        self.geometry("1240x800")
        self.minsize(1000, 640)

        self.modulo_ativo = "HONDA"
        self.rodando = False

        self._montar_layout()
        self._aplicar_tema()
        self.after(150, self._consumir_log)

        # Engine thread persistente — nasce com o app, dorme entre sessões
        from modules.honda.engine import HondaEngine
        self._engine = HondaEngine()
        self._engine.start()

        self.protocol("WM_DELETE_WINDOW", self._ao_fechar_janela)

    # -----------------------------------------------------------
    # Construção da UI
    # -----------------------------------------------------------
    def _montar_layout(self):
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        self._montar_sidebar()
        self._montar_conteudo()

    def _montar_sidebar(self):
        self.sidebar = ctk.CTkFrame(self, width=theme.LARGURA_SIDEBAR, corner_radius=0)
        self.sidebar.grid(row=0, column=0, sticky="ns")
        self.sidebar.grid_propagate(False)
        self.sidebar.pack_propagate(False)

        from core.icon_loader import logo_marca
        logo_fenix = logo_marca("fenix_logo.png", largura=58)
        self.label_marca = ctk.CTkLabel(self.sidebar, text="", image=logo_fenix)
        self.label_marca.pack(pady=(20, 28))

        logo_honda = logo_marca("honda_logo_transp.png", largura=56)
        self.btn_nav_honda = BotaoLogoNav(
            self.sidebar, imagem_logo=logo_honda, tooltip="Honda — automação completa",
            cores=self.cores, command=lambda: self._selecionar_modulo("HONDA")
        )
        self.btn_nav_honda.pack(pady=10)

        logo_volks = logo_marca("volks_logo_transp.png", largura=46)
        self.btn_nav_volks = BotaoLogoNav(
            self.sidebar, imagem_logo=logo_volks, tooltip="Volks — assistente",
            cores=self.cores, command=lambda: self._selecionar_modulo("VOLKS")
        )
        self.btn_nav_volks.pack(pady=10)

        self.spacer = ctk.CTkLabel(self.sidebar, text="")
        self.spacer.pack(expand=True, fill="y")

        self.btn_tema = BotaoIcone(
            self.sidebar, nome_icone=self.gerenciador_tema.icone_alternar_tema,
            tooltip="Alternar modo claro/escuro", tamanho=44,
            tamanho_icone=theme.TAMANHO_ICONE_RODAPE, command=self._alternar_tema
        )
        self.btn_tema.pack(pady=(0, 12))

        self.btn_config = BotaoIcone(
            self.sidebar, nome_icone=theme.ICONE_ENGRENAGEM,
            tooltip="Configurações", tamanho=44,
            tamanho_icone=theme.TAMANHO_ICONE_RODAPE, command=self._abrir_configuracoes
        )
        self.btn_config.pack(pady=(0, 24))

    def _montar_conteudo(self):
        self.conteudo = ctk.CTkFrame(self, corner_radius=0)
        self.conteudo.grid(row=0, column=1, sticky="nsew")
        self.conteudo.grid_columnconfigure(0, weight=1)
        self.conteudo.grid_rowconfigure(3, weight=1)

        cabecalho = ctk.CTkFrame(self.conteudo, fg_color="transparent")
        cabecalho.grid(row=0, column=0, sticky="ew", padx=36, pady=(32, 12))
        cabecalho.grid_columnconfigure(0, weight=1)

        self.label_modulo = ctk.CTkLabel(cabecalho, text="Honda", font=theme.FONTE_TITULO, anchor="w")
        self.label_modulo.grid(row=0, column=0, sticky="w")

        self.label_descricao = ctk.CTkLabel(
            cabecalho, text="Automação completa do início ao fim.",
            font=theme.FONTE_SUBTITULO, anchor="w"
        )
        self.label_descricao.grid(row=1, column=0, sticky="w", pady=(3, 0))

        # Modo de Teste: pausa antes de gravar, esperando conferência manual.
        # Só faz sentido pro Honda (Volks já é manual por padrão) — ver
        # _selecionar_modulo, que esconde/mostra este checkbox.
        self.modo_teste_var = ctk.BooleanVar(value=False)
        self.check_modo_teste = ctk.CTkCheckBox(
            cabecalho, text="Modo de Teste — pausa antes de gravar para conferência",
            variable=self.modo_teste_var, font=theme.FONTE_LABEL_PEQUENA,
        )
        self.check_modo_teste.grid(row=2, column=0, sticky="w", pady=(12, 0))

        # Botão circular renderizado como imagem — garante círculo perfeito
        from core.icon_loader import botao_circular
        self._img_play       = botao_circular(theme.ICONE_PLAY, theme.COR_PRIMARIA,       80, 34)
        self._img_play_hover = botao_circular(theme.ICONE_PLAY, theme.COR_PRIMARIA_HOVER, 80, 34)
        self._img_stop       = botao_circular(theme.ICONE_STOP, theme.COR_ERRO,           80, 34)
        self._img_stop_hover = botao_circular(theme.ICONE_STOP, "#b91c1c",                80, 34)

        self.btn_acao = ctk.CTkLabel(
            cabecalho, text="", image=self._img_play, cursor="hand2"
        )
        self.btn_acao.grid(row=0, column=1, rowspan=2, sticky="e")
        self.btn_acao.bind("<Button-1>", lambda e: self._alternar_execucao())
        self.btn_acao.bind("<Enter>", lambda e: self.btn_acao.configure(
            image=self._img_stop_hover if self.rodando else self._img_play_hover
        ))
        self.btn_acao.bind("<Leave>", lambda e: self.btn_acao.configure(
            image=self._img_stop if self.rodando else self._img_play
        ))

        linha_status = ctk.CTkFrame(self.conteudo, fg_color="transparent")
        linha_status.grid(row=1, column=0, sticky="ew", padx=36, pady=(16, 20))
        linha_status.grid_columnconfigure((0, 1, 2), weight=1, uniform="status")

        self.cartao_pdf = CartaoStatus(linha_status, theme.ICONE_DOC, "PDF", self.cores)
        self.cartao_pdf.grid(row=0, column=0, sticky="ew", padx=(0, 10))

        self.cartao_campos = CartaoStatus(linha_status, theme.ICONE_CAMPOS, "CAMPOS", self.cores)
        self.cartao_campos.grid(row=0, column=1, sticky="ew", padx=10)

        self.cartao_gravar = CartaoStatus(linha_status, theme.ICONE_GRAVAR, "GRAVAÇÃO", self.cores)
        self.cartao_gravar.grid(row=0, column=2, sticky="ew", padx=(10, 0))

        # Barra de confirmação do Modo de Teste — oculta até o engine
        # sinalizar que está aguardando revisão do usuário.
        self.frame_confirmacao = ctk.CTkFrame(
            self.conteudo, fg_color=theme.COR_AVISO, corner_radius=theme.RAIO_PAINEL
        )
        self.frame_confirmacao.grid(row=2, column=0, sticky="ew", padx=36, pady=(0, 16))
        self.frame_confirmacao.grid_columnconfigure(0, weight=1)

        self.label_confirmacao = ctk.CTkLabel(
            self.frame_confirmacao,
            text="Revise o PDF e os campos na LUNA. Quando estiver tudo certo, confirme.",
            font=theme.FONTE_LABEL_PEQUENA, text_color="#ffffff", anchor="w"
        )
        self.label_confirmacao.grid(row=0, column=0, sticky="w", padx=18, pady=14)

        self.btn_confirmar = ctk.CTkButton(
            self.frame_confirmacao, text="✅ Confirmar e Gravar",
            command=self._confirmar_gravacao_teste,
            fg_color=theme.COR_SUCESSO, hover_color="#15803d",
            font=theme.FONTE_BOTAO,
        )
        self.btn_confirmar.grid(row=0, column=1, sticky="e", padx=18, pady=10)

        self.frame_confirmacao.grid_remove()

        painel_log = ctk.CTkFrame(self.conteudo, corner_radius=theme.RAIO_PAINEL)
        painel_log.grid(row=3, column=0, sticky="nsew", padx=36, pady=(0, 32))
        painel_log.grid_columnconfigure(0, weight=1)
        painel_log.grid_rowconfigure(1, weight=1)

        cabecalho_log = ctk.CTkFrame(painel_log, fg_color="transparent")
        cabecalho_log.grid(row=0, column=0, sticky="ew", padx=18, pady=(14, 6))

        self.label_icone_log = ctk.CTkLabel(
            cabecalho_log, text="",
            image=icone_tingido(theme.ICONE_LOG, self.cores["texto_secundario"], 18)
        )
        self.label_icone_log.pack(side="left", padx=(0, 8))

        self.label_atividade = ctk.CTkLabel(cabecalho_log, text="Atividade", font=theme.FONTE_LABEL_PEQUENA)
        self.label_atividade.pack(side="left")

        self.caixa_log = ctk.CTkTextbox(painel_log, font=theme.FONTE_LOG, corner_radius=10)
        self.caixa_log.grid(row=1, column=0, sticky="nsew", padx=18, pady=(0, 18))
        self.caixa_log.configure(state="disabled")

    # -----------------------------------------------------------
    # Tema
    # -----------------------------------------------------------
    def _aplicar_tema(self):
        c = self.cores = self.gerenciador_tema.cores()
        ctk.set_appearance_mode(self.gerenciador_tema.modo)

        self.configure(fg_color=c["fundo_app"])
        self.sidebar.configure(fg_color=c["fundo_sidebar"])
        self.conteudo.configure(fg_color=c["fundo_app"])

        self.label_modulo.configure(text_color=c["texto_principal"])
        self.label_descricao.configure(text_color=c["texto_secundario"])
        self.label_atividade.configure(text_color=c["texto_secundario"])
        self.label_icone_log.configure(image=icone_tingido(theme.ICONE_LOG, c["texto_secundario"], 18))
        self.check_modo_teste.configure(text_color=c["texto_secundario"])

        for cartao in (self.cartao_pdf, self.cartao_campos, self.cartao_gravar):
            cartao.aplicar_tema(c)

        self.btn_nav_honda.cores = c
        self.btn_nav_volks.cores = c
        self.btn_nav_honda.definir_ativo(self.btn_nav_honda.ativo)
        self.btn_nav_volks.definir_ativo(self.btn_nav_volks.ativo)

        self.btn_tema.trocar_icone(self.gerenciador_tema.icone_alternar_tema, c["texto_secundario"])
        self.btn_config.definir_cor_icone(c["texto_secundario"])

    def _alternar_tema(self):
        self.gerenciador_tema.alternar()
        self._aplicar_tema()

    # -----------------------------------------------------------
    # Navegação entre módulos
    # -----------------------------------------------------------
    def _selecionar_modulo(self, modulo: str):
        if self.rodando:
            logger.aviso("Não é possível trocar de módulo enquanto o bot está em execução.")
            return

        self.modulo_ativo = modulo
        self.btn_nav_honda.definir_ativo(modulo == "HONDA")
        self.btn_nav_volks.definir_ativo(modulo == "VOLKS")

        if modulo == "HONDA":
            self.label_modulo.configure(text="Honda")
            self.label_descricao.configure(text="Automação completa do início ao fim.")
            self.check_modo_teste.grid()
        else:
            self.label_modulo.configure(text="Volks")
            self.label_descricao.configure(text="Assistente — preenche e aguarda sua conferência.")
            self.check_modo_teste.grid_remove()
            self._mostrar_confirmacao(False)

    # -----------------------------------------------------------
    # Execução — sinaliza a thread persistente do engine
    # -----------------------------------------------------------
    def _alternar_execucao(self):
        self.rodando = not self.rodando
        if self.rodando:
            self._btn_acao_stop()
            modo_teste = bool(self.modo_teste_var.get())
            if modo_teste:
                logger.info(
                    "Modo de Teste ativado — o Fênix vai abrir o PDF e pausar "
                    "antes de cada GRAVAR para sua conferência."
                )
            self._engine.play(self._montar_callbacks(), modo_teste=modo_teste)
            # Monitora quando o engine para para atualizar o botão
            self.after(300, self._verificar_engine_parado)
        else:
            logger.aviso("STOP solicitado — finalizando tarefa atual...")
            self._engine.stop()
            self._btn_acao_play()
            self.rodando = False
            self._mostrar_confirmacao(False)

    def _montar_callbacks(self) -> dict:
        return {
            "on_pdf": lambda v: self.after(0, lambda: self.cartao_pdf.atualizar(
                v.upper(), theme.COR_SUCESSO if v == "ok" else theme.COR_INFO
            )),
            "on_campos": lambda v: self.after(0, lambda: self.cartao_campos.atualizar(
                v.upper(), theme.COR_SUCESSO if "valid" in v else theme.COR_INFO
            )),
            "on_gravar": lambda v: self.after(0, lambda: self._atualizar_cartao_gravar(v)),
        }

    def _atualizar_cartao_gravar(self, v: str):
        if v == "aguardando":
            self.cartao_gravar.atualizar(v.upper(), theme.COR_AVISO)
            self._mostrar_confirmacao(True)
            return

        self.cartao_gravar.atualizar(
            v.upper(),
            theme.COR_SUCESSO if v == "sucesso" else (
                theme.COR_RECOVERY if v == "recovery" else theme.COR_ERRO
            ),
        )
        self._mostrar_confirmacao(False)

    def _mostrar_confirmacao(self, mostrar: bool):
        if mostrar:
            self.frame_confirmacao.grid()
        else:
            self.frame_confirmacao.grid_remove()

    def _confirmar_gravacao_teste(self):
        self._engine.confirmar("gravar")
        self._mostrar_confirmacao(False)

    def _verificar_engine_parado(self):
        """Polling leve: detecta quando engine para e restaura o botão."""
        if self.rodando and not self._engine.rodando:
            self.rodando = False
            self._btn_acao_play()
            self._mostrar_confirmacao(False)
        elif self.rodando:
            self.after(300, self._verificar_engine_parado)

    def _btn_acao_play(self):
        self.btn_acao.configure(image=self._img_play)
        self.check_modo_teste.configure(state="normal")

    def _btn_acao_stop(self):
        self.btn_acao.configure(image=self._img_stop)
        self.check_modo_teste.configure(state="disabled")

    def _ao_fechar_janela(self):
        """
        Sinaliza o encerramento ao engine e ESPERA a rotina de handoff
        do Edge terminar (fechar o Edge automatizado + reabrir um Edge
        comum com as abas restauradas — ver modules/honda/engine.py)
        antes de destruir a janela e deixar o processo do Fênix morrer.
        Sem essa espera, o processo podia ser encerrado no meio da
        rotina, antes do Edge comum ser reaberto.

        O timeout de 6s é uma rede de segurança: se por algum motivo o
        engine travar nessa rotina, a janela fecha mesmo assim (não
        trava o Fênix indefinidamente).
        """
        logger.info("Encerrando o Fênix...")
        self._engine.quit()
        self._engine.aguardar_encerramento(timeout=6.0)
        self.destroy()

    def _abrir_configuracoes(self):
        logger.info("Configurações ainda não implementadas nesta versão.")

    # -----------------------------------------------------------
    # Consumo do log central (fila -> textbox)
    # -----------------------------------------------------------
    def _consumir_log(self):
        try:
            while True:
                evento = logger.fila.get_nowait()
                linha = f"[{evento['timestamp']}] [{evento['nivel']}] {evento['mensagem']}\n"
                self.caixa_log.configure(state="normal")
                self.caixa_log.insert("end", linha)
                self.caixa_log.see("end")
                self.caixa_log.configure(state="disabled")
        except Exception:
            pass
        finally:
            self.after(150, self._consumir_log)
