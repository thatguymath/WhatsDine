const clientSession = require('../clientSession')
const messageSender = require('../chatting/messageSender');
const BRLFormatter = require('../../util/UStoBRLFormatter');

async function postPaymentInteraction(orderPayload) {
    let messageParams = {
        userId: orderPayload.userId, 
        content: `Obrigado! Recebemos seu pagamento de R$ ${BRLFormatter(orderPayload.payment._totalValue)}`
    }

    await messageSender(clientSession.client, messageParams)
}

module.exports = postPaymentInteraction;