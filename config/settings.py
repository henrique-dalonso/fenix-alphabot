"""
Configurações centrais do Fênix — v8.
Nenhum outro módulo declara constantes de negócio — tudo passa por aqui.

Novidades desta versão:
- Adicionado EDGE_DEBUG_PORT: usado pelo engine (v14) para conectar no
  Edge via CDP (connect_over_cdp) em vez de launch_persistent_context.
  Ver changelog completo em modules/honda/engine.py.

Histórico (v7):
- REVERTIDO A PEDIDO DO USUÁRIO: a v6 havia trocado DIR_PERFIL_EDGE para
  um perfil dedicado e isolado, mas o usuário confirmou que usar o
  perfil PESSOAL do Edge é intencional (quer o login/sessão do dia a
  dia, quer ver o bot rodando na mesma janela que usa normalmente).
  Voltou a apontar para o perfil real do Windows
  (%LOCALAPPDATA%\\Microsoft\\Edge\\User Data).
"""

import os

APP_NAME = "Fênix"
APP_VERSION = "1.0.0"

# -----------------------------------------------------------
# LUNA
# -----------------------------------------------------------
BASE_URL = "https://npjur.paschoalotto.com.br"
ROTINA_LUNA_URL = f"{BASE_URL}/sistema/relatorios/robots/catia_rotina1.php"
LOGIN_URL = f"{BASE_URL}/gelogin.php?origem=%2F"

MAX_TENTATIVAS_RECOVERY = 3
WATCHDOG_CASO_SEGUNDOS = 180

# -----------------------------------------------------------
# Módulos de negócio — values confirmados pelo usuário
# -----------------------------------------------------------
MODULOS_LUNA = {
    "HONDA": {
        "banco_value": "1",
        "tipo_value": "1",
        "modo": "automatico",
    },
    "VOLKS": {
        "banco_value": "12",
        "tipo_value": "17",
        "modo": "assistido",
    },
}

# -----------------------------------------------------------
# Seletores da LUNA — confirmados inspecionando o HTML real
# -----------------------------------------------------------
LUNA_SELETORES = {
    "banco":         'select[name="id_cliente_p"]',
    "tipo":          'select[name="id_cliente"]',
    "ordem":         'input[name="ordem"]',
    "total":         'input[name="total"]',
    "seta_direita": [
        'img[onclick="jsProximo()"]',
        '[onclick="jsProximo()"]',
        'img[src*="/pro.png"]',
        '[onclick*="jsProximo"]',
    ],
    "seta_esquerda": [
        'img[onclick="jsAnterior()"]',
        '[onclick="jsAnterior()"]',
        'img[src*="/ant.png"]',
        '[onclick*="jsAnterior"]',
    ],
    "botao_gravar":  'input[id="botao"]',
    "botao_pdf":     'img[onclick*="abrirPdf"]',
}

# Campos do formulário — mesmo name para Honda e Volks
#
# NOTA (ajuste do usuário): a LUNA tem DOIS campos possíveis para nome
# do cliente — "valor_nome" e "valor_nome2". Nem todo contrato exibe
# os dois; o Fênix limpa ambos quando presentes, e ignora silenciosamente
# quando um deles não existir na tela (igual o AlphaBot original fazia
# com sua lista de candidatos em limpar_nome_cliente()).
LUNA_CAMPOS = {
    "nome":         "valor_nome2",
    "nome_alt":     "valor_nome",
    "cpf_cnpj":     "valor_cpf_cnpj",
    "endereco":     "valor_resultado",
    "numero":       "valor_resultado_numero",
    "bairro":       "valor_resultado_bairro",
    "cidade":       "valor_resultado_cidade",
    "complemento":  "valor_resultado_complemento",
    "estado":       "valor_resultado_estado",
    "grupo_cota":   "valor_grupo_cota",
    "cep":          "valor_resultado_cep",
}

# -----------------------------------------------------------
# Caminhos internos do projeto
# -----------------------------------------------------------
DIR_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR_LOGS = os.path.join(DIR_BASE, "logs")
DIR_ASSETS = os.path.join(DIR_BASE, "assets")
DIR_DATA = os.path.join(DIR_BASE, "data")

os.makedirs(DIR_LOGS, exist_ok=True)
os.makedirs(DIR_DATA, exist_ok=True)

# -----------------------------------------------------------
# Edge
# -----------------------------------------------------------
EDGE_CAMINHOS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]

# Perfil PESSOAL do usuário — decisão intencional dele, não um bug.
# Reaproveita o mesmo Edge do dia a dia (login/sessão persistem igual
# ao uso normal do navegador).
_LOCALAPPDATA = os.environ.get("LOCALAPPDATA", "")
DIR_PERFIL_EDGE = os.path.join(_LOCALAPPDATA, "Microsoft", "Edge", "User Data")

# Porta de depuração remota usada para o Fênix se conectar ao Edge via
# CDP (connect_over_cdp) — desde a v14 do engine, o Edge é aberto como
# processo independente do Fênix (não mais launch_persistent_context),
# o que faz o navegador sobreviver ao fechamento do app.
EDGE_DEBUG_PORT = 9333

DEBUG = False
