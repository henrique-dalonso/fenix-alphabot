# FÊNIX — STATUS DO PROJETO
> Atualizado ao final desta sessão de desenvolvimento. Este documento substitui qualquer `FENIX_STATUS.md` anterior no Project Knowledge. Escrito para que outra instância de Claude (ou outro engenheiro) assuma o projeto sem nenhuma conversa prévia.
>
> **Nota sobre a sessão anterior:** o `FENIX_STATUS.md` anterior descrevia como pendência crítica um bloqueio do Chrome/Edge 136+ contra `connect_over_cdp`/`launch_persistent_context` no perfil pessoal do Windows. **Essa pendência já foi resolvida** (ver `config/settings.py` v9, changelog "MUDANÇA ESTRUTURAL DEFINITIVA"): o Fênix passou a usar um perfil dedicado (`data/edge_profile_fenix`), rodando o Edge como processo desanexado (`subprocess.Popen` com `DETACHED_PROCESS`). Isso já está testado ao vivo com casos reais da Honda (ver seção 1). O `.md` anterior estava desatualizado em relação ao código real — o código, não o `.md`, é sempre a fonte de verdade.

---

## 1. ESTADO ATUAL

### O que já está funcionando e testado (com casos reais da Honda)

| Funcionalidade | Status | Observação |
|---|---|---|
| Abrir/controlar o Edge via `connect_over_cdp`, perfil dedicado do Fênix, processo desanexado | ✅ Funciona, testado | Sobrevive ao fechar o Fênix. Log real (`logs/fenix.log`, 2026-07-05) mostra dezenas de casos gravados com sucesso em sequência. |
| Verificação de sessão ativa antes de logar | ✅ Funciona, testado | Vai direto para a rotina da LUNA e só loga se for de fato redirecionado. |
| Auto-login | ✅ Funciona, testado | Login automático confirmado no log real. |
| Processamento normal (PDF com texto → preencher → validar → GRAVAR) | ✅ Funciona, testado | Múltiplos casos reais gravados com sucesso em sequência no log. |
| Identificador de caso pós-GRAVAR (`_aguardar_troca_de_caso`) | ✅ Funciona, testado | Confirma a troca de caso na LUNA antes de seguir para o próximo. |
| STOP → PLAY na mesma conexão de Edge (`_luna_pronta`) | ✅ Funciona, testado | Log mostra "Retomando sessão já inicializada da LUNA — pulando login e seleção de banco/tipo." |
| Modo de Teste (abre PDF fisicamente, pausa antes de GRAVAR, exige confirmação manual) | ✅ Funciona, testado | Confirmado no log: PDF aberto, pausa, confirmação, GRAVAR. |
| Categorização ERRO NO PDF vs FALTANDO ENDERECO vs dados não extraídos | ✅ Correto, auditado nesta sessão | `extraction/pdf_text.py` distingue "erro de download/leitura" (`ERRO_PDF`) de "PDF válido mas sem texto — scan/imagem" (`None`) — mesma lógica de três retornos do `extrair_texto_pdf` do AlphaBot original. Confirmado por leitura de código, não precisou de correção. |
| Limpeza de campos antes de marcar ERRO NO PDF / FALTANDO ENDERECO | ✅ Correto, auditado nesta sessão | `_gravar_marcacao` já limpa TODOS os campos (nome, nome_alt, cpf_cnpj, cep, estado, cidade, bairro, numero, complemento) antes de escrever a marcação — corrigido numa sessão anterior (changelog v16), confirmado ainda presente e correto. |
| Validação pré-GRAVAR (dados extraídos vs dados na tela) | ✅ Funciona, testado, reforçada nesta sessão | Log mostra "Validação pré-GRAVAR aprovada" em todos os casos. Nesta sessão ganhou checagem extra de formato (CEP 8 dígitos, UF 2 letras, número válido) como segunda camada de defesa. |
| Parada de segurança visível na UI (alerta vermelho persistente) | ⚠️ Implementado nesta sessão, **não testado ao vivo ainda** | Ver seção 2 — precisa validação do usuário. |
| Recuperação automática de engine travado (thread presa numa chamada bloqueada do Playwright) | ⚠️ Implementado nesta sessão, **não testado ao vivo ainda** | Ver seção 2 — é a correção do bug relatado nesta sessão, mas ainda não foi validada em produção. |
| Pular reinicialização da LUNA quando o Edge já está pronto no HONDA | ⚠️ Implementado nesta sessão, **não testado ao vivo ainda** | Ver seção 2. |
| Módulo Volks | ❌ Não implementado | `modules/volks/__init__.py` continua vazio. |
| Empacotamento `.exe` / portabilidade | ❌ Não iniciado | |

### Versão atual de cada arquivo principal

