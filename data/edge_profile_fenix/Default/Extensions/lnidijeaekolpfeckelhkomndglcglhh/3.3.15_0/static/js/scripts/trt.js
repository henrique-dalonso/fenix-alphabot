(() => {
  const data = localStorage.getItem('doc9');
  if (data) {
    const props = JSON.parse(data);
    const { env, extensionId, token } = props;

    function log(...message) {
      console.log(`${new Date().toISOString()} [Content-Script] `, ...message);
    }

    function getElementByXpath(path, doc) {
      try {
        if (!doc) doc = document;
        return doc.evaluate(
          path,
          doc,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        ).singleNodeValue;
      } catch (err) {
        log(`Erro ao executar o getElementByXpath: ${err}`);
        return null;
      }
    }

    const open = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      log('Interceptando URL: ', method, url);
      const baseUrl =
        env === 'dev'
          ? 'https://cloud-dev.doc9.com.br/dev' : env === 'stg' 
          ? 'https://cloud-stg.doc9.com.br/stg'
          : 'https://cloud.doc9.com.br/api';
      const queryParams = `token=${encodeURIComponent(
        token,
      )}&extension_id=${encodeURIComponent(extensionId)}`;
      if (
        [
          'https://127.0.0.1:9000/assinarHash',
          'https://127.0.0.1:9001/assinarHash',
        ].some((u) => `${url}`.includes(u))
      ) {
        const processElement = getElementByXpath(
          "//div[@class='propertyView' and ./div[contains(text(),'Processo')]]/div[2]/text()",
        );
        const process = processElement
          ? processElement.textContent?.trim()
          : 'NONE';
        const params = `/sign/hash/shodo?${queryParams}&processo=${process}`;
        url = baseUrl + params;
      } else if (
        ['127.0.0.1:9001/versao', '127.0.0.1:9000/versao'].some((u) =>
          `${url}`.includes(u),
        )
      ) {
      } else if (
        ['127.0.0.1:9000/v2/certificado', '127.0.0.1:9001/v2/certificado'].some(
          (u) => `${url}`.includes(u),
        )
      ) {
        const processo = document
          .querySelector('.ng-star-inserted div h4 span')
          ?.innerText.split(' ')
          .at(-1);
        const params = `/sign/hash/cert?format=shodo&${queryParams}&processo=${processo}`;
        url = baseUrl + params;
      } else if (`${url}`.includes('localhost:8800/pjeOffice/requisicao')) {
        log('PJE OFFICE: ', method, url);
      } else if (
        ['127.0.0.1:9000/certificado', '127.0.0.1:9001/certificado'].some((u) =>
          `${url}`.includes(u),
        )
      ) {
        const processo = document
          .querySelector('.ng-star-inserted div h4 span')
          ?.innerText.split(' ')
          .at(-1);
        const params = `/sign/hash/cert?format=shodo&${queryParams}&processo=${encodeURIComponent(
          processo ?? '',
        )}`;
        url = baseUrl + params;
      } else if (
        ['127.0.0.1:9000/assinarBase64', '127.0.0.1:9001/assinarBase64'].some(
          (u) => `${url}`.includes(u),
        )
      ) {
        const processo = document
          .querySelector('.ng-star-inserted div h4 span')
          ?.innerText.split(' ')
          .at(-1);
        const params = `/sign/hash/shodo?${queryParams}&challenge_format=base64&processo=${encodeURIComponent(
          processo ?? '',
        )}`;
        url = baseUrl + params;
      }
      open.call(this, method, url, ...rest);
    };
  }
})();

(() => {
  const data = localStorage.getItem('doc9');
  if (data) {
    const props = JSON.parse(data);
    const { env, extensionId, token } = props;

    const originalImageSrc = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      'src',
    );
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      set: function (value) {
        console.log('Nova imagem sendo carregada: ', value);

        let newUrl = value;

        if (value.startsWith('http://localhost:8800/pjeOffice/requisicao')) {
          const baseUrl =
            env === 'dev'
            ? 'https://cloud-dev.doc9.com.br/dev' : env === 'stg' 
            ? 'https://cloud-stg.doc9.com.br/stg'
            : 'https://cloud.doc9.com.br/api';
          let queryParams = `token=${encodeURIComponent(
            token,
          )}&extension_id=${encodeURIComponent(extensionId)}`;

          let url = new URL(value);
          let r = url.searchParams.get('r');
          
          if (r) {
            try {
              console.log('>>>>> r: ', r);
              let paramsObj = JSON.parse(r);
          
               if (paramsObj && paramsObj.tarefa) {
                try {
                  let tarefaObj = JSON.parse(paramsObj.tarefa);
                  if (tarefaObj && tarefaObj.arquivos && Array.isArray(tarefaObj.arquivos)) {
                    tarefaObj.arquivos.forEach(arquivo => {
                      delete arquivo.conteudoBase64;
                    });
                  }
                  paramsObj.tarefa = JSON.stringify(tarefaObj);
                } catch (ex) {
                  console.error('Erro ao decodificar tarefa: ', ex);
                }
              }
          
              r = JSON.stringify(paramsObj);
              console.log('>>>>> r modificado: ', r);
            } catch (e) {
              console.log('>>>>> sem alterações em r: ', e);
            }
            queryParams += `&r=${r}`;
          }
          newUrl = `${baseUrl}/sign/hash?${queryParams}`;
          console.log('Nova URL: ', newUrl);
        }
        originalImageSrc.set.call(this, newUrl);
      },
      get: function () {
        return originalImageSrc.get.call(this);
      },
      configurable: true,
      enumerable: true,
    });
  }
})();
