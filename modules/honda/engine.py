"""
modules/honda/engine.py — Motor Honda v24.

Arquitetura: engine é uma Thread persistente.
- Playwright roda SEMPRE na mesma thread (requisito do sync API).
- Browser abre uma vez e fica aberto entre sessões (STOP não fecha) —
  e agora também sobrevive ao fechar o Fênix (Quit), de verdade.
- Play/Stop são eventos de sinalização, não criam novas threads.

Novidades desta versão (v24) — CORREÇÃO DEFINITIVA da causa raiz do
travamento (a v23 regrediu a conexão com o Edge para o modelo manual
do AlphaBot, mas o travamento em si — "quase não funciona, fecha o
tempo todo" — continuava, inclusive fora do Modo de Teste). Comparando
`AlphaBot.py` linha a linha com o Fênix, achei a divergência real:

TODA ação de interação com a página no AlphaBot original — preencher
campo (`preencher_campo`), selecionar banco/tipo (`selecionar_option_
por_valor_ou_texto`), clicar seta (`clicar_seta_luna`) — usa ações
NATIVAS do Playwright: `locator.click()`, `.press()`, `.fill()`,
`.select_option()`, `.wait_for()`. Toda ação nativa do Playwright já
tem timeout embutido e SEGURO: se travar, levanta uma exceção limpa na
MESMA thread, sem drama. O Fênix, em algum ponto da sua reescrita,
trocou isso por `frame.evaluate()` com JavaScript injetado
(`_js_set`/`_js_select`/clique via JS em `_clicar_seta`) — e
`evaluate()` NÃO TEM timeout nativo no Playwright. Foi exatamente por
isso que uma sessão anterior precisou inventar uma thread "sentinela"
pra adivinhar quando travou e matar o processo do Edge à força
(`_evaluate_com_timeout` + `_matar_processo_fenix_edge`) — um
mecanismo que o AlphaBot NUNCA teve porque NUNCA precisou: ele sempre
usou a API certa. Esse mecanismo de emergência, além de frágil (matar
o processo não garante destravar a chamada pendente — ver changelog
v21), transformava toda lentidão momentânea do navegador (não
necessariamente um travamento de verdade) num evento catastrófico:
Edge morto, engine perdido, tudo reiniciado do zero. Essa é a causa
raiz real de toda a instabilidade relatada nesta e nas sessões
anteriores.

1. REESCRITO: `_js_set` → `_preencher_campo` (renomeado), agora usa
   `locator.wait_for(state="visible", timeout=8000)` + `click(force=
   True)` + `press("Control+A")` + `press("Backspace")` + `fill()` —
   cópia exata do `preencher_campo` do AlphaBot. Chamado por
   `_preencher_campos` e `_gravar_marcacao`.
2. REESCRITO em `core/recovery.py` (v2): `_js_select` → `
   _selecionar_option`, agora usa `locator.select_option(value=...)` —
   cópia do `selecionar_option_por_valor_ou_texto` do AlphaBot.
   `_clicar_seta` agora usa `locator.click(force=True)` no lugar de
   `frame.evaluate()` — cópia de `clicar_elemento_por_seletores`.
3. REMOVIDO PARA SEMPRE (deixou de ser necessário — não existe mais
   nenhuma chamada de `evaluate()` sem timeout nativo no caminho de
   preenchimento/interação): `_evaluate_com_timeout`, a thread
   sentinela, `self._travado_ev`/propriedade `travado`,
   `_matar_processo_fenix_edge`, `_pid_por_porta`, e o callback
   `on_engine_travado` + `_engine_travado`/`_substituir_engine_travado`
   em `ui/main_window.py` (v9). Toda essa máquina existia só para
   compensar a ausência de timeout do `evaluate()` — sem ele, não tem
   mais nada para compensar.
4. NOVO: `abrir_pdf` (parâmetro de `play()`, default True) —
   independente do Modo de Teste, réplica do `abrir_pdf_visual_var` do
   AlphaBot original (era um checkbox na versão FINAL de produção do
   AlphaBot, não uma "versão de testes" — ligar/desligar não muda em
   nada o trabalho do robô). `_abrir_pdf_fisicamente` também parou de
   esperar 1.2s artificialmente após o clique — o AlphaBot clica e
   segue imediatamente (`time.sleep(0.01)`); a pausa tinha sido
   introduzida numa sessão anterior sob uma hipótese de causa raiz que
   não era a real (ver item acima).
5. CORRIGIDO: `abrir_edge_debug()` fazia uma requisição HTTP (checar se
   a porta já respondia) ANTES de abrir o Edge — bloqueando a THREAD
   DA UI (Tkinter) por até 2s a cada clique no botão (sempre os 2s
   completos da primeira vez, já que nada escuta a porta ainda antes
   do primeiro Edge aberto). O AlphaBot nunca fazia essa checagem — só
   lançava o processo e seguia. Removida; o botão agora é instantâneo,
   igual ao AlphaBot.

Histórico (v23) — REGRESSÃO ARQUITETURAL DELIBERADA, a
pedido explícito do usuário: as versões v17-v22 foram construindo,
sessão após sessão, uma automação cada vez mais "esperta" na conexão
com o Edge (lançar o processo sozinho, detectar sessão, fazer
auto-login, navegar para a rotina, reconectar e tentar de novo em
loop) — e essa complexidade acabou sendo a própria causa da
instabilidade relatada ("quase não funciona, fecha o tempo todo"), bem
mais divergente do AlphaBot original (que nunca teve esse tipo de
problema) do que deveria. Decisão do usuário: descartar essa camada
inteira e voltar ao modelo simples e comprovado do AlphaBot — o
usuário abre o Edge Debug manualmente, loga, seleciona HONDA e deixa
um caso carregado à mão; o Fênix só assume a partir do Play.

1. REMOVIDO: `_lancar_edge_detached` (lançar o Edge automaticamente),
   `_fazer_login`/`_preencher_login`/`_carregar_credenciais`
   (auto-login com `data/credentials.json`), e toda a navegação
   automática para `ROTINA_LUNA_URL`/`LOGIN_URL` no início de `_sessao`.
   O Fênix nunca mais abre o Edge, faz login ou navega por conta
   própria a partir do Play — réplica exata da filosofia do AlphaBot
   original (`abrir_edge_debug` só lança o processo, nada mais).
2. NOVO: `abrir_edge_debug()` — método chamável direto pela UI (botão
   "Abrir Edge Debug", igual ao AlphaBot), lança o Edge com depuração
   remota no perfil dedicado do Fênix e SÓ ISSO. Não usa Playwright
   (só `subprocess`), então é seguro chamar de qualquer thread, mesmo
   com o engine dormindo.
3. SIMPLIFICADO: `_conectar_edge` agora só tenta conectar via CDP ao
   que já está aberto — sem lançar, sem retry-com-kill-e-relança. Se a
   porta não responder, ou a conexão falhar, `_garantir_browser` para
   o robô com uma mensagem clara pedindo para abrir o Edge Debug e
   preparar a tela manualmente. Nenhuma tentativa automática de
   recuperação nessa etapa.
4. MANTIDO (é exatamente o que o usuário pediu para preservar): a
   lógica de recovery em pleno processamento — `RecoveryManager.
   _inicializar_luna` (seleciona banco/tipo do HONDA e força
   carregamento com seta direita → esquerda) continua sendo usada
   tanto no início de uma sessão (se `_luna_ja_pronta_para_honda`
   detectar que a tela NÃO está pronta — ex: usuário esqueceu de
   selecionar banco/tipo) quanto no meio de um lote, sempre que a LUNA
   resetar/travar (metade do lote, sessão instável etc.) — mesmo
   mecanismo de sempre, só que nunca mais precedido de uma navegação
   ou login automáticos.
5. SIMPLIFICADO: `_matar_processo_fenix_edge` não depende mais de um
   PID lembrado (`self._edge_pid`, removido) — como o Fênix nunca mais
   lança o Edge sozinho, o PID é sempre identificado pela porta de
   depuração (`_pid_por_porta`). Usado só quando um `evaluate()` trava
   de vez (ver `_evaluate_com_timeout`); depois de matar, o Fênix NÃO
   tenta reabrir ou reconectar sozinho — o usuário clica "Abrir Edge
   Debug" de novo, refaz a tela e dá Play.

Histórico (v22) — a v21 detectava corretamente um engine
travado e substituía a instância, mas o log real de produção (usuário
relatou "quase não funciona, fecha o tempo todo", em modo normal E em
Modo de Teste) mostrou que isso não bastava: depois de um travamento,
o ciclo se repetia várias vezes seguidas, incluindo repetidos "Falha ao
conectar via CDP (Timeout 8000ms exceeded)" mesmo com o websocket
tendo conectado (`<ws connected>`). Causa raiz encontrada por análise
do log linha a linha (`logs/fenix.log`, 2026-07-05 12:24–12:28):

1. CORRIGIDO (a causa mais grave — fechava o ciclo "trava → substitui
   engine → reconecta no MESMO Edge quebrado → trava de novo" para
   sempre): `_matar_processo_fenix_edge` se recusava a encerrar
   qualquer processo quando `self._edge_pid` era desconhecido — e isso
   é o caso NORMAL sempre que o Fênix reconecta a um Edge de uma sessão
   anterior em vez de lançar um novo (`_conectar_edge`, caminho "já
   está aberto", visível no log como "Edge do Fênix já está aberto.
   Conectando via CDP..."). Ou seja: na maioria das vezes em que um
   travamento acontecia, o Edge travado NUNCA era realmente encerrado,
   e a reconexão seguinte batia no mesmo processo quebrado. Corrigido:
   `_pid_por_porta` identifica o PID pelo `netstat` na porta de
   depuração dedicada do Fênix (tão seguro quanto o PID lembrado — não
   é por nome de imagem, então o Edge pessoal do usuário nunca é
   afetado) e é usado como fallback sempre que `self._edge_pid` for
   None.
2. CORRIGIDO: `connect_over_cdp` usava `timeout=8_000`, mas o log
   mostra o websocket completando a conexão (`<ws connected>`) e AINDA
   ASSIM estourando esse timeout — 8s não é margem suficiente nesta
   máquina para o Playwright terminar de anexar aos targets depois do
   handshake. Isso disparava kills e reconexões desnecessárias mesmo
   sem nenhum travamento real do navegador. Subiu para 20s.
3. AJUSTADO: `_evaluate_com_timeout` (usado em todo preenchimento de
   campo, com ou sem Modo de Teste — a instabilidade relatada pelo
   usuário "não se limita" ao Modo de Teste) tinha `timeout_s` padrão
   de 8s, provavelmente curto demais para o mesmo ambiente. Subiu para
   15s, reduzindo falsos positivos de "travou" para operações que só
   estavam um pouco lentas.
4. AJUSTADO: pausa após `taskkill` em `_matar_processo_fenix_edge`
   subiu de 1.5s para 3s — dá tempo do Windows liberar de fato o lock
   do perfil (SingletonLock) e todos os processos filhos do Edge
   encerrarem antes da próxima tentativa de abrir/conectar; o log
   mostrou ciclos de "Abrindo Edge... Falha ao conectar via CDP" logo
   em seguida a um kill, consistente com essa corrida.
5. NOVO: `_sessao` agora chama `aceitar_dialog_pendente` logo no início
   (antes de qualquer outra checagem), como suspeitado pelo usuário —
   um dialog "Dados carregados com sucesso!" (ou qualquer outro) que
   tenha ficado pendente ANTES de qualquer listener nosso existir
   bloqueia qualquer ação subsequente na página, inclusive a nova
   checagem `_luna_ja_pronta_para_honda` (item 4 da v21). O handler de
   evento (`page.on("dialog", ...)`) só reage a dialogs que aparecem
   DEPOIS de registrado — não retroage sobre um já pendente; o canal
   CDP bruto usado por `aceitar_dialog_pendente` (`Page.
   handleJavaScriptDialog`) funciona independente disso.

Histórico (v21) — corrigiu o travamento permanente relatado pelo
usuário depois da v20 entrar em produção (log real: `logs/fenix.log`,
sessão de 2026-07-05 ~11:58): um PDF em Modo de
Teste (imagem/scan, sem texto — categorizado corretamente como
FALTANDO ENDERECO, ver nota abaixo) travou o preenchimento durante
`_gravar_marcacao`, o Edge foi encerrado como esperado pela blindagem
de timeout, mas a partir daí o Fênix ficou "rodando" sem fazer nada:
STOP não parava, Play não reabria o Edge, nada acontecia. Só matar o
processo do Fênix inteiro resolvia.

1. CAUSA RAIZ CONFIRMADA: `_evaluate_com_timeout` (v19) presumia que
   matar o processo do Edge por PID sempre destrava a chamada
   `frame.evaluate()` pendente na thread do engine, fazendo-a retornar
   com um erro. Isso NÃO é garantido — um `taskkill /F` não envia um
   close limpo pelo canal CDP, então o Playwright pode nunca perceber
   a conexão perdida, e a chamada síncrona bloqueada trava PARA
   SEMPRE. Como a thread do engine não está num loop nesse ponto — ela
   está parada dentro dessa única chamada —, ela nunca mais volta a
   checar `_play_ev`/`_stop_ev`. Python não tem como interromper de
   fora uma chamada síncrona bloqueada noutra thread, então não existe
   forma de "destravar" essa thread específica a partir de fora.
2. CORRIGIDO: a sentinela de `_evaluate_com_timeout` agora dá uma
   janela curta (5s) depois de matar o Edge para o caminho feliz (a
   chamada retornar com erro); se isso não acontecer, marca
   `self._travado_ev` e notifica a UI via `on_engine_travado`. A UI
   (`ui/main_window.py` v7) abandona essa thread (é daemon — fica
   presa, mas não impede o Fênix de fechar) e cria uma `HondaEngine`
   nova automaticamente, para que o próximo Play funcione normalmente
   (abre um Edge novo do zero) sem precisar reiniciar o Fênix. Mostra
   também o alerta crítico explicando o que aconteceu.
3. CONFIRMADO (não era um bug, mas foi auditado a pedido do usuário):
   a distinção entre "PDF sem informação copiável" (scan/imagem, texto
   vazio → `None` → marca FALTANDO ENDERECO) e "erro de verdade"
   (download falhou, arquivo corrompido, sem páginas → `ERRO_PDF` →
   marca ERRO NO PDF) já existe em `extraction/pdf_text.py` e já
   corresponde exatamente à lógica do `extrair_texto_pdf` do AlphaBot
   original (mesmos três retornos: texto, `None`, `"ERRO_PDF"`). Da
   mesma forma, `_gravar_marcacao` já limpa TODOS os campos antes de
   marcar (corrigido na v16) e já respeita o Modo de Teste. Nenhuma
   mudança foi necessária nesses dois pontos.
4. NOVO: `_luna_ja_pronta_para_honda` — evita recarregar a rotina da
   LUNA à toa sempre que `_luna_pronta` for False (isto é, em todo
   primeiro Play depois de abrir o Fênix, mesmo com o Edge já aberto e
   numa tela perfeitamente válida — sobrevivente de uma sessão
   anterior do Fênix, já que o Edge roda desanexado desde a v17).
   Antes de navegar, verifica SEM navegar se a aba já está na LUNA com
   banco/tipo do HONDA selecionados (não só a presença dos campos de
   resultado — que têm o MESMO name em HONDA e VOLKS, ver
   `settings.LUNA_CAMPOS` — checar só isso arriscaria aproveitar uma
   tela deixada configurada para VOLKS) e um caso carregado; se sim,
   pula direto para o loop de processamento, igual ao caminho de
   STOP → PLAY. Qualquer incerteza cai no fluxo de reinicialização
   completo de sempre (comportamento inalterado nesse caso).

Novidades da versão anterior (v20) — AUDITORIA DE SEGURANÇA (pedido do
usuário: garantir que o Honda pare para revisão manual sempre que
houver qualquer incerteza sobre os dados preenchidos, igual ao
AlphaBot original — nenhuma mudança no fluxo de negócio, só reforço
dos freios de segurança já existentes):

1. CORRIGIDOS dois bugs onde o engine ignorava o retorno de
   `RecoveryManager.executar()` e continuava rodando mesmo com o
   recovery esgotado (3 tentativas falhas): (a) no handler de exceção
   geral de `_processar_um_caso` — antes, um erro inesperado seguido
   de recovery esgotado só logava e tentava o MESMO caso de novo no
   próximo ciclo, indefinidamente e em silêncio; (b) no branch
   RECOVERY de `_gravar_marcacao` (fluxo ERRO NO PDF / FALTANDO
   ENDERECO) — mesmo problema, inconsistente com o fluxo normal de
   gravação, que já tratava esse retorno corretamente. Ambos agora
   param o robô para revisão manual quando o recovery se esgota.
2. NOVO: `_parar_para_revisao_manual(motivo)` — ponto único para toda
   parada de segurança (dados não extraídos com confiança, validação
   pré-GRAVAR falhou, recovery esgotado, timeout de preenchimento,
   sessão expirada, falha ao gravar). Além de logar e parar
   (`_stop_ev.set()`), agora também notifica a UI via callback
   `on_erro_critico` — antes, o único rastro de uma parada de
   segurança era uma linha de log entre várias outras, fácil de passar
   despercebida; a UI (`ui/main_window.py` v6) agora mostra um alerta
   vermelho persistente com o motivo, que só some quando o usuário dá
   Play de novo.
3. REFORÇADO: `_validar_campos_na_tela` (validação pré-GRAVAR) ganhou
   checagem de FORMATO do valor realmente presente na tela (CEP com 8
   dígitos, UF com 2 letras, número em formato válido ou "S/N") —
   paridade com `validar_campos_antes_gravar` do AlphaBot original.
   Segunda camada de defesa: cobre o cenário (improvável, mas possível)
   de um valor residual do caso anterior coincidir com o valor
   esperado na comparação textual, mas ter formato inválido.

Novidades da versão anterior (v19) — CORREÇÃO DA CAUSA RAIZ do console
inundado (a v18 tinha corrigido só um sintoma secundário) + correção
de bug funcional relatados pelo usuário:

1. CORRIGIDO DE VERDADE: `greenlet.error: cannot switch to a different
   thread` + `Task exception was never retrieved: Frame.evaluate: Frame
   was detached`, que a v18 não eliminou. Causa raiz real (agora
   confirmada): `_evaluate_com_timeout` chamava `frame.evaluate()` (uma
   API SÍNCRONA do Playwright) de dentro de uma thread Python auxiliar
   nova a CADA chamada — e a API síncrona do Playwright só pode ser
   usada pela MESMA thread que chamou `sync_playwright()`. Como
   `_js_set`/`_evaluate_com_timeout` roda a cada campo preenchido (ou
   seja, dezenas de vezes por caso), isso deixava um rastro constante
   de chamadas "órfãs" rodando de verdade em segundo plano depois do
   timeout local expirar — cada uma delas, ao resolver mais tarde
   (às vezes só no fechamento do Fênix), tentava retomar uma greenlet
   de uma thread que já não existia mais. Corrigido: `evaluate()`
   agora roda direto na thread do engine (forma correta); uma thread
   "sentinela" externa NÃO chama nada do Playwright — só mata o
   processo do Edge por PID se o tempo estourar, o que já era o
   resultado prático anterior (o engine já parava nesse cenário).
   Ver docstring de `_evaluate_com_timeout` para detalhes.

2. CORRIGIDO (bug funcional): `_gravar_marcacao` (usada nos fluxos
   ERRO NO PDF / FALTANDO ENDERECO) só limpava nome/nome_alt/cpf_cnpj
   antes de gravar a marcação — os demais campos (CEP, estado, cidade,
   bairro, número, complemento) podiam ficar com dados residuais do
   caso anterior. Também ignorava o Modo de Teste, gravando direto sem
   pausar para conferência. Ambos corrigidos: todos os campos são
   limpos antes de marcar, e a pausa de confirmação do Modo de Teste
   agora é respeitada aqui também, igual ao fluxo normal.

Histórico (v18) — correção parcial/insuficiente, mantida por registro:
- CORRIGIDO: console inundado com centenas de repetições de
  `greenlet.error: cannot switch to a different thread (which happens
  to have exited)` ao fechar o Fênix. Causa: o `finally` de `run()`
  chamava `pw.stop()` direto, sem fechar a conexão do `Browser`
  (`self._browser`) antes — isso derrubava a thread interna do driver
  do Playwright de forma abrupta, com listeners/tasks internos ainda
  pendentes (ex: o handler de dialog do `RecoveryManager`), cada um
  deles gerando um erro ao tentar retomar uma greenlet já encerrada.
  Correção: `self._browser.close()` é chamado ANTES de `pw.stop()`,
  dando tempo do Playwright encerrar essas tasks de forma limpa.
  IMPORTANTE — isso é seguro e NÃO fecha o Edge de verdade: pela
  documentação oficial do Playwright, `Browser.close()` num browser
  obtido via `connect_over_cdp` (diferente de um lançado via `launch`)
  apenas limpa os contextos do lado do Playwright e desconecta do
  servidor de depuração — o processo externo (nosso Edge desanexado)
  não é encerrado. A mesma correção foi aplicada em `_fechar_browser`
  (usado em erro de sessão, não só no Quit) por consistência/higiene.

Histórico (v17) — MUDANÇA ESTRUTURAL, validada ao vivo pelo usuário:
- MIGRADO de volta para `connect_over_cdp` com Edge rodando como
  processo DESANEXADO (`subprocess.Popen` com `DETACHED_PROCESS |
  CREATE_NEW_PROCESS_GROUP`), igual ao padrão do AlphaBot original.
  Isso só voltou a ser viável porque o perfil do Edge deixou de ser o
  pessoal do Windows e passou a ser um perfil DEDICADO do Fênix
  (`settings.DIR_PERFIL_EDGE`, ver changelog v9 de `config/settings.py`)
  — a restrição do Chrome/Edge 136+ que bloqueia canais de depuração
  remota (porta ou pipe) só se aplica ao `--user-data-dir` PADRÃO do
  sistema; um diretório dedicado não sofre essa restrição. Confirmado
  com o usuário antes de implementar (ver conversa da sessão).

  O que isso resolve, de vez, sem nenhum hack:
  1. O Edge do Fênix agora SOBREVIVE ao fechamento do app (Quit) —
     não precisa mais fechar e reabrir um Edge "comum" torcendo pra
     restaurar abas (hack da v16, removido — ver changelog v16 abaixo,
     mantido aqui só como histórico). O `finally` de `run()` agora só
     para o driver do Playwright (`pw.stop()`); o processo do Edge,
     por ser desanexado, nem percebe.
  2. Não existe mais checagem/alerta de "Edge já aberto, preciso
     fechar" nem `_matar_processos_edge()` genérico por nome de
     imagem — o perfil do Fênix é isolado do perfil pessoal do
     usuário, então os dois podem ficar abertos ao mesmo tempo sem
     qualquer conflito. Isso elimina uma fricção que sempre incomodou
     (precisar fechar todo o Edge pessoal antes de rodar o bot).
  3. Se algum dia for necessário matar à força o processo do Edge do
     Fênix (ex: ficou zumbi), agora é feito por PID específico
     (`_matar_processo_fenix_edge`), nunca mais por `taskkill /IM
     msedge.exe`, que mataria também o Edge pessoal do usuário — isso
     seria uma regressão grave e não é mais aceitável agora que os
     dois perfis coexistem.

  Nova sequência de conexão (`_conectar_edge`): primeiro verifica se a
  porta de depuração já está respondendo (Edge do Fênix de uma sessão
  anterior, ainda vivo) — se sim, conecta direto, sem abrir um Edge
  novo (permite reaproveitar entre reinícios do Fênix, não só entre
  Play/Stop). Se não, abre o Edge desanexado e aguarda a porta
  responder (até 20s) antes de conectar via `connect_over_cdp`.

  Removido código morto: `_messagebox`/`ctypes` (só existiam para o
  alerta "Edge já aberto", que não faz mais sentido) e `_edge_ja_aberto`
  (checagem genérica de processo, substituída pela checagem de porta).

  TESTADO AO VIVO PELO USUÁRIO E CONFIRMADO: Honda processando casos
  reais, Stop→Play preservando `_luna_pronta`, Edge sobrevivendo a
  fechar/reabrir o Fênix e reconectando na mesma sessão. Único problema
  encontrado: ruído no console ao fechar o Fênix — corrigido na v18
  (ver changelog acima).

Histórico (v16 — hack removido nesta versão, mantido só como registro):
- Handoff do Edge ao fechar o Fênix: fechava o Edge automatizado e
  reabria um Edge "comum" com `--restore-last-session` no mesmo
  perfil pessoal, pra simular persistência. Só existia por causa da
  limitação do perfil pessoal (ver v15) — com o perfil dedicado (v17)
  o problema deixou de existir na raiz, então o hack foi removido por
  completo, junto com `aguardar_encerramento`/`self._encerrado_ev`
  (mantidos por compatibilidade com a UI, mas agora resolvem quase
  instantaneamente, já que não há mais rotina de handoff a esperar).

Histórico (v15):
- REVERTIDA a mudança estrutural da v14 (`connect_over_cdp` +
  `_lancar_edge_detached`): TESTADA AO VIVO pelo usuário e NÃO
  FUNCIONOU — o Edge abria uma aba em branco, nunca navegava para a
  LUNA, e a porta de depuração nunca respondia
  ("O Edge não respondeu na porta de depuração a tempo").

  CAUSA RAIZ CONFIRMADA (pesquisada e verificada, não é suposição):
  desde o Chrome/Edge 136, o navegador BLOQUEIA silenciosamente
  `--remote-debugging-port` quando o `--user-data-dir` aponta para o
  perfil PADRÃO/pessoal do Windows — é uma restrição de segurança
  deliberada (evita que processos automatizados/malware se conectem
  via CDP numa sessão logada de verdade e roubem cookies/senhas). Isso
  significa que `connect_over_cdp` é estruturalmente incompatível com
  o requisito do usuário de usar o perfil PESSOAL do Edge — não existe
  ajuste de código que contorne essa restrição do próprio navegador.
  ESSA CAUSA RAIZ FOI RESOLVIDA NA v17 — o requisito de usar o perfil
  pessoal deixou de existir (decisão revisitada e confirmada com o
  usuário), então a limitação em si não se aplica mais.

  Voltou-se a `launch_persistent_context` (idêntico à v13): funciona
  de forma confiável com o perfil pessoal, ao custo de o Edge fechar
  junto com o Fênix de novo (bug original, reaberto).

- MANTIDO da v14 (não tem relação com a causa raiz acima, é uma
  correção independente e válida): CORRIGIDO Stop → Play refazendo
  banco/tipo/setas do zero, mesmo com a LUNA já inicializada. `_sessao`
  só executa o bloco de navegação + checagem de sessão/login +
  `_inicializar_luna` (seleção de banco/tipo e clique nas setas) na
  PRIMEIRA vez desta conexão de browser, controlado pela flag
  `self._luna_pronta`. Em um Stop → Play subsequente (mesma conexão,
  página intacta), pula direto para o loop de processamento, só
  reatando o handler de dialog do novo `RecoveryManager`.
  `_luna_pronta` é resetado para `False` quando a conexão de browser é
  perdida/recriada (`_garantir_browser`, `_fechar_browser`) ou quando
  uma sessão expirada é detectada em `_processar_um_caso` (força
  reinicialização completa no próximo Play).

Histórico (v14):
- Primeira tentativa de migrar para `connect_over_cdp` com Edge
  desanexado via `subprocess.Popen`. Não funcionou na época — perfil
  pessoal (ver causa raiz na v15). Retomada com sucesso na v17.

Histórico (v13):
- REVERTIDO A PEDIDO DO USUÁRIO (parte da v12): abrir o PDF físico numa
  aba separada não é viável — a conferência visual do usuário depende
  de ver o PDF na MESMA tela, não trocando de aba. `_abrir_pdf_fisicamente`
  voltou a clicar no ícone da LUNA (mesma página), com uma pausa curta
  logo após o clique para dar tempo do PDF começar a carregar. A
  blindagem de timeout real em `_js_set` (`_evaluate_com_timeout`, v12)
  foi MANTIDA como rede de segurança — ainda não há certeza de que a
  causa do travamento relatado era mesmo o PDF pesado bloqueando a
  página (só aconteceu uma vez); se acontecer de novo, o log agora vai
  mostrar um timeout claro em vez de travar mudo, o que finalmente vai
  confirmar ou descartar essa hipótese.
- REVERTIDO A PEDIDO DO USUÁRIO (v6/v11 — restauração de abas do
  Edge): estava gerando abas duplicadas/lixo a cada abertura, pior que
  o problema original. Removidas as flags `--restore-last-session` e
  `--hide-crash-restore-bubble`, e `_consolidar_aba` voltou ao
  comportamento simples e prévio: ao abrir o Edge, vai direto para a
  LUNA e fecha todas as outras abas.

Histórico (v12):
- CORRIGIDO (travamento relatado: engine parava silenciosamente logo
  após abrir o PDF físico no Modo de Teste, sem preencher nada e sem
  erro nenhum no log): a causa mais provável é que clicar no ícone da
  LUNA carregava o PDF dentro do mesmo contexto/página do formulário —
  um PDF grande pode deixar o visualizador ocupado tempo suficiente
  para bloquear a comunicação do Playwright com aquela aba. Duas
  mudanças:
  1. `_abrir_pdf_fisicamente` passou a abrir o PDF numa aba própria e
     isolada — REVERTIDO na v13 (ver acima).
  2. Blindagem geral: `_js_set` agora roda `evaluate()` com um teto de
     tempo real (`_evaluate_com_timeout`, 8s) — o Playwright não impõe
     timeout próprio a `evaluate()`, então se o navegador travar por
     qualquer motivo, antes o engine ficava pendurado pra sempre em
     silêncio. Agora esse tipo de travamento vira um erro claro no log
     e o engine para com segurança, em vez de travar mudo.

Histórico (v11):
- REVERTIDO A PEDIDO DO USUÁRIO (parte do bug 1 da v10): usar o perfil
  pessoal do Edge é intencional, não um bug — o usuário confirmou que
  quer o bot rodando no mesmo perfil/sessão do dia a dia dele. Voltou
  a checagem "há algum msedge.exe aberto?" + o messagebox perguntando
  se pode encerrar, e o kill volta a ser geral (`_matar_processos_edge`),
  já que agora só existe um perfil (o pessoal) para gerenciar. O
  `_messagebox` ganhou as flags `MB_TOPMOST | MB_SETFOREGROUND` para
  garantir que a janela do alerta realmente ganhe foco — antes podia
  abrir atrás da janela do Fênix e passar despercebido.
- CORRIGIDO (a real queixa por trás do bug 1 — perda de abas): a causa
  não era usar o perfil pessoal, e sim o Edge não restaurar as abas de
  forma confiável ao reabrir. `_lancar_context` agora inclui
  `--restore-last-session` + `--hide-crash-restore-bubble`, que forçam
  a restauração silenciosa e determinística das abas da última sessão,
  independente da configuração de "Continuar de onde parou" do Edge ou
  do aviso de fechamento incorreto (que só aparecia às vezes).
- CORRIGIDO (achado adicional): `_consolidar_aba` fechava todas as
  abas do contexto exceto a escolhida para a automação — o que
  destruiria justamente as abas recém-restauradas. Agora ele só
  seleciona a aba da LUNA (ou abre uma aba nova dedicada, se nenhuma
  aba da LUNA estiver entre as restauradas) e nunca fecha as demais.

Histórico (v10):
- CORRIGIDO (bug 2 — fechava o Edge ao fechar o Fênix): `quit()` não
  chama mais `_fechar_browser()` (não fecha mais o contexto
  explicitamente) — o navegador agora deve permanecer aberto ao
  fechar o app, igual ao STOP. `pw.stop()` continua sendo chamado (só
  encerra o processo do driver do Playwright, não deveria fechar o
  Edge em si), com uma pequena pausa de segurança antes — o que também
  deve reduzir/eliminar o erro `EPIPE: broken pipe` que aparecia no
  console ao fechar (causado por uma corrida entre o fechamento do
  contexto e a parada do driver). Este ponto precisa de confirmação
  em teste real — se o Edge do Fênix ainda fechar junto, o próximo
  passo é migrar para `connect_over_cdp` com o Edge rodando como
  processo desanexado (como o AlphaBot original fazia com
  `--remote-debugging-port`), que garante isolamento total do
  processo do navegador em relação ao Fênix.
- CORRIGIDO (bug 3 — sempre refazia login após STOP → PLAY): `_sessao`
  agora navega direto para a rotina da LUNA primeiro e só vai para a
  tela de login se realmente for redirecionado para lá (sessão
  inexistente/expirada). Antes, navegava incondicionalmente para
  LOGIN_URL toda sessão, mesmo com sessão ativa.
- CORRIGIDO (bug 4 — PDF físico abria rápido demais entre casos): a
  pausa de estabilização em `_aguardar_troca_de_caso` (após confirmar
  a troca de caso) subiu de 200ms para 1000ms, e foi adicionada uma
  pausa extra antes de `_abrir_pdf_fisicamente` no próximo caso — dá
  tempo do painel do PDF anterior terminar de fechar visualmente antes
  de abrir o novo, evitando a sobreposição relatada.

Histórico (v9):
- CORRIGIDO (pendência nº1 do FENIX_STATUS.md): após o GRAVAR, o
  engine não tinha nenhuma forma de confirmar que a LUNA realmente
  trocou de caso antes de processar o próximo — a gravação na LUNA é
  assíncrona, então o próximo ciclo do loop podia encontrar a tela
  ainda com os dados do caso recém-gravado e reaproveitá-los por
  engano. Portado o mecanismo de identificador de caso que já existia
  e era comprovado no módulo VOLKS do AlphaBot original
  (identificador_caso_volks / aguardar_proximo_caso_volks), adaptado
  para o Honda: `_identificador_de_onclick`, `_identificador_caso` e
  `_aguardar_troca_de_caso`. O identificador é o path do PDF (onclick
  `abrirPdf(...)`), capturado antes do GRAVAR; depois do GRAVAR, o
  engine só segue para o próximo caso quando esse identificador muda
  na tela ou a fila esvazia. Timeout de segurança de 30s aciona
  recovery se a troca nunca for confirmada. Aplicado tanto ao fluxo
  normal quanto às marcações especiais (ERRO NO PDF / FALTANDO
  ENDERECO) em `_gravar_marcacao`.

Histórico (v8):
- CORRIGIDO: handler de dialog do recovery ficava acumulado entre
  sessões (Play → Stop → Play), já que o Edge/página são reaproveitados
  e o handler antigo nunca era removido. Cada novo Play empilhava mais
  um listener de dialog em cima dos anteriores, causando
  "Cannot accept dialog which is already handled" (handlers de
  sessões passadas competindo pelo mesmo dialog). Agora o handler
  atual é guardado e removido explicitamente antes de registrar um
  novo, a cada sessão.

Histórico (v7):
- Limpa também o campo "valor_nome" (além de "valor_nome2").
- Corrigido bug de handler de dialog duplicado em _clicar_gravar que
  causava ~15-20s de atraso entre o GRAVAR e o próximo caso.
"""

