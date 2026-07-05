(() => {
  function log(...message) {
    console.log(`${new Date().toISOString()} ${message.join(' ')}`);
  }

  const getBaseUrl = () => {
    const doc9 = JSON.parse(window.localStorage.getItem('doc9') ?? '{}');
    if (doc9.env === 'dev') return 'https://cloud-dev.doc9.com.br/dev';
    else return 'https://cloud.doc9.com.br/api';
  };

  const getQueryParams = (params) => {
    return Object.entries(params)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
      )
      .join('&');
  };

  async function getCerts() {
    const doc9 = JSON.parse(window.localStorage.getItem('doc9') ?? '{}');
    const params = getQueryParams({
      extension_id: doc9.extensionId,
      token: doc9.token,
      format: 'conectividade',
    });
    const resp = await fetch(`${getBaseUrl()}/sign/hash/cert?${params}`);
    const { data } = await resp.json();
    return [data];
  }

  function handleGetCerts(ResponseClassRef) {
    return new Promise((resolve) => {
      getCerts().then((certs) => {
        resolve(ResponseClassRef ? new ResponseClassRef(certs, 0, 0) : certs);
      });
    });
  }

  async function handleSign(payload) {
    console.log('Recebido solicitação de assinatura: ', payload);
    const { toBeSigned: challenge } = payload;
    const doc9 = JSON.parse(window.localStorage.getItem('doc9') ?? '{}');
    const params = getQueryParams({
      extension_id: doc9.extensionId,
      token: doc9.token,
    });
    const resp = await fetch(`${getBaseUrl()}/sign/hash?${params}`, {
      method: 'POST',
      body: JSON.stringify({ challenge }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const { data } = await resp.json();
    console.log('Recebido resposta de assinatura: ', data);
    return data.sign.at(0);
  }

  class SignClass {
    responseClassRef;

    constructor() {
      this.signer = new xabo.queryInterface.api.sign.krypton.OriginalSign();
    }

    enumerateCerts() {
      return new Promise((resolve) => {
        if (!this.responseClassRef) {
          this.signer.enumerateCerts().then((res) => {
            this.responseClassRef = res.constructor;
            handleGetCerts(this.responseClassRef).then((resp) => resolve(resp));
          });
        } else {
          handleGetCerts(this.responseClassRef).then((resp) => resolve(resp));
        }
      });
    }

    sign(payload) {
      return handleSign(payload);
    }
  }

  function inject() {
    try {
      log('Conectividade interceptado com sucesso');

      window.xabo = {
        whom: true,
        signet: 'Kryptonite',
        sign: {
          enumerateCerts: () => handleGetCerts(),
          sign: handleSign,
          krypton: {
            Sign: SignClass,
          },
        },
        queryInterface: async (props) => {
          console.log('Props recebidas: ', props);
          return new Promise((resolve) => {
            resolve(window.xabo);
          });
        },
      };

      xabo = window.xabo;

      log('Xabo injetado com sucesso');

      // xabo.queryInterface.api.sign.enumerateCerts = () =>
      //   new Promise((resolve) => resolve(certs));

      // xabo.queryInterface.api.sign.sign = () => {
      //   new Promise((resolve) => resolve(signed));
      // };

      // xabo.queryInterface.api.whom = true;

      // xabo.queryInterface.api.sign.enumerateCerts = () => handleGetCerts();

      // xabo.queryInterface.api.sign.sign = handleSign;

      // xabo.queryInterface.api.sign.krypton.OriginalSign =
      //   xabo.queryInterface.api.sign.krypton.Sign;

      // xabo.queryInterface.api.sign.krypton.Sign = SignClass;

      return true;
    } catch (err) {
      log(`Erro ao interceptar conectividade: ${err}`);
      return false;
    }
  }

  window.addEventListener('message', (ev) => {
    const { action } = ev.data;

    switch (action) {
      case 'intercept/request':
        let ok = !!window.xabo?.whom;
        if (!ok) ok = inject();
        ev.source.postMessage(
          {
            action: 'intercept/response',
            payload: { ok },
          },
          ev.origin,
        );
        break;
    }
  });
})();
