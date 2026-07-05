"""
Configurações centrais do Fênix — v9.
Nenhum outro módulo declara constantes de negócio — tudo passa por aqui.

Novidades desta versão (v9):
- MUDANÇA ESTRUTURAL DEFINITIVA: DIR_PERFIL_EDGE volta a ser um perfil
  DEDICADO do Fênix (data/edge_profile_fenix), não mais o perfil
  pessoal do Windows. Motivo: desde o Chrome/Edge 136, o navegador
  bloqueia QUALQUER canal de depuração remota (porta ou pipe) quando o
  --user-data-dir aponta para o perfil padrão do sistema — restrição de
  segurança do próprio navegador, sem contorno via código (ver
  FENIX_STATUS.md, seção sobre a descoberta). Isso não é mais uma
  preferência de conveniência do usuário (era, até a v8) — é um
  requisito técnico obrigatório para a automação sequer funcionar.
  Decisão confirmada com o usuário: perfil novo, vazio (ele loga na
  LUNA uma vez nesse perfil). O perfil pessoal do Windows nunca mais é
  tocado pelo Fênix — pode ficar aberto ao mesmo tempo, sem conflito.
- EDGE_DEBUG_PORT volta a ser usado de verdade (engine v17): agora que
  o perfil é dedicado, `connect_over_cdp` funciona de forma confiável,
  com o Edge rodando como processo desanexado do Fênix — o navegador
  sobrevive ao fechamento do app, sem precisar de nenhum hack de
  handoff (fechar e reabrir). Ver changelog completo em
  modules/honda/engine.py.

Histórico (v8): EDGE_DEBUG_PORT adicionado mas não usado de fato (v14
do engine tentou `connect_over_cdp` no perfil pessoal e não funcionou
pela restrição acima — só foi possível confirmar a causa raiz depois).

Histórico (v7): REVERTIDO A PEDIDO DO USUÁRIO na época: a v6 havia
trocado DIR_PERFIL_EDGE para um perfil dedicado, mas o usuário preferiu
o perfil pessoal (queria login/sessão do dia a dia reaproveitados).
Essa decisão foi tomada sem saber que o navegador iria, futuramente,
bloquear essa opção por completo — não é mais viável mantê-la.
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

# Perfil DEDICADO do Fênix — não é mais o perfil pessoal do Windows
# (ver changelog v9 acima). Fica dentro de data/, então é criado
# automaticamente e migra junto se a pasta do app for movida/instalada
# em outra máquina. Na primeira execução essa pasta estará vazia — o
# usuário precisa logar na LUNA uma vez, igual um perfil novo de Edge.
DIR_PERFIL_EDGE = os.path.join(DIR_DATA, "edge_profile_fenix")

# Porta de depuração remota usada para o Fênix se conectar ao Edge via
# CDP (connect_over_cdp). Como o perfil agora é dedicado (não-padrão),
# o Edge aceita depuração remota normalmente (ver v9) — o processo do
# Edge é aberto desanexado do Fênix e sobrevive ao fechamento do app.
EDGE_DEBUG_PORT = 9333

DEBUG = False