import re
import time
import os
import threading
import subprocess
import urllib.request
from typing import Optional, Callable

from playwright.sync_api import Page, BrowserContext, Browser, sync_playwright

from config import settings
from core.browser import OperacaoCancelada
from core.recovery import RecoveryManager
from core.logger import logger
from extraction.pdf_text import baixar_e_extrair_texto, ERRO_PDF
from extraction.parsers import honda as parser_honda


class HondaEngine(threading.Thread):
    """
    Thread persistente do engine Honda.

    Ciclo de vida:
        __init__ → start() [app inicia]
            → dorme esperando play_event
        play(callbacks, modo_teste=False) → acorda → processa casos → dorme
        stop()          → pausa (browser fica aberto)
        quit()          → encerra thread e fecha browser

    Modo de teste:
        confirmar("gravar") → chamado pela UI quando o usuário
        revisou o caso e autoriza a gravação. Sem essa confirmação,
        o engine nunca clica em GRAVAR.
    """

    def __init__(self):
        super().__init__(daemon=True, name="HondaEngineThread")
        self._play_ev  = threading.Event()
        self._stop_ev  = threading.Event()
        self._quit_ev  = threading.Event()
        self._callbacks: dict = {}
        self._recovery: Optional[RecoveryManager] = None
        self._inicio_caso: Optional[float] = None
        self.casos_processados = 0
        self._pdf_miss_count = 0  # controla mensagem de "sem casos"
        self._pw = None
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None
        self._page: Optional[Page] = None

        # True quando a LUNA já foi navegada, logada e inicializada
        # (banco/tipo/setas) nesta conexão de browser. Permite que um
        # Stop → Play reaproveite a tela exatamente como estava, sem
        # refazer login/seleção de banco e tipo/setas do zero.
        self._luna_pronta = False

        # Handler de dialog da sessão atual — guardado para poder ser
        # removido no início da próxima sessão (evita acúmulo quando o
        # Edge/página são reaproveitados entre Play/Stop/Play).
        self._dialog_handler_atual: Optional[Callable] = None

        # Modo de teste (conferência manual antes de gravar)
        self._modo_teste = False
        self._confirmar_ev = threading.Event()
        self._acao_pendente: Optional[str] = None

        # Abrir o PDF fisicamente para conferência visual — INDEPENDENTE
        # do Modo de Teste (ver changelog v24). Réplica do
        # `abrir_pdf_visual_var` do AlphaBot original: é uma preferência
        # de visualização, não muda em nada o trabalho do robô.
        self._abrir_pdf = True

        # Sinalizado quando o run() termina toda a rotina de
        # encerramento (incluindo o handoff do Edge — ver quit()/run()).
        # A UI espera nele antes de matar o processo de vez, senão a
        # rotina de handoff pode ser interrompida pela metade.
        self._encerrado_ev = threading.Event()

    # -----------------------------------------------------------
    # API para a UI
    # -----------------------------------------------------------
    def play(self, callbacks: dict, modo_teste: bool = False, abrir_pdf: bool = True):
        self._callbacks = callbacks
        self._modo_teste = modo_teste
        self._abrir_pdf = abrir_pdf
        self._stop_ev.clear()
        self._play_ev.set()

    def stop(self):
        self._stop_ev.set()
        # Se estava pausado esperando confirmação, desbloqueia a espera.
        self._confirmar_ev.set()

    def quit(self):
        """Chamado ao fechar o app — encerra thread e faz o handoff do Edge."""
        self._quit_ev.set()
        self._stop_ev.set()
        self._confirmar_ev.set()
        self._play_ev.set()  # desbloqueia o wait

    def aguardar_encerramento(self, timeout: float = 6.0) -> bool:
        """
        Bloqueia (chamado pela UI, thread principal) até o run() terminar
        toda a rotina de encerramento — incluindo fechar o Edge
        automatizado e reabrir um Edge comum no lugar (handoff). Sem
        isso, a UI pode matar o processo do Fênix no meio da rotina,
        antes do Edge comum ser reaberto.
        """
        return self._encerrado_ev.wait(timeout)

    def confirmar(self, acao: str = "gravar"):
        """
        Chamado pela UI (thread principal) quando o usuário revisou o
        caso em modo de teste e decidiu a ação. Único valor tratado
        hoje: "gravar". Qualquer outro valor faz o engine pular a
        gravação desse caso por segurança.
        """
        self._acao_pendente = acao
        self._confirmar_ev.set()

    def _parar_para_revisao_manual(self, motivo: str):
        """
        Interrompe o processamento por segurança sempre que houver
        qualquer incerteza sobre os dados preenchidos ou falha numa
        etapa de validação/recovery — mesma filosofia do AlphaBot
        original (portada de `parar_para_revisao_manual`): qualquer
        divergência ou falha esgotada interrompe o robô para
        conferência manual, em vez de arriscar continuar e gravar (ou
        deixar de gravar) dados incorretos.

        Diferente de um `self._stop_ev.set()` solto, isto também avisa
        a UI via callback (`on_erro_critico`) para exibir um alerta
        visível — sem isso, o único rastro de uma parada de segurança
        ficava perdido no meio do log, e o usuário podia nem perceber
        que o robô parou por um motivo grave.
        """
        logger.erro(f"PARADO PARA REVISÃO MANUAL: {motivo}")
        self._atualizar("on_erro_critico", motivo)
        self._stop_ev.set()

    @property
    def rodando(self) -> bool:
        return self._play_ev.is_set() and not self._stop_ev.is_set()

    # -----------------------------------------------------------
    # Thread principal
    # -----------------------------------------------------------
    def run(self):
        """Roda para sempre até quit(). Playwright vive aqui."""
        pw = sync_playwright().start()
        self._pw = pw

        try:
            while not self._quit_ev.is_set():
                self._play_ev.wait()        # dorme até play()
                if self._quit_ev.is_set():
                    break
                self._stop_ev.clear()

                try:
                    self._sessao(pw)
                except Exception as e:
                    logger.erro(f"Erro na sessão: {e}")
                    self._fechar_browser()
                finally:
                    self._play_ev.clear()
                    self._atualizar("on_status", "parado")
        finally:
            # Sem handoff: o Edge do Fênix roda como processo desanexado
            # (ver _lancar_edge_detached) e não tem nenhuma relação de
            # ciclo de vida com o processo do Fênix ou do Playwright. Ao
            # encerrar, só precisamos parar o DRIVER do Playwright — o
            # Edge em si (processo separado) nem percebe e continua
            # aberto exatamente como estava, pronto pra ser reconectado
            # no próximo Play (mesmo depois de um reinício completo do
            # Fênix).
            #
            # CORREÇÃO (relatado pelo usuário: console inundado de
            # "greenlet.error: cannot switch to a different thread" ao
            # fechar o Fênix): antes, `pw.stop()` era chamado direto,
            # sem fechar a conexão do Browser primeiro. Isso derrubava a
            # thread interna do driver do Playwright de forma abrupta,
            # com vários listeners/tasks internos ainda pendentes (ex:
            # o handler de dialog do RecoveryManager) — cada um deles
            # tentava, ao ser cancelado, retomar uma greenlet que já
            # tinha sido encerrada, gerando um erro por task pendente.
            # A correção é chamar `self._browser.close()` ANTES de
            # `pw.stop()`, dando tempo do Playwright encerrar essas
            # tasks de forma limpa. Isso é seguro e NÃO fecha o Edge de
            # verdade: pela documentação oficial do Playwright,
            # `Browser.close()` em um browser obtido via `connect`/
            # `connect_over_cdp` (ao contrário de um browser lançado via
            # `launch`) apenas limpa os contextos do lado do Playwright
            # e desconecta do servidor de depuração — o processo
            # externo (nosso Edge desanexado) não é encerrado.
            try:
                if self._browser is not None:
                    self._browser.close()
            except Exception:
                pass

            self._browser = None
            self._context = None
            self._page = None

            try:
                pw.stop()
            except Exception:
                pass

            self._encerrado_ev.set()

    # -----------------------------------------------------------
    # Sessão (uma execução Play → Stop)
    # -----------------------------------------------------------
    def _sessao(self, pw):
        logger.info("Honda iniciando...")
        if self._modo_teste:
            logger.info("MODO DE TESTE ativo: PDF será aberto fisicamente e nenhuma gravação ocorrerá sem sua confirmação.")
        self._atualizar("on_status", "iniciando")

        if not self._garantir_browser(pw):
            return

        # Remove o handler de dialog de uma sessão anterior, se ainda
        # estiver preso na página (acontece quando o Edge é reaproveitado
        # entre Play/Stop/Play). Sem isso, os handlers se acumulam e cada
        # dialog é processado por handlers de sessões antigas + a atual
        # ao mesmo tempo, causando "Cannot accept dialog which is already
        # handled" no console a cada novo Play.
        if self._dialog_handler_atual is not None:
            try:
                self._page.remove_listener("dialog", self._dialog_handler_atual)
            except Exception:
                pass
            self._dialog_handler_atual = None

        self._recovery = RecoveryManager(self._stop_ev, modulo="HONDA")

        # Limpa qualquer dialog que tenha ficado pendente na página ANTES
        # de qualquer listener nosso existir (ex: "Dados carregados com
        # sucesso!" disparado no meio de uma navegação/reconexão anterior,
        # sem ninguém registrado pra aceitar). `aceitar_dialog_pendente`
        # usa o canal CDP bruto (`Page.handleJavaScriptDialog`), que
        # funciona mesmo sem um listener de `page.on("dialog", ...)`
        # registrado — diferente do handler de evento, que só reage a
        # dialogs que aparecem DEPOIS de ele existir. Sem isso, um dialog
        # preso bloqueia qualquer ação subsequente na página (inclusive
        # a checagem abaixo) até travar por completo.
        self._recovery.aceitar_dialog_pendente(self._page)

        if not self._luna_pronta:
            # Réplica do AlphaBot original: o Fênix NUNCA navega, faz
            # login ou seleciona banco/tipo por conta própria no início
            # de uma sessão — isso é trabalho do usuário, feito
            # manualmente no Edge Debug (botão "Abrir Edge Debug")
            # antes de clicar Play. O engine só assume a partir da tela
            # em que a aba já estiver.
            handler_recovery = self._recovery.criar_handler_dialog("Honda")
            self._page.on("dialog", handler_recovery)
            self._dialog_handler_atual = handler_recovery

            if self._luna_ja_pronta_para_honda(self._page):
                # A aba já está na LUNA com HONDA selecionado e um caso
                # carregado — exatamente como o usuário deixou. Nada a
                # fazer, só começar a processar.
                logger.sucesso("LUNA já está pronta com HONDA carregado — iniciando processamento.")
            else:
                # Tela não está pronta (banco/tipo errado, ou caso não
                # carregado) — mesmo mecanismo que a LUNA já precisa no
                # meio de um lote (metade do lote, tela resetada etc.):
                # seleciona banco/tipo do HONDA e força o carregamento
                # com seta direita → esquerda. Não navega para nenhuma
                # URL — trabalha em cima da aba que já está aberta.
                logger.info("Preparando a tela da LUNA (banco/tipo e carregamento do caso)...")
                if not self._recovery._inicializar_luna(self._page):
                    if not self._recovery.executar(self._page, "falha na inicialização"):
                        self._parar_para_revisao_manual(
                            "Não consegui preparar a tela da LUNA (banco/tipo/carregamento). "
                            "Confira se você está logado e na rotina certa no Edge Debug."
                        )
                        return

            self._luna_pronta = True
        else:
            # STOP → PLAY na mesma conexão: a tela já está exatamente
            # como ficou quando pausamos — não navega, não refaz login,
            # não reseleciona banco/tipo/setas. Só reata o handler de
            # dialog (novo RecoveryManager desta sessão).
            handler_recovery = self._recovery.criar_handler_dialog("Honda")
            self._page.on("dialog", handler_recovery)
            self._dialog_handler_atual = handler_recovery
            logger.sucesso("Retomando sessão já inicializada da LUNA — pulando login e seleção de banco/tipo.")

        while not self._stop_ev.is_set() and not self._quit_ev.is_set():
            self._processar_um_caso(self._page)

        logger.info("Honda encerrada. Edge permanece aberto.")

    def _luna_ja_pronta_para_honda(self, page: Page) -> bool:
        """
        Verifica, SEM navegar, se a aba já está na LUNA com o banco/tipo
        do HONDA selecionados e a tela de um caso carregada. Usado para
        decidir se dá pra pular a reinicialização completa (navegar +
        checar login + selecionar banco/tipo + forçar carregamento)
        quando o Edge já chega pronto — por exemplo, sobrevivente de
        uma sessão anterior do Fênix (perfil dedicado, processo
        desanexado — ver `_conectar_edge`) ou deixado aberto
        manualmente pelo usuário já na tela certa.

        Confere banco/tipo (não só a presença dos campos de resultado)
        de propósito: os campos de caso (`valor_grupo_cota`,
        `valor_resultado_*`) têm o MESMO name para HONDA e VOLKS (ver
        `settings.LUNA_CAMPOS`) — sem checar banco/tipo, uma tela
        deixada configurada para VOLKS passaria despercebida como
        "pronta" e o Honda processaria casos em cima da seleção errada.
        Qualquer falha ao ler a tela retorna False (mais seguro cair no
        fluxo de reinicialização completo, já testado, do que arriscar
        aproveitar um estado incerto).
        """
        try:
            url_atual = (page.url or "").lower()
            if "paschoalotto" not in url_atual or "gelogin" in url_atual:
                return False
        except Exception:
            return False

        cfg = settings.MODULOS_LUNA.get("HONDA", {})
        banco_esperado = cfg.get("banco_value", "")
        tipo_esperado = cfg.get("tipo_value", "")

        banco_ok = False
        for frame in page.frames:
            try:
                loc = frame.locator(settings.LUNA_SELETORES["banco"]).first
                if loc.count() > 0 and loc.input_value(timeout=2_000) == banco_esperado:
                    banco_ok = True
                    break
            except Exception:
                continue
        if not banco_ok:
            return False

        tipo_ok = False
        for frame in page.frames:
            try:
                loc = frame.locator(settings.LUNA_SELETORES["tipo"]).first
                if loc.count() > 0 and loc.input_value(timeout=2_000) == tipo_esperado:
                    tipo_ok = True
                    break
            except Exception:
                continue
        if not tipo_ok:
            return False

        return self._recovery._tela_ja_processada(page)

    # -----------------------------------------------------------
    # Browser
    # -----------------------------------------------------------
    def abrir_edge_debug(self):
        """
        Réplica direta e LITERAL do botão "Abrir Edge Debug" do AlphaBot
        original: só abre o Edge com depuração remota ativa no perfil
        dedicado do Fênix. NADA MAIS — nenhuma navegação, login ou
        seleção de banco/tipo automática, e (CORRIGIDO — causava a UI
        travar por até 2s a cada clique) nenhuma checagem de porta
        antes de abrir. O AlphaBot nunca checava nada: só lançava o
        processo e seguia. `subprocess.Popen` retorna na hora; a
        checagem daqui (`_porta_debug_ativa`, uma requisição HTTP com
        timeout de 2s) rodava na THREAD PRINCIPAL DA UI (Tkinter),
        travando a janela inteira por até 2s a cada clique — sempre os
        2s completos na primeira vez, já que não há nada escutando a
        porta ainda. O usuário faz login, entra na rotina, seleciona
        HONDA e deixa um caso carregado manualmente; só então clica
        Play. Chamado direto pela UI (thread principal), não usa
        Playwright — só `subprocess`, então é seguro chamar de qualquer
        thread.
        """
        edge_path = next((c for c in settings.EDGE_CAMINHOS if os.path.exists(c)), None)
        if not edge_path:
            logger.erro("Edge não encontrado nos caminhos padrão.")
            return

        try:
            subprocess.Popen(
                [
                    edge_path,
                    f"--remote-debugging-port={settings.EDGE_DEBUG_PORT}",
                    f"--user-data-dir={settings.DIR_PERFIL_EDGE}",
                    "--start-maximized",
                    "--no-first-run",
                    "--no-default-browser-check",
                ],
                creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                close_fds=True,
            )
            logger.sucesso(
                "Edge Debug iniciado. Faça login, selecione HONDA e deixe um "
                "caso carregado na LUNA antes de clicar Play."
            )
        except Exception as e:
            logger.erro(f"Erro ao abrir Edge Debug: {e}")

    def _garantir_browser(self, pw) -> bool:
        if self._context is not None:
            try:
                _ = self._context.pages
                logger.info("Reutilizando Edge já aberto.")
                self._page = self._consolidar_aba(self._context)
                return self._page is not None
            except Exception:
                logger.info("Conexão anterior com o Edge foi perdida. Reconectando...")
                self._browser = None
                self._context = None
                self._page = None
                self._dialog_handler_atual = None
                self._luna_pronta = False

        browser = self._conectar_edge(pw)
        if browser is None:
            self._parar_para_revisao_manual(
                "Edge Debug não está aberto (ou não respondeu). Clique em "
                "'Abrir Edge Debug', faça login, selecione HONDA e deixe um "
                "caso carregado na LUNA antes de dar Play."
            )
            return False

        if not browser.contexts:
            self._parar_para_revisao_manual(
                "Conectei ao Edge Debug, mas não encontrei nenhuma aba aberta."
            )
            return False

        self._browser = browser
        self._context = browser.contexts[0]
        self._page = self._consolidar_aba(self._context)
        return self._page is not None

    def _conectar_edge(self, pw) -> Optional[Browser]:
        """
        Conecta via CDP ao Edge Debug que o usuário já abriu manualmente
        (botão "Abrir Edge Debug" / `abrir_edge_debug`). Réplica do
        AlphaBot original: o Fênix NUNCA abre o Edge, faz login ou
        navega por conta própria a partir do Play — só conecta ao que
        já está aberto. Se a porta não responder, quem chamou decide
        como avisar o usuário (mensagem clara, sem tentativa de abrir
        ou reconectar sozinho).
        """
        if not self._porta_debug_ativa():
            logger.erro(
                f"Edge Debug não está respondendo na porta {settings.EDGE_DEBUG_PORT}."
            )
            return None

        try:
            # 20s: o log real de produção mostrou o handshake completar
            # ("<ws connected>") e MESMO ASSIM estourar um timeout de
            # 8s — 8s não é margem suficiente nesta máquina para o
            # Playwright terminar de anexar aos targets depois do
            # websocket conectar.
            return pw.chromium.connect_over_cdp(
                f"http://localhost:{settings.EDGE_DEBUG_PORT}", timeout=20_000
            )
        except Exception as e:
            logger.erro(f"Não foi possível conectar ao Edge Debug via CDP: {e}")
            return None

    def _porta_debug_ativa(self) -> bool:
        try:
            url = f"http://localhost:{settings.EDGE_DEBUG_PORT}/json/version"
            with urllib.request.urlopen(url, timeout=2) as resp:
                return resp.status == 200
        except Exception:
            return False

    def _consolidar_aba(self, context: BrowserContext) -> Optional[Page]:
        """Escolhe a aba da LUNA e fecha todas as demais abas do contexto."""
        abas = context.pages
        if not abas:
            return context.new_page()
        aba = next((a for a in abas if "paschoalotto" in (a.url or "")), abas[0])
        for a in abas:
            if a != aba:
                try:
                    a.close()
                except Exception:
                    pass
        return aba

    def _fechar_browser(self):
        """
        Usado em caso de erro na sessão — fecha a CONEXÃO do Playwright
        com o Edge (não o processo do Edge, que fica órfão dessa
        conexão e continua aberto — ver nota em `Browser.close()` no
        `finally` de `run()`). Sem fechar a conexão antes de descartar
        a referência, os listeners internos dela (ex: handler de
        dialog) ficam pendurados até o garbage collector agir, o que
        pode causar comportamento inesperado numa reconexão logo em
        seguida.
        """
        try:
            if self._browser is not None:
                self._browser.close()
        except Exception:
            pass

        self._browser = None
        self._context = None
        self._page = None
        self._dialog_handler_atual = None
        self._luna_pronta = False

    # -----------------------------------------------------------
    # Identificador de caso (transição pós-GRAVAR)
    # -----------------------------------------------------------
    # Portado do módulo VOLKS do AlphaBot original
    # (identificador_caso_volks / aguardar_proximo_caso_volks), que já
    # resolvia exatamente este problema lá. Nunca havia sido portado
    # para o Honda no Fênix — ver histórico no FENIX_STATUS.md, seção 2.
    def _identificador_de_onclick(self, onclick: Optional[str]) -> Optional[str]:
        if not onclick:
            return None
        match = re.search(r"abrirPdf\('(.*?)'\)", onclick)
        if match:
            return "PDF:" + str(match.group(1)).strip()
        return "ONCLICK:" + str(onclick).strip()

    def _identificador_caso(self, page: Page) -> Optional[str]:
        """Reconsulta a tela agora (usado durante a espera pós-GRAVAR)."""
        try:
            onclick = self._encontrar_pdf_onclick(page)
        except Exception:
            onclick = None
        ident = self._identificador_de_onclick(onclick)
        if ident:
            return ident
        try:
            return "URL:" + str(page.url or "").strip()
        except Exception:
            return None

    def _aguardar_troca_de_caso(self, page: Page, identificador_anterior: Optional[str], timeout_s: int = 30) -> bool:
        """
        Bloqueia logo após um GRAVAR bem-sucedido até confirmar que a
        LUNA realmente avançou para o próximo caso (identificador do
        onclick do PDF mudou) ou que a fila esvaziou. Sem isso, o
        próximo ciclo do loop pode encontrar a tela ainda com os dados
        do caso recém-gravado (a gravação na LUNA é assíncrona) e
        processar o próximo caso com dados errados.

        Retorna True se a troca foi confirmada (ou a fila esvaziou),
        False se o tempo esgotou sem confirmação (nesse caso um
        recovery é acionado por segurança).
        """
        self._atualizar("on_status", "aguardando troca de caso")
        inicio = time.time()

        while time.time() - inicio < timeout_s:
            if self._stop_ev.is_set() or self._quit_ev.is_set():
                return False

            try:
                if self._fila_vazia(page):
                    logger.info("Fila esvaziou após o GRAVAR. Prosseguindo.")
                    return True
                atual = self._identificador_caso(page)
            except Exception:
                atual = None

            if atual and identificador_anterior and atual != identificador_anterior:
                logger.info("Troca de caso confirmada pela LUNA. Prosseguindo.")
                # 1000ms (era 200ms): dá tempo do painel do PDF anterior
                # terminar de fechar visualmente antes do próximo caso
                # tentar abrir um novo PDF por cima (bug relatado: overlap
                # entre o PDF antigo fechando e o novo abrindo).
                self._aguardar(1_000)
                return True

            time.sleep(0.15)

        logger.aviso(
            "Tempo esgotado aguardando a LUNA trocar de caso após o GRAVAR. "
            "Por segurança, vou forçar um recovery antes de continuar."
        )
        if not self._recovery.executar(page, "timeout aguardando troca de caso pós-GRAVAR"):
            self._parar_para_revisao_manual(
                "A LUNA não confirmou a troca de caso após o GRAVAR, e o recovery esgotou as tentativas."
            )
        return False

    # -----------------------------------------------------------
    # Processamento de um caso
    # -----------------------------------------------------------
    def _processar_um_caso(self, page: Page):
        self._inicio_caso = time.time()
        self._recovery.limpar_flags()

        try:
            if self._fila_vazia(page):
                if self._pdf_miss_count == 0:
                    logger.aviso("Nenhum caso na fila Honda. Aguardando...")
                self._pdf_miss_count += 1
                self._aguardar(5_000)
                return

            self._pdf_miss_count = 0
            if self._sessao_expirou(page):
                self._luna_pronta = False
                self._parar_para_revisao_manual("Sessão da LUNA expirada. Faça login novamente.")
                return

            self._recovery.aceitar_dialog_pendente(page)

            self._atualizar("on_status", "processando")

            if self._recovery.recovery_pendente:
                self._recovery.limpar_flags()
                if not self._recovery.executar(page, "dialog pendente"):
                    self._parar_para_revisao_manual("Recovery esgotado após dialog pendente inesperado.")
                    return

            if not self._recovery._tela_ja_processada(page):
                if not self._recovery.executar(page, "tela não pronta"):
                    self._parar_para_revisao_manual("Recovery esgotado: a tela da LUNA não carregou os campos esperados.")
                    return

            if self._watchdog(page):
                return

            self._atualizar("on_pdf", "buscando")
            onclick = self._encontrar_pdf_onclick(page)
            if not onclick:
                self._pdf_miss_count += 1
                if self._pdf_miss_count == 1:
                    logger.aviso("Nenhum caso encontrado na fila. Aguardando...")
                elif self._pdf_miss_count % 20 == 0:
                    logger.info(f"Ainda aguardando casos... ({self._pdf_miss_count} verificações)")
                self._aguardar(3_000)
                return

            self._pdf_miss_count = 0

            # Identificador do caso atual, capturado agora (onclick recém
            # localizado) — usado depois do GRAVAR para confirmar que a
            # LUNA realmente trocou de caso antes de seguir para o próximo.
            identificador_atual = self._identificador_de_onclick(onclick)

            match = re.search(r"abrirPdf\('(.*?)'\)", onclick)
            if not match:
                logger.erro("URL do PDF não reconhecida.")
                return

            pdf_path = match.group(1)
            grupo_cota = self._extrair_grupo_cota(pdf_path)
            logger.info(f"GRUPO/COTA: {grupo_cota} | PDF: {pdf_path}")

            if self._abrir_pdf:
                self._abrir_pdf_fisicamente(page)

            self._verificar_stop()
            if self._watchdog(page):
                return

            self._atualizar("on_pdf", "baixando")
            texto_pdf = baixar_e_extrair_texto(settings.BASE_URL + pdf_path)

            if texto_pdf == ERRO_PDF:
                self._gravar_marcacao(page, grupo_cota, "ERRO NO PDF", identificador_atual)
                return
            if texto_pdf is None:
                self._gravar_marcacao(page, grupo_cota, "FALTANDO ENDERECO", identificador_atual)
                return

            dados = parser_honda.extrair_dados(texto_pdf)
            if not dados:
                self._parar_para_revisao_manual(
                    f"Não foi possível extrair os dados do PDF com segurança (GRUPO/COTA: {grupo_cota})."
                )
                return

            self._atualizar("on_pdf", "ok")
            logger.info(
                f"Dados: {dados['endereco']}, {dados['numero']} | "
                f"{dados['bairro']} | {dados['cidade']}/{dados['estado']} | {dados['cep']}"
            )

            self._verificar_stop()
            self._atualizar("on_campos", "preenchendo")
            if not self._preencher_campos(page, grupo_cota, dados):
                return

            self._atualizar("on_campos", "preenchidos")
            if self._watchdog(page):
                return

            if not self._validar_campos_na_tela(page, grupo_cota, dados):
                return

            self._atualizar("on_campos", "validados")

            if self._modo_teste:
                acao = self._aguardar_confirmacao(page)
                if acao is None:
                    return  # STOP acionado enquanto aguardava conferência
                if acao != "gravar":
                    logger.aviso(f"Ação '{acao}' não reconhecida em modo de teste — caso não será gravado.")
                    return

            self._atualizar("on_gravar", "gravando")

            resultado = self._clicar_gravar(page)

            if resultado is True:
                self.casos_processados += 1
                self._atualizar("on_gravar", "sucesso")
                logger.sucesso(f"Caso gravado. Total sessão: {self.casos_processados}\n")
                self._aguardar_troca_de_caso(page, identificador_atual)
            elif resultado == "RECOVERY":
                self._atualizar("on_gravar", "recovery")
                if not self._recovery.executar(page, "alerta pós-GRAVAR"):
                    self._parar_para_revisao_manual("Recovery esgotado após alerta pós-GRAVAR.")
            else:
                self._parar_para_revisao_manual(f"Falha ao clicar em GRAVAR (GRUPO/COTA: {grupo_cota}).")

        except Exception as e:
            logger.erro(f"Erro inesperado: {e}")
            try:
                recovery_ok = self._recovery.executar(page, f"erro: {e}")
            except Exception:
                recovery_ok = False
            if not recovery_ok:
                # BUG CORRIGIDO: antes, o retorno de `executar()` era
                # ignorado aqui — se o recovery esgotasse as 3
                # tentativas após um erro inesperado, o engine não
                # parava, apenas aguardava 2s e tentava o mesmo caso
                # de novo no próximo ciclo do loop, indefinidamente e
                # em silêncio (sem nunca alertar o usuário). Agora,
                # recovery esgotado após erro inesperado sempre para
                # o robô para revisão manual, igual a todo outro ponto
                # onde o recovery é usado.
                self._parar_para_revisao_manual(f"Recovery esgotado após erro inesperado: {e}")
            self._aguardar(2_000)

    # -----------------------------------------------------------
    # Sessão expirada / fila vazia
    # -----------------------------------------------------------
    def _fila_vazia(self, page: Page) -> bool:
        for frame in page.frames:
            try:
                loc = frame.locator(settings.LUNA_SELETORES["total"]).first
                if loc.count() > 0:
                    val = loc.input_value(timeout=2_000).strip()
                    return val == "0" or val == ""
            except Exception:
                continue
        return False

    def _sessao_expirou(self, page: Page) -> bool:
        try:
            url = page.url or ""
            if "gelogin" in url or ("login" in url.lower() and "paschoalotto" in url):
                return True
        except Exception:
            pass
        return False

    # -----------------------------------------------------------
    # PDF
    # -----------------------------------------------------------
    def _encontrar_pdf_onclick(self, page: Page) -> Optional[str]:
        for frame in page.frames:
            try:
                el = frame.locator(settings.LUNA_SELETORES["botao_pdf"]).first
                if el.count() > 0:
                    onclick = el.get_attribute("onclick")
                    if onclick:
                        return onclick
            except Exception:
                continue
        return None

    def _abrir_pdf_fisicamente(self, page: Page) -> bool:
        """
        Clica no ícone do PDF na própria LUNA para conferência visual —
        réplica exata de `encontrar_botao_pdf` (ramo `abrir_visualmente`)
        do AlphaBot original: clica e segue IMEDIATAMENTE, sem esperar o
        PDF terminar de carregar. Controlado pelo checkbox "Abrir PDF
        para conferência" (`self._abrir_pdf`), independente do Modo de
        Teste — no AlphaBot isso era assim na versão final de produção,
        sem nenhuma diferença no trabalho do robô.

        HISTÓRICO: uma sessão anterior introduziu uma pausa de 1.2s
        aqui, sob a hipótese de que o PDF pesado carregando "na mesma
        página" travaria a próxima chamada do Playwright — e construiu
        uma blindagem inteira (`_evaluate_com_timeout` + kill do Edge)
        em cima dessa hipótese. A causa raiz real era outra (ver
        changelog v24 do arquivo): `_preencher_campo` usava
        `frame.evaluate()` sem timeout nativo. Corrigido isso, a pausa
        artificial aqui deixou de ter função — removida, igual ao
        AlphaBot (`time.sleep(0.01)`, ou seja, nenhuma espera real).
        """
        for frame in page.frames:
            try:
                el = frame.locator(settings.LUNA_SELETORES["botao_pdf"]).first
                if el.count() > 0:
                    el.click(force=True, timeout=3_000)
                    logger.info("PDF aberto para conferência visual.")
                    return True
            except Exception:
                continue
        logger.aviso("Não consegui abrir o PDF fisicamente. A extração automática segue normalmente.")
        return False

    def _extrair_grupo_cota(self, pdf_path: str) -> str:
        m = re.search(r"lido_ok_(.*?)_CONTRATO", pdf_path, re.IGNORECASE)
        if not m:
            return ""
        return m.group(1).replace("_", " ")

    def _tratar_pdf_ausente(self, page: Page):
        try:
            for frame in page.frames:
                try:
                    texto = parser_honda.normalizar(
                        frame.inner_text("body", timeout=2_000) or ""
                    )
                    if "DOCUMENTO JA VERIFICADO" in texto or "JA FOI VERIFICADO" in texto:
                        self._recovery.executar(page, "documento já verificado")
                        return
                except Exception:
                    continue
        except Exception:
            pass
        logger.aviso("PDF não encontrado. Tentando no próximo ciclo.")

    # -----------------------------------------------------------
    # Preenchimento via JS
    # -----------------------------------------------------------
    def _preencher_campos(self, page: Page, grupo_cota: str, dados: dict) -> bool:
        self._verificar_stop()
        # Limpa os dois campos possíveis de nome do cliente — nem todo
        # contrato exibe os dois; _preencher_campo não faz nada (rápido)
        # se o campo não existir na tela.
        self._preencher_campo(page, settings.LUNA_CAMPOS["nome"], "")
        self._preencher_campo(page, settings.LUNA_CAMPOS["nome_alt"], "")
        self._preencher_campo(page, settings.LUNA_CAMPOS["cpf_cnpj"], "")
        self._preencher_campo(page, settings.LUNA_CAMPOS["grupo_cota"],
                     parser_honda.normalizar(grupo_cota, preservar_ponto=True))
        self._aguardar(800)

        numero = "S/N" if str(dados.get("numero","")).strip() == "0" else dados["numero"]

        mapa = {
            settings.LUNA_CAMPOS["cep"]:         dados["cep"],
            settings.LUNA_CAMPOS["estado"]:       dados["estado"],
            settings.LUNA_CAMPOS["cidade"]:       dados["cidade"],
            settings.LUNA_CAMPOS["bairro"]:       dados["bairro"],
            settings.LUNA_CAMPOS["endereco"]:     dados["endereco"],
            settings.LUNA_CAMPOS["numero"]:       numero,
            settings.LUNA_CAMPOS["complemento"]:  dados.get("complemento", ""),
        }

        for name, valor in mapa.items():
            if self._watchdog(page):
                return False
            self._verificar_stop()
            self._preencher_campo(page, name, parser_honda.normalizar(valor))
            self._aguardar(100)

        return True

    def _preencher_campo(self, page: Page, name: str, valor: str) -> bool:
        """
        Preenche um campo da LUNA via locator NATIVO do Playwright —
        réplica exata do `preencher_campo` do AlphaBot original: espera
        o campo ficar visível, clica, seleciona tudo e apaga (Ctrl+A +
        Backspace) e preenche com `.fill()`.

        CORREÇÃO DEFINITIVA (causa raiz do travamento permanente
        relatado pelo usuário — "quase não funciona, fecha o tempo
        todo"): a implementação anterior (`_js_set`, removida) usava
        `frame.evaluate()` com JavaScript injetado para setar o valor e
        disparar os eventos manualmente. O Playwright NÃO impõe nenhum
        timeout próprio a `evaluate()` — foi por isso que o Fênix
        precisou inventar uma thread "sentinela" para adivinhar quando
        travou e matar o processo do Edge à força (`_evaluate_com_timeout`
        + `_matar_processo_fenix_edge`, ambos removidos), um mecanismo
        inteiro que o AlphaBot NUNCA teve porque nunca precisou: ações
        nativas do Playwright (`click`, `press`, `fill`, `wait_for`) já
        têm timeout embutido e seguro — se travarem, levantam uma
        exceção limpa na MESMA thread, sem sentinela, sem matar
        processo, sem perder o estado do engine. Divergir dessa API foi
        a causa raiz de toda a instabilidade desta sessão; usar a
        mesma API do AlphaBot elimina o problema pela raiz, não só o
        sintoma.
        """
        try:
            if self._stop_ev.is_set():
                return False
            for frame in page.frames:
                try:
                    locator = frame.locator(f'input[name="{name}"]').first
                    if locator.count() == 0:
                        continue

                    locator.wait_for(state="visible", timeout=8_000)
                    if self._stop_ev.is_set():
                        return False
                    locator.click(force=True)
                    if self._stop_ev.is_set():
                        return False
                    locator.press("Control+A")
                    locator.press("Backspace")
                    if self._stop_ev.is_set():
                        return False
                    locator.fill(str(valor))
                    return True
                except Exception:
                    continue
            return False
        except Exception as e:
            logger.erro(f"Erro ao preencher o campo '{name}': {e}")
            return False

    # -----------------------------------------------------------
    # Validação pré-GRAVAR
    # -----------------------------------------------------------
    def _validar_campos_na_tela(self, page: Page, grupo_cota: str, dados: dict) -> bool:
        numero = "S/N" if str(dados.get("numero","")).strip() == "0" else dados.get("numero","")
        esperados = {
            settings.LUNA_CAMPOS["grupo_cota"]: grupo_cota,
            settings.LUNA_CAMPOS["cep"]:        dados["cep"],
            settings.LUNA_CAMPOS["estado"]:     dados["estado"],
            settings.LUNA_CAMPOS["cidade"]:     dados["cidade"],
            settings.LUNA_CAMPOS["bairro"]:     dados["bairro"],
            settings.LUNA_CAMPOS["endereco"]:   dados["endereco"],
            settings.LUNA_CAMPOS["numero"]:     numero,
        }
        erros = []
        for campo, esperado in esperados.items():
            pp = campo == settings.LUNA_CAMPOS["grupo_cota"]
            valor_tela = self._ler_campo(page, campo)
            if valor_tela is None:
                erros.append(f"{campo}: não encontrado")
                continue
            nt = parser_honda.normalizar(valor_tela, preservar_ponto=pp)
            ne = parser_honda.normalizar(esperado, preservar_ponto=pp)
            if not nt:
                erros.append(f"{campo}: vazio")
                continue

            # Checagem de formato (paridade com o `validar_campos_antes_gravar`
            # do AlphaBot original): valida o valor que REALMENTE está na
            # tela, não só se ele bate com o esperado. Segunda camada de
            # defesa — cobre o cenário em que um valor residual do caso
            # anterior, por coincidência, seria igual ao esperado (não
            # detectável pela comparação acima) mas tem formato inválido.
            if campo == settings.LUNA_CAMPOS["cep"] and not re.fullmatch(r"\d{8}", nt):
                erros.append(f"{campo}: CEP com formato inválido ('{nt}')")
                continue
            if campo == settings.LUNA_CAMPOS["estado"] and not re.fullmatch(r"[A-Z]{2}", nt):
                erros.append(f"{campo}: UF com formato inválido ('{nt}')")
                continue
            if campo == settings.LUNA_CAMPOS["numero"] and not (
                re.fullmatch(r"\d+[A-Z]?", nt) or nt == "S/N"
            ):
                erros.append(f"{campo}: número com formato inválido ('{nt}')")
                continue

            if ne and nt != ne:
                erros.append(f"{campo}: tela='{nt}' esperado='{ne}'")

        if erros:
            logger.erro("Validação pré-GRAVAR FALHOU:")
            for e in erros:
                logger.erro(f"  - {e}")
            self._parar_para_revisao_manual(
                f"Validação pré-GRAVAR falhou (GRUPO/COTA: {grupo_cota}) — "
                "os campos na tela não batem com os dados extraídos do PDF."
            )
            return False

        logger.info("Validação pré-GRAVAR aprovada.")
        return True

    def _ler_campo(self, page: Page, name: str) -> Optional[str]:
        for frame in page.frames:
            try:
                loc = frame.locator(f'input[name="{name}"]').first
                if loc.count() > 0:
                    return loc.input_value(timeout=3_000)
            except Exception:
                continue
        return None

    # -----------------------------------------------------------
    # Confirmação manual (modo de teste)
    # -----------------------------------------------------------
    def _aguardar_confirmacao(self, page: Page) -> Optional[str]:
        """
        Bloqueia (verificando STOP) até a UI chamar confirmar(). Nunca
        clica em GRAVAR sem essa confirmação explícita quando o modo
        de teste está ativo.
        """
        self._confirmar_ev.clear()
        self._acao_pendente = None
        logger.info(
            "MODO DE TESTE: aguardando sua conferência. Revise o PDF e os "
            "campos preenchidos na LUNA e clique em 'Confirmar e Gravar' no Fênix."
        )
        self._atualizar("on_gravar", "aguardando")

        while not self._confirmar_ev.is_set():
            if self._stop_ev.is_set() or self._quit_ev.is_set():
                logger.info("STOP acionado enquanto aguardava sua conferência.")
                return None
            time.sleep(0.1)

        return self._acao_pendente

    # -----------------------------------------------------------
    # Gravação
    # -----------------------------------------------------------
    def _clicar_gravar(self, page: Page):
        """
        Dialogs esperados:
          1. "Confirma a gravação..." → confirmacao
          2. "Dados gravados com sucesso" → sucesso

        O handler local abaixo NÃO chama dialog.accept() — a sessão já
        tem um handler global (self._dialog_handler_atual) registrado,
        que é o único responsável por aceitar qualquer dialog da
        página. O handler local só observa e classifica.
        """
        alertas = []

        def on_dialog(dialog):
            try:
                tipo = self._recovery._classificar_dialog(dialog.message)
                if tipo == "recovery":
                    self._recovery._recovery_pendente = True
                logger.info(f"Alerta GRAVAR ({tipo}): {dialog.message[:80]}")
                alertas.append((tipo, dialog.message))
            except Exception as e:
                logger.erro(f"Erro ao classificar alerta de gravação: {e}")

        def avaliar() -> Optional[bool]:
            if any(t == "recovery" for t, _ in alertas):
                return "RECOVERY"
            if any(t in ("bloqueio", "sessao", "erro") for t, _ in alertas):
                return False
            if any(t == "sucesso" for t, _ in alertas):
                return True
            return None

        def aguardar_alerta(segundos) -> Optional[bool]:
            inicio = time.time()
            while time.time() - inicio < segundos:
                if self._stop_ev.is_set():
                    return False
                page.wait_for_timeout(200)
                r = avaliar()
                if r is not None:
                    return r
            return None

        try:
            botao = None
            for frame in page.frames:
                try:
                    loc = frame.locator(
                        'input[value="GRAVAR"], input[value="Gravar"], '
                        'input[onclick="jsGravarDados()"], input[id="botao"]'
                    ).first
                    if loc.count() > 0:
                        botao = loc
                        break
                except Exception:
                    continue

            if botao is None:
                logger.erro("Botão GRAVAR não encontrado.")
                return False

            page.on("dialog", on_dialog)
            botao.wait_for(state="visible", timeout=8_000)
            self._aguardar(250)
            self._verificar_stop()

            botao.click(force=True)
            logger.info("GRAVAR clicado.")

            resultado = aguardar_alerta(15)
            if resultado is not None:
                return resultado

            logger.aviso("Alerta pós-GRAVAR tardio. Tentando dialog pendente...")
            self._recovery.aceitar_dialog_pendente(page)
            resultado = aguardar_alerta(5)
            if resultado is not None:
                return resultado

            if not alertas:
                logger.info("Nenhum alerta após GRAVAR. Seguindo fluxo.")
                return True

            r = avaliar()
            return r if r is not None else False

        except Exception as e:
            logger.erro(f"Erro ao clicar em GRAVAR: {e}")
            return False
        finally:
            try:
                page.remove_listener("dialog", on_dialog)
            except Exception:
                pass

    # -----------------------------------------------------------
    # Marcações especiais
    # -----------------------------------------------------------
    def _gravar_marcacao(self, page: Page, grupo_cota: str, marcacao: str, identificador_atual: Optional[str] = None):
        """
        Grava uma marcação especial (ERRO NO PDF / FALTANDO ENDERECO)
        quando o PDF não pôde ser lido com segurança.

        CORRIGIDO (relatado pelo usuário): antes, esta função só
        limpava nome/nome_alt/cpf_cnpj e escrevia grupo_cota + a
        marcação no campo de endereço — os demais campos (CEP, estado,
        cidade, bairro, número, complemento) podiam ficar com dados
        RESIDUAIS do caso anterior, já que nunca eram limpos nem
        sobrescritos aqui. Agora todos os campos usados no fluxo normal
        são explicitamente limpos primeiro, igual a `_preencher_campos`
        faz para o caso normal.

        Também respeita o Modo de Teste agora: antes, o gravar era
        acionado direto, ignorando a pausa de conferência — usuário
        relatou que o robô gravou mesmo com o Modo de Teste ativo.
        """
        for campo in (
            "nome", "nome_alt", "cpf_cnpj",
            "cep", "estado", "cidade", "bairro",
            "numero", "complemento",
        ):
            self._preencher_campo(page, settings.LUNA_CAMPOS[campo], "")

        self._preencher_campo(page, settings.LUNA_CAMPOS["grupo_cota"],
                     parser_honda.normalizar(grupo_cota, preservar_ponto=True))
        self._preencher_campo(page, settings.LUNA_CAMPOS["endereco"],
                     parser_honda.normalizar(marcacao))

        if self._modo_teste:
            acao = self._aguardar_confirmacao(page)
            if acao is None:
                return  # STOP acionado enquanto aguardava conferência
            if acao != "gravar":
                logger.aviso(f"Ação '{acao}' não reconhecida em modo de teste — caso não será gravado.")
                return

        resultado = self._clicar_gravar(page)
        if resultado is True:
            self.casos_processados += 1
            logger.sucesso(f"Caso gravado como '{marcacao}'.")
            self._aguardar_troca_de_caso(page, identificador_atual)
        elif resultado == "RECOVERY":
            # BUG CORRIGIDO: o retorno de `executar()` era ignorado
            # aqui — se o recovery esgotasse as 3 tentativas após um
            # alerta pós-GRAVAR neste fluxo (ERRO NO PDF / FALTANDO
            # ENDERECO), o engine seguia para o próximo caso em
            # silêncio, sem nunca parar para revisão manual, ao
            # contrário do fluxo normal em `_processar_um_caso` (que
            # já checava esse retorno corretamente).
            if not self._recovery.executar(page, f"recovery após {marcacao}"):
                self._parar_para_revisao_manual(
                    f"Recovery esgotado após gravar marcação '{marcacao}'."
                )
        else:
            self._parar_para_revisao_manual(f"Falha ao gravar marcação '{marcacao}'.")

    # -----------------------------------------------------------
    # Utilitários
    # -----------------------------------------------------------
    def _watchdog(self, page: Page) -> bool:
        if not self._inicio_caso or not self._recovery:
            return False
        return self._recovery.tratar_watchdog(page, time.time() - self._inicio_caso)

    def _verificar_stop(self):
        if self._stop_ev.is_set():
            raise OperacaoCancelada("STOP.")

    def _aguardar(self, ms: int):
        fim = time.time() + ms / 1000
        while time.time() < fim:
            if self._stop_ev.is_set() or self._quit_ev.is_set():
                return
            time.sleep(0.05)

    def _atualizar(self, evento: str, valor: str):
        cb = self._callbacks.get(evento)
        if callable(cb):
            try:
                cb(valor)
            except Exception:
                pass

