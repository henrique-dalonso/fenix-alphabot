/* eslint-disable no-undef */

function isCrossOriginIframeContext() {
  if (window.self === window.top) return false;
  try {
    return window.top.location.origin !== window.location.origin;
  } catch (error) {
    // Accessing window.top.location on cross-origin iframes throws SecurityError.
    return true;
  }
}

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

  try {
    chrome.runtime.sendMessage(
      extId,
      {
        type: 'GET/TOKEN_BY_DOMAIN',
        payload: body,
      },
      (token) => {
        const data = doc9
          ? {
              tk: token,
              uId: doc9?.uId,
              env: doc9?.env,
            }
          : {
              tk: '',
              uId: '',
              env: 'dev',
            };
        const { tk, uId: extensionId, env } = data;
        const titleElement = document._getElementsByXPath(
          "//a[@class='titulo-topo dropdown-toggle titulo-topo-desktop']",
        );
        const processo = (
          titleElement.length > 0 ? titleElement[0].innerText : 'NONE'
        )
          .split('\n')[0]
          .trim();

        const params = `?token=${tk}&extension_id=${extensionId}&processo=${encodeURIComponent(
          processo,
        )}&r=${r}`;
        const baseUrl =
          env === 'dev'
            ? 'https://cloud-dev.doc9.com.br/dev'
            : 'https://cloud.doc9.com.br/api';

        image.src = `${baseUrl}/sign/hash${params}`;
      },
    );
  } catch (error) {
    console.error('>> ERRO AO EXECUTAR O GET/TOKEN_BY_DOMAIN', error);
  }
}

setInterval(() => {
  if (Object.keys(window).includes('PJeOffice') && !window.PJeOffice.whom) {
    
    if (window.location.href.includes('pje/ng2/dev.seam')) {
       const id = window.location.href.split('?ca')[0].split('/').pop();
       const ca = window.location.href.split('ca=')[1].split('&')[0];
       window.location.href = `https://pje.tjes.jus.br/pje/Processo/ConsultaProcesso/Detalhe/listProcessoCompletoAdvogado.seam?id=${id}&ca=${ca}`;
    } else if (window.location.href.includes('pje2g/ng2/dev.seam')) {
      const id = window.location.href.split('?ca')[0].split('/').pop();
      const ca = window.location.href.split('ca=')[1].split('&')[0];
      window.location.href = `https://pje.tjes.jus.br/pje2g/Processo/ConsultaProcesso/Detalhe/listProcessoCompletoAdvogado.seam?id=${id}&ca=${ca}`;
    }
    console.log('>> PJE FUNCTION INTERCEPT');
    PJeOffice.executar = handleIntercept;
    PJeOffice.whom = true;
  }

  if (Object.keys(document).includes('_getElementsByXPath')) {
    if (isCrossOriginIframeContext()) {
      console.warn('Ignorando execução em iframe cross-origin');
      return;
    }
    const inputs = document._getElementsByXPath(
      "//input[contains(@value,'Assinar')]",
    );
    if (inputs.length > 0) {
      const fileInput = inputs[0];
      if (
        !fileInput.hasAttribute('data-whom') ||
        (fileInput && fileInput.value === 'Assinar documento(s)')
      ) {
        console.log('>> PJE BUTTON INTERCEPT', fileInput);
        fileInput.value = 'Assinar documento(s) via WHOM';
        fileInput.setAttribute('data-whom', '');
      }
    }
  }
}, 1000);
