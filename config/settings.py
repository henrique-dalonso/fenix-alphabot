"""
Configurações centrais do Fênix.
Nenhum outro módulo declara constantes de negócio — tudo passa por aqui.
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
LUNA_CAMPOS = {
    "nome":         "valor_nome2",
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
# Edge
# -----------------------------------------------------------
EDGE_CAMINHOS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]

_LOCALAPPDATA = os.environ.get("LOCALAPPDATA", "")
DIR_PERFIL_EDGE = os.path.join(_LOCALAPPDATA, "Microsoft", "Edge", "User Data")

# -----------------------------------------------------------
# Caminhos internos do projeto
# -----------------------------------------------------------
DIR_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR_LOGS = os.path.join(DIR_BASE, "logs")
DIR_ASSETS = os.path.join(DIR_BASE, "assets")
DIR_DATA = os.path.join(DIR_BASE, "data")

os.makedirs(DIR_LOGS, exist_ok=True)
os.makedirs(DIR_DATA, exist_ok=True)

DEBUG = False