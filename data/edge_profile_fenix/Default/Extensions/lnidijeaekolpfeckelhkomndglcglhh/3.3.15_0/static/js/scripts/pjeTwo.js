/* eslint-disable no-undef */

function handleIntercept(requisicao, onSucesso, onErro, onIndisponivel) {
  var t = requisicao.tarefa;
  var r;
  if (window.location.href.includes('pe.tjmg.jus.br')) {
    requisicao.tarefa = JSON.stringify(t);
    r = JSON.stringify(requisicao);
  } else {
    requisicao.tarefa = PJeOffice.stringify(t);
    r = PJeOffice.stringify(requisicao);
  }
  r = encodeURIComponent(r);

  var image = new Image();
  image.onload = function () {
    // Quando o PJeOffice retornar uma imagem com 2px de largura e pq houve algum erro na execucao
    if (this.width === 2) {
      onErro();
    } else {
      // Quando o PJeOffice retornar uma imagem com 1px de largura e pq houve sucesso na execucao
      onSucesso();
    }
  };
  image.onerror = onIndisponivel;

  const doc9 = localStorage.getItem('doc9')
    ? JSON.parse(localStorage.getItem('doc9'))
    : {};
  const sessions = doc9?.sessions ?? {};

  const body = JSON.stringify({
    href: window.location.href,
    sessions,
  });

  const extId = localStorage.getItem('whom-extension-id');

  // Extrai o número do processo do título da página
  const titleElement = document._getElementsByXPath(
    "//a[@class='titulo-topo dropdown-toggle titulo-topo-desktop']",
  );
  const processo =
    titleElement && titleElement.length > 0 && titleElement[0].innerText
      ? titleElement[0].innerText.split('\n')[0].trim()
      : 'NONE';

  console.log('>> PROCESSO EXTRAÍDO:', processo);

  // Passo 1: busca o token correto para o domínio atual
  chrome.runtime.sendMessage(
    extId,
    { type: 'GET/TOKEN_BY_DOMAIN', payload: body },
    (token) => {
      const uId = doc9?.uId ?? '';
      const params = `?token=${encodeURIComponent(token ?? '')}&extension_id=${encodeURIComponent(uId)}&processo=${encodeURIComponent(processo)}&r=${r}`;

      // Passo 2: service worker faz a chamada HTTP e retorna o data: URL
      // (necessário pois a CSP da página bloqueia chamadas diretas ao cloud.doc9.com.br)
      chrome.runtime.sendMessage(
        extId,
        { type: 'GET/RESPONSE_HASH', payload: { params } },
        (res) => {
          console.log('>> RESPOSTA DO GET/RESPONSE_HASH:', res);
          if (!res) {
            console.error('>> RESPOSTA UNDEFINED, VERIFICAR SERVICE WORKER');
            onErro();
            return;
          }
          image.src = res;
          console.log('>> HASH ASSINADA COM SUCESSO');
        },
      );
    },
  );
}

setInterval(() => {
  if (Object.keys(window).includes('PJeOffice') && !window.PJeOffice.whom) {
    console.log('>> PJE 2 FUNCTION INTERCEPT');
    PJeOffice.executar = handleIntercept;
    PJeOffice.whom = true;
  }

  if (Object.keys(document).includes('_getElementsByXPath')) {
    const inputs = document._getElementsByXPath(
      "//input[contains(@value,'Assinar')]",
    );
    if (inputs.length > 0) {
      const fileInput = inputs[0];
      if (
        !fileInput.hasAttribute('data-whom') ||
        (fileInput && fileInput.value === 'Assinar documento(s)')
      ) {
        console.log('>> PJE 2 BUTTON INTERCEPT', fileInput);
        fileInput.value = 'Assinar documento(s) via WHOM';
        fileInput.setAttribute('data-whom', '');
      }
    }
  }
}, 1000);
