const requestGN_API = require('../../api/pixGatewayGerencianet');
const moment = require('moment-timezone');

const reqGNAlready = requestGN_API({
  clientID: process.env.GN_CLIENT_ID,
  clientSecret: process.env.GN_CLIENT_SECRET
});

async function CreatePixCob (totalValue) {
  const reqGN = await reqGNAlready;
  const dataCob = {
    calendario: {
      expiracao: 1800
    },
    valor: {
      original: totalValue.toString()
    },
    chave: process.env.GN_RECEIVER_PIX_KEY,
    solicitacaoPagador: 'Cobrança Pix por pedido via WhatsApp.',
    infoAdicionais: [
      {
        nome: 'Pagamento em',
        valor: 'Bauru Burger - WhatsApp Delivery',
      }
    ]
  };

  const cobResponse = await reqGN.post('/v2/cob', dataCob);
  const qrcodeResponse = await reqGN.get(`/v2/loc/${cobResponse.data.loc.id}/qrcode`);

  var pixInfo = {
    txId: cobResponse.data.txid,
    qrcode: qrcodeResponse.data.qrcode,
    qrcodeImg: qrcodeResponse.data.imagemQrcode
  }
  return pixInfo
};

//CreatePixCob(0.15)

async function CheckSuccessfulPixPayments () {
  // Date Range Manipulation
  const currentDate = moment();
  const beginDateRange = moment(currentDate).subtract(30, 'minutes').utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
  const endDateDate = moment(currentDate).add(30, 'minutes').utc().format('YYYY-MM-DDTHH:mm:ss[Z]');

  const reqGN = await reqGNAlready;
  const cobResponse = await reqGN.get(`/v2/cob?status=CONCLUIDA&inicio=${beginDateRange}&fim=${endDateDate}`);
  //console.log(cobResponse.data.cobs)
}

//CheckSuccessfulPixPayments()

module.exports = { CreatePixCob, CheckSuccessfulPixPayments }