| Arquivo | Versão (docstring interno) | Estado nesta sessão |
|---|---|---|
| `app.py` | sem número de versão no cabeçalho | Não alterado |
| `config/settings.py` | v9 | Não alterado |
| `core/logger.py` | sem número de versão no cabeçalho | Não alterado |
| `core/browser.py` | sem número de versão no cabeçalho | Não alterado |
| `core/icon_loader.py` | sem número de versão no cabeçalho | Não alterado |
| `core/recovery.py` | sem número de versão no cabeçalho | Não alterado |
| `modules/honda/engine.py` | **v21** (era v19 no início desta sessão) | **Alterado** — ver seção 3 |
| `modules/volks/__init__.py` | — | Vazio, não implementado |
| `ui/theme.py` | v2 | Não alterado |
| `ui/components.py` | v4 | Não alterado |
| `ui/main_window.py` | **v7** (era v5 no início desta sessão) | **Alterado** — ver seção 3 |
| `extraction/pdf_text.py` | sem número de versão no cabeçalho | Não alterado (auditado, sem necessidade de correção) |
| `extraction/parsers/honda.py` | sem número de versão no cabeçalho | Não alterado |
| `assets/*` | — | Não alterado |
| `data/credentials.json` | — | Não alterado. Texto puro, sem criptografia — decisão explícita do usuário em sessão anterior. |

> Nota: vários arquivos (`app.py`, `core/logger.py`, `core/browser.py`, `core/icon_loader.py`, `core/recovery.py`, `extraction/pdf_text.py`, `extraction/parsers/honda.py`) nunca declararam um número de versão dentro do próprio docstring — diferente de `engine.py`, `settings.py`, `theme.py`, `components.py` e `main_window.py`, que trazem "vN" explícito no cabeçalho. Números de versão citados para esses arquivos em `.md`s anteriores não são verificáveis no código atual; esta versão do status só afirma o que está de fato escrito no arquivo.

### Estrutura de pastas atual (sem mudanças estruturais nesta sessão)

```
Fenix/
├── app.py
├── FENIX_STATUS.md
├── config/
│   ├── __init__.py
│   ├── settings.py           ← v9
│   └── credentials.json      ← duplicata legada, o real está em data/
├── core/
│   ├── __init__.py
│   ├── browser.py            ← OperacaoCancelada + SessaoBrowser (possivelmente órfã)
│   ├── icon_loader.py
│   ├── logger.py
│   └── recovery.py
├── data/
│   ├── credentials.json      ← usado de fato (settings.DIR_DATA)
│   └── edge_profile_fenix/   ← perfil dedicado do Edge (settings.DIR_PERFIL_EDGE)
├── extraction/
│   ├── __init__.py
│   ├── pdf_text.py
│   └── parsers/
│       ├── __init__.py
│       └── honda.py
├── modules/
│   ├── __init__.py
│   ├── honda/
│   │   ├── __init__.py
│   │   └── engine.py         ← v21
│   └── volks/
│       └── __init__.py       ← vazio, não implementado
├── ui/
│   ├── __init__.py
│   ├── components.py
│   ├── main_window.py        ← v7
│   └── theme.py
├── assets/
│   ├── gerar_icones.py
│   ├── icons/
│   └── imgs/
└── logs/
    └── fenix.log
```

---

## 2. PENDÊNCIA ATUAL

### Bug relatado pelo usuário e corrigido nesta sessão (precisa validação ao vivo)

**Sintoma relatado:** durante um caso com PDF sem texto (imagem/scan — categorizado corretamente como FALTANDO ENDERECO), em Modo de Teste, o robô "travou, detectou um erro, não preencheu nada e fechou o navegador. Continuou rodando, mas sem fazer nada, ficou parado." STOP não parava de verdade (log mostrava "finalizando tarefa atual" mas nada acontecia depois), e um novo Play não reabria o Edge nem fazia nada.

**Diagnóstico, confirmado pelo `logs/fenix.log` real (sessão de 2026-07-05, ~11:58):**

```
[11:58:35] GRUPO/COTA: 46377.464.0.0
[11:58:35] PDF aberto fisicamente para conferência.
[11:58:45] evaluate() não respondeu em 8s — encerrando o Edge para destravar o engine.
[11:58:45] Encerrando o processo do Edge do Fênix (PID 37680)...
[11:58:46] Processo encerrado.
[11:59:04] STOP solicitado — finalizando tarefa atual...
        (nenhum log depois disso — nunca mais nenhuma linha do engine)
[11:59:17] Encerrando o Fênix...
```

