const messageSender = require('../chatting/messageSender');
const { createRecord, readRecord, readOneRecord, updateRecord, deleteRecord } = require('../../db/dbCRUD_Handler');
const BRLFormatter = require('../../util/UStoBRLFormatter');
const pixHandler = require('../payment/pixHandler')
const receipt = require('./receipt');

const path = require('path');
const fileName = path.basename(__filename, path.extname(__filename));

async function paymentPhase(client, orderPayloadInstance) {
    orderPayloadInstance.checkoutPhase = fileName // switches control of orderPayloadInstance to current file

    const StepsLeftDesignPattern = '🛒 Escolha  →  🛵 Entrega  →  💵 *Pagamento*' // As in https://ui-patterns.com/patterns/StepsLeft

    // Reset all values of the payment object
    function paymentReset () {
        Object.keys(orderPayloadInstance.payment.info).forEach(key => {
            orderPayloadInstance.payment.info[key] = '';
        });
        orderPayloadInstance.isPaid = false;
    }

    if (orderPayloadInstance.isTakeOut) orderPayloadInstance.totalValue = parseFloat(orderPayloadInstance.order.itemsTotal)
    else orderPayloadInstance.totalValue = (parseFloat(orderPayloadInstance.order.itemsTotal) + parseFloat(orderPayloadInstance.deliveryFee)).toFixed(2)

    // Buttons constructor
    let buttons_DeliveryMethod = new global.Buttons(
        StepsLeftDesignPattern + '\n\nComo será o pagamento do seu pedido?', 
        [{ body: 'Pagar ao receber, via Cartão ou Dinheiro', id: 'payment_on_delivery' }, { body: 'Pagar com Pix' , id: 'payment_pix'}]
    );

    // Call messageSender function to handle message output
    let introMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: buttons_DeliveryMethod
    }
    await messageSender(client, introMessageParams)

    // Buttons constructor
    let buttons_paymentAtDelivery = new global.Buttons(
        StepsLeftDesignPattern + '\n\nE como será o pagamento ao receber seu pedido?', 
        [{ body: 'Dinheiro', id: 'dinheiro' }, { body: 'Mastercard' , id: 'mastercard'}, { body: 'Visa' , id: 'visa'}]
    );

    // Call messageSender function to handle message output
    let payOnDeliveryMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: buttons_paymentAtDelivery
    }

    // Buttons constructor
    let buttons_paymentCreditOrDebit = new global.Buttons(
        StepsLeftDesignPattern + '\n\nVai ser no Crédito ou no Débito?', 
        [{ body: 'Débito' , id: 'debito'}, { body: 'Crédito' , id: 'credito'}]
    );

    // Call messageSender function to handle message output
    let CreditOrDebitMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: buttons_paymentCreditOrDebit
    }

    // Buttons constructor
    let buttons_paymentMoney = new global.Buttons(
        StepsLeftDesignPattern + `\n\nPrecisa de troco para seu pedido de R$ ${BRLFormatter(orderPayloadInstance.totalValue)}?`, 
        [{ body: 'Sim, preciso de troco', id: 'payment_money_need_change' }, { body: 'Tenho o valor exato do pedido' , id: 'payment_money_no_change'}]
    );

    // Call messageSender function to handle message output
    let paymentMoneyMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: buttons_paymentMoney
    }

    // Call messageSender function to handle message output
    let moneyChangeUserInputMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: 'Você precisa de troco para quanto?'
    }

    // Pix payment info phase 1
    let pixPaymentInfo1MessageParams = {
        userId: orderPayloadInstance.userId, 
        content: StepsLeftDesignPattern + '\n\nEscaneie o QR Code abaixo ou copie o código Pix para realizar o pagamento.\nEste código ficará disponível por 15 minutos!'
    }

    // Pix payment info phase 2
    function createCaptionedQRCodeImage (pixObject) {
        let pixPaymentInfo2MessageParams = {
            userId: orderPayloadInstance.userId, 
            content: new global.MessageMedia('image/png', pixObject.qrcodeImg.split(',')[1]),
            options: { caption: pixObject.qrcode }
        }
        return pixPaymentInfo2MessageParams
    }

    // order confirmation
    function createButtonsConfirmation() { // We need this constructor inside a function to create it only when the user sets additionalOrderInformation or not
        let itemsInfo = orderPayloadInstance.order.items.map(entry => `${entry.quantity} × ${entry.name} | R$ ${BRLFormatter(entry.price * entry.quantity)}`).join('\n');
        let totalPrice = BRLFormatter(orderPayloadInstance.order.itemsTotal)
        let additionalOrderInformation = ''
        if (orderPayloadInstance.additionalOrderInformation) additionalOrderInformation = `\nObservação do Pedido: "_${orderPayloadInstance.additionalOrderInformation}_"`

        deliveryInformation = ''
        if (orderPayloadInstance.isTakeOut) {
            deliveryInformation = `*Forma de Entrega:* Retirada na Loja`
            deliveryInformation += `\nSeu pedido deve ser retirado em ${process.env.RESTAURANT_ADDRESS}`
            deliveryInformation += `\n\nEstimativa de Retirada em ${orderPayloadInstance.serviceAproxTime}`
        } else {
            deliveryInformation = `Entrega em: _${orderPayloadInstance.address.fullAddress}_`;

            if (orderPayloadInstance.address.additionalAddressInformation) deliveryInformation += `\nInformação do Endereço: _${orderPayloadInstance.address.additionalAddressInformation}_`
            
            deliveryInformation += `\n\nEstimativa de Entrega em ${orderPayloadInstance.serviceAproxTime}`

            deliveryInformation += `\n\nTaxa de Entrega: R$ ${BRLFormatter(orderPayloadInstance.deliveryFee)}`
        }

        return new global.Buttons(
            StepsLeftDesignPattern + '\n\n*Este é seu pedido. Podemos confirmar?*\n\n' + `${itemsInfo}${additionalOrderInformation}\n\n${deliveryInformation}\n\nValor do Pedido: R$ ${BRLFormatter(orderPayloadInstance.totalValue)}\n\nMétodo de Pagamento: ${orderPayloadInstance.method}`, 
            [{ body: 'Fazer pedido', id: 'confirm_order' }, { body: 'Alterar forma de pagamento' , id: 'reset_payment' }, { body: 'Cancelar pedido' , id: 'cancel_order' }]
        );
    }

    // Call messageSender function to handle message output
    let paymentFinalConfirmatioMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: undefined
    }

    // cancelled order phase
    let cancelledMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: 'Seu pedido foi cancelado.'
    }

    // Handler of message events for 'paymentPhase Activity', with state machine approach
    let conversationState = 'start_payment';

    client.on('message', async message => {
        if (message.from == orderPayloadInstance.userId && orderPayloadInstance.checkoutPhase == fileName) { //fileName is used as control, so state machine interactions only works in one checkoutPhase at a time
            switch(conversationState) {
                case 'start_payment':
                    if (message.selectedButtonId == 'payment_on_delivery') {
                        await messageSender(client, payOnDeliveryMessageParams)
                        conversationState = 'waiting_for_payment_on_delivery';
                        
                    } else if (message.selectedButtonId == 'payment_pix') {
                        orderPayloadInstance.method = 'pix'
                        paymentFinalConfirmatioMessageParams.content = createButtonsConfirmation()
                        await messageSender(client, paymentFinalConfirmatioMessageParams)
                        conversationState = 'waiting_for_order_confirmation';
                    }
                    break;

                case 'waiting_for_payment_on_delivery':
                    orderPayloadInstance.method = message.selectedButtonId
                    if (orderPayloadInstance.method == 'dinheiro') {
                        await messageSender(client, paymentMoneyMessageParams)
                        conversationState = 'waiting_for_money_change_option';

                    } else if (orderPayloadInstance.method == 'mastercard' || orderPayloadInstance.method == 'visa') {
                        await messageSender(client, CreditOrDebitMessageParams)
                        conversationState = 'waiting_for_credit_or_debit_choice';

                    } else {
                        paymentFinalConfirmatioMessageParams.content = createButtonsConfirmation()
                        await messageSender(client, paymentFinalConfirmatioMessageParams)
                        conversationState = 'waiting_for_order_confirmation';
                    }
                    break;

                case 'waiting_for_money_change_option':
                    if (message.selectedButtonId == 'payment_money_need_change') {
                        await messageSender(client, moneyChangeUserInputMessageParams)
                        conversationState = 'waiting_for_money_change_input';
                        
                    } else if (message.selectedButtonId == 'payment_money_no_change'){
                        paymentFinalConfirmatioMessageParams.content = createButtonsConfirmation()
                        await messageSender(client, paymentFinalConfirmatioMessageParams)
                        conversationState = 'waiting_for_order_confirmation';
                    }
                    break;

                case 'waiting_for_money_change_input':
                    paymentFinalConfirmatioMessageParams.content = createButtonsConfirmation()
                    await messageSender(client, paymentFinalConfirmatioMessageParams)
                    orderPayloadInstance.changeForAmount = message.body
                    conversationState = 'waiting_for_order_confirmation';
                    break;

                case 'waiting_for_credit_or_debit_choice':
                    orderPayloadInstance.method += ' ' + message.selectedButtonId
                    paymentFinalConfirmatioMessageParams.content = createButtonsConfirmation()
                    await messageSender(client, paymentFinalConfirmatioMessageParams)
                    conversationState = 'waiting_for_order_confirmation';
                    break;

                case 'waiting_for_order_confirmation':
                    if (message.selectedButtonId == 'confirm_order') {
                        if (orderPayloadInstance.method == 'pix') {
                            const pixResponse = await pixHandler.CreatePixCob(orderPayloadInstance.totalValue)
                            orderPayloadInstance.pixTxId = pixResponse.txId
                            const pixPaymentInfoMessage = createCaptionedQRCodeImage(pixResponse)

                            await messageSender(client, pixPaymentInfo1MessageParams)
                            await messageSender(client, pixPaymentInfoMessage)
                        }
                        await createRecord('orders', orderPayloadInstance)
                        console.log(global.consoleFormatter('gray', 'LOG', `${orderPayloadInstance.userId} (${orderPayloadInstance.name}) finalizou o checkout do pedido ${orderPayloadInstance.cartOrderId}`))
                        //receipt(orderPayloadInstance)
                        conversationState = 'finish_payment';

                    } else if (message.selectedButtonId == 'reset_payment') {
                        paymentReset()
                        await messageSender(client, introMessageParams)
                        conversationState = 'start_payment';

                    } else if (message.selectedButtonId == 'cancel_order') {
                        await messageSender(client, cancelledMessageParams)
                        conversationState = 'finish_payment';
                        return;
                    }
                    break;

                case 'finish_payment':
                    //await messageSender(client, finishedMessageParams)
                    break;

                default:
                    console.error('Invalid conversation state:', conversationState);
                    break;
            }
        }
    })
}

module.exports = paymentPhase;