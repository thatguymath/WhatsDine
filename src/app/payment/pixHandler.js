const requestEFI_API = require('../../api/pixGatewayGerencianet');
const moment = require('moment');

const reqGNAlready = requestEFI_API({
  clientID: process.env.EFI_CLIENT_ID,
  clientSecret: process.env.EFI_CLIENT_SECRET
});

async function CreatePixCob (totalValue) {
  const reqGN = await reqGNAlready;
  const dataCob = {
    calendario: {
      expiracao: 900
    },
    valor: {
      original: totalValue.toString()
    },
    chave: process.env.EFI_RECEIVER_PIX_KEY,
    infoAdicionais: [
      {
        nome: 'WhatsApp Delivery',
        valor: 'Cobrança Pix por seu pedido via WhatsApp',
      }
    ]
  }

  const cobResponse = await reqGN.post('/v2/cob', dataCob)
  const qrcodeResponse = await reqGN.get(`/v2/loc/${cobResponse.data.loc.id}/qrcode`)

  var pixInfo = {
    txId: cobResponse.data.txid,
    qrcode: qrcodeResponse.data.qrcode,
    qrcodeImg: qrcodeResponse.data.imagemQrcode
  }
  return pixInfo
};

async function CheckSuccessfulPixPayments () {
  // Date Range Manipulation
  const currentDate = moment()
  const beginDateRange = moment(currentDate).subtract(15, 'minutes').utc().format('YYYY-MM-DDTHH:mm:ss[Z]')
  const endDateRange = moment(currentDate).add(15, 'minutes').utc().format('YYYY-MM-DDTHH:mm:ss[Z]')

  const reqGN = await reqGNAlready
  const cobResponse = await reqGN.get(`/v2/cob?status=CONCLUIDA&inicio=${beginDateRange}&fim=${endDateRange}`)

  return cobResponse.data.cobs
}

module.exports = { CreatePixCob, CheckSuccessfulPixPayments }