Sequência real dos eventos:
1. PDF sem texto (scan) → `baixar_e_extrair_texto` retorna `None` → engine chama `_gravar_marcacao(..., "FALTANDO ENDERECO", ...)` corretamente (categorização já estava certa, não é o bug).
2. `_gravar_marcacao` limpa os campos via `_js_set`, que chama `frame.evaluate()` dentro de `_evaluate_com_timeout`. Como o PDF foi aberto fisicamente NA MESMA página (Modo de Teste — decisão intencional do usuário, ver histórico do `engine.py`), um PDF pesado pode deixar o renderer da página ocupado tempo suficiente para travar `evaluate()`.
3. A sentinela de `_evaluate_com_timeout` (v19) detectou o travamento em 8s e matou o processo do Edge por PID — isso funcionou como esperado.
4. **O bug:** a v19 presumia que matar o processo sempre destrava a chamada `frame.evaluate()` pendente, fazendo-a retornar com erro. Isso NÃO é garantido — `taskkill /F` não envia um close limpo pelo canal CDP, e o Playwright pode nunca perceber a conexão perdida. A chamada síncrona ficou bloqueada PARA SEMPRE na thread do engine. Como essa thread não estava num loop (estava parada dentro dessa única chamada), ela nunca mais voltou a checar `_play_ev`/`_stop_ev` — STOP e Play pararam de ter qualquer efeito, porque a única thread do engine nunca mais executou uma linha de código.

**Causa raiz:** Python não tem como interromper de fora uma chamada síncrona bloqueada rodando noutra thread. Depois desse tipo de travamento, a thread do `HondaEngine` fica permanentemente presa, e não existe forma de "recuperá-la" — só de abandoná-la.

**Correção aplicada nesta sessão** (`modules/honda/engine.py` v21 + `ui/main_window.py` v7):
- A sentinela de `_evaluate_com_timeout` agora dá uma janela extra de 5s depois de matar o Edge; se a chamada ainda não retornou, marca `self._travado_ev` e notifica a UI via callback `on_engine_travado`.
- A UI, ao receber esse callback, abandona a thread presa (ela é daemon — não impede o Fênix de fechar, só fica parada, inofensiva) e cria uma `HondaEngine` nova automaticamente, restaura o botão Play e mostra um alerta vermelho explicando o que aconteceu.

**Por que isso ainda é uma "pendência" e não um item fechado:** a correção foi implementada e o código compila, mas **não foi exercida com um travamento real ainda** — não há como simular de forma confiável, num teste automatizado, um PDF que trava o renderer do Chromium por 13+ segundos. A validação real só acontece na próxima vez que um PDF pesado travar o preenchimento em produção. Se a UI reagir como esperado (alerta aparece, Play volta a funcionar, abre um Edge novo), o item pode ser fechado.

**Limitação residual conhecida (não resolvida, aceita como trade-off):** quando esse travamento acontece, a thread antiga do engine fica presa para sempre (vazamento de 1 thread + possivelmente 1 processo driver do Playwright órfão, por ocorrência). Isso é inofensivo em termos de corretude (threads são daemon, não impedem o Fênix de fechar) mas não é "limpo". Uma correção definitiva exigiria rodar o Playwright num processo separado (não uma thread) para poder matá-lo de fora no nível do SO — mudança de arquitetura maior, fora do escopo desta sessão.

### O que já foi tentado e por que não resolveu (nesta sessão)

Nenhuma tentativa alternativa foi descartada nesta sessão — o diagnóstico foi direto a partir da leitura do log real e do código de `_evaluate_com_timeout`, sem necessidade de tentativa e erro.

### Hipótese alternativa considerada e descartada

Cheguei a considerar mover a abertura física do PDF para uma aba separada (eliminando de vez o risco de a página do formulário travar) — isso já foi tentado e revertido em sessões anteriores (ver changelog v12/v13 do `engine.py`) a pedido do usuário, porque a conferência visual precisa ser na MESMA tela. Não revertida nem re-proposta nesta sessão porque a correção do travamento (item acima) já resolve a consequência mais grave (o Fênix ficar irrecuperável) sem precisar mexer nessa decisão já tomada pelo usuário duas vezes. Se o travamento em si (o Edge ficar temporariamente sem resposta e precisar ser reiniciado) continuar incomodando na prática, vale reabrir essa conversa — mas isso é uma decisão do usuário, não foi tomada aqui.

---

## 3. DECISÕES TOMADAS NESTA SESSÃO

### O que mudou e por quê

