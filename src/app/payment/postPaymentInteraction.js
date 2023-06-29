const clientSession = require('../clientSession')
const messageSender = require('../chatting/messageSender');
const BRLFormatter = require('../../util/UStoBRLFormatter');

const StepsLeftDesignPattern = '🛒 Escolha  →  🛵 Entrega  →  💵 *Pagamento*' // As in https://ui-patterns.com/patterns/StepsLeft

async function postPaymentInteraction(orderPayload) {
    let messageParams = {
        userId: orderPayload.userId, 
        content: `${StepsLeftDesignPattern}\n\nObrigado!\nRecebemos seu pagamento de R$ ${BRLFormatter(orderPayload.payment._totalValue)}`
    }

    await messageSender(clientSession.client, messageParams)
}

module.exports = postPaymentInteraction;