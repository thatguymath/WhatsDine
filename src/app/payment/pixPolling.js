const pixHandler = require('./pixHandler')
const postPaymentInteraction = require('./postPaymentInteraction')
const { createRecord, readRecord, readOneRecord, updateRecord, deleteRecord } = require('../../db/dbCRUD_Handler');

// Self-invoking every 20000ms
module.exports = (async function pixPaymentsPolling() {
    try {
        const successfulPaymentsArr = await pixHandler.CheckSuccessfulPixPayments()

        successfulPaymentsArr.forEach(async element => {
            const orderPayload = await readOneRecord('orders', { 'payment.info._pixTxId': element.txid })
            if (orderPayload.payment.info._isPaid === false) {
                await updateRecord('orders', { _id: orderPayload._id }, { $set: { 'payment.info._isPaid': true } })
                console.log(global.consoleFormatter('gray', 'LOG', `Pagamento do pedido ${orderPayload.cartOrderId} de ${orderPayload.userId} (${orderPayload.name}) via Pix foi recebido`))
                postPaymentInteraction(orderPayload)
            }
        });
      
        setTimeout(pixPaymentsPolling, 20000);
    } catch (err) {
        console.error(err)
    }
})();