1. **Dois bugs de segurança corrigidos em `modules/honda/engine.py`** (parte do pedido inicial do usuário: auditar o Honda contra o AlphaBot original e garantir que o robô pare para revisão manual em qualquer divergência): em dois pontos (handler de exceção geral de `_processar_um_caso`, e o branch RECOVERY de `_gravar_marcacao`), o código chamava `RecoveryManager.executar()` mas ignorava o retorno — se o recovery esgotasse as 3 tentativas, o engine continuava rodando (num caso, tentando o mesmo caso quebrado indefinidamente) em vez de parar, ao contrário do comportamento do AlphaBot original. Corrigido: ambos os pontos agora param o robô para revisão manual quando o recovery se esgota.
2. **Novo método único `_parar_para_revisao_manual(motivo)`**, usado em todo ponto de parada de segurança (dados não extraídos com confiança, validação pré-GRAVAR falhou, recovery esgotado, timeout de preenchimento, sessão expirada, falha ao gravar). Além de parar o engine, notifica a UI via `on_erro_critico`.
3. **Alerta vermelho persistente na UI** (`ui/main_window.py`) para toda parada de segurança — antes, o único rastro era uma linha de log entre várias outras.
4. **Validação pré-GRAVAR reforçada** com checagem de formato (CEP 8 dígitos, UF 2 letras, número válido ou "S/N") do valor realmente presente na tela — paridade com `validar_campos_antes_gravar` do AlphaBot original.
5. **Correção do travamento permanente relatado pelo usuário** (ver seção 2 para detalhes técnicos completos): sentinela de `_evaluate_com_timeout` agora detecta quando o engine ficou irrecuperavelmente preso e a UI substitui a instância automaticamente.
6. **`_luna_ja_pronta_para_honda`**: evita recarregar a rotina da LUNA à toa sempre que o Fênix é aberto e o Edge já está numa tela válida do HONDA (sobrevivente de uma sessão anterior, já que o Edge roda desanexado desde a v17) — pedido explícito do usuário nesta sessão. Verifica banco/tipo selecionados (não só a presença dos campos de resultado, que têm o mesmo `name` em HONDA e VOLKS) antes de decidir pular a reinicialização, para não arriscar aproveitar uma tela deixada configurada para outro módulo.

### Regras da "bíblia" original quebradas

Não aplicável — não tenho acesso ao `AlphaBot_Biblia_do_Projeto.md` nesta sessão (rodando fora do Claude web/Project Knowledge). Nenhuma regra foi conscientemente quebrada; todas as mudanças foram auditadas contra o comportamento real do `AlphaBot.py` (arquivo de código, não a bíblia) e, onde divergiam, a lógica do AlphaBot foi a referência adotada.

### Decisões que dependem de confirmação do usuário

1. **Validar ao vivo os três itens implementados nesta sessão** (recuperação automática de engine travado, alerta crítico na UI, skip de reinicialização quando o Edge já está pronto) — nenhum dos três foi exercido em produção ainda.
2. **Limitação residual do travamento** (thread presa abandonada por ocorrência, ver seção 2): aceitável por ora, ou o usuário prefere priorizar uma correção arquitetural mais profunda (Playwright em processo separado) antes de seguir para outras prioridades?

---

## 4. PRÓXIMO PASSO PLANEJADO

1. Rodar o Honda em produção (Modo de Teste e modo normal) e confirmar que:
   a. Um travamento real de `evaluate()` (se acontecer de novo) dispara o alerta crítico e substitui o engine automaticamente, sem precisar matar o processo do Fênix.
   b. Abrir o Fênix com o Edge de uma sessão anterior ainda aberto numa tela válida do HONDA e dar Play pula a reinicialização (log deve mostrar "Edge já estava na LUNA com HONDA carregado — pulando reinicialização.").
   c. As paradas de segurança (validação pré-GRAVAR, recovery esgotado, etc.) mostram o alerta vermelho na UI corretamente.
2. Se o travamento de `evaluate()` continuar acontecendo com frequência incômoda na prática (não só nesse caso isolado), reabrir com o usuário a conversa sobre abrir o PDF físico numa aba separada da automação (ver "Hipótese alternativa considerada e descartada" na seção 2) — isso eliminaria a causa do travamento pela raiz, ao custo de mudar a experiência visual de conferência que o usuário já rejeitou duas vezes antes.
3. Módulo Volks: revisar a lógica de OCR/Tesseract do AlphaBot original antes de escrever algo novo (ainda não iniciado).
4. Empacotamento `.exe` (PyInstaller é a sugestão mais provável, ainda não decidido formalmente).

---

## 5. ARQUIVOS QUE MUDARAM NESTA SESSÃO

| Arquivo | Versão anterior → atual | Precisa substituir no Project Knowledge? |
|---|---|---|
| `modules/honda/engine.py` | v19 → v21 | Sim |
| `ui/main_window.py` | v5 → v7 | Sim |
| `FENIX_STATUS.md` | — | Sim — substituir agora |

Nenhum outro arquivo foi alterado nesta sessão (`extraction/pdf_text.py` e `core/recovery.py` foram lidos e auditados, mas não precisaram de nenhuma mudança).
