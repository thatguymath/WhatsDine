const messageSender = require('../chatting/messageSender');
const receipt = require('./receipt');
const BRLFormatter = require('../util/UStoBRLFormatter');

const path = require('path');
const fileName = path.basename(__filename, path.extname(__filename));

function paymentChoosing(client, orderPayloadInstance) {
    orderPayloadInstance.checkoutPhase = fileName // switches control of orderPayloadInstance to current file

    const StepsLeftDesignPattern = '🛒 Escolha → 🛵 Entrega → 💵 *Pagamento*' // As in https://ui-patterns.com/patterns/StepsLeft

    // Reset all values of the address object and isTakeOut flag
    function paymentReset () {
        Object.keys(orderPayloadInstance.payment).forEach(key => {
            payment[key] = '';
        });
    }

    const paymentMethodsButtons = process.env.PAY_ON_DELIVERY_METHODS.split(", ").map(element => {
        return {
          body: element,
          id: `${element.toLowerCase()}`
        };
    });

    // Buttons constructor
    let buttons_DeliveryMethod = new global.Buttons(
        StepsLeftDesignPattern + '\n\n*Como será o pagamento do seu pedido?*', 
        [{ body: 'Pagar ao receber o pedido', id: 'payment_on_delivery' }, { body: 'Pagar com Pix' , id: 'payment_pix'}, { body: 'Pagar com WhatsApp Pay' , id: 'payment_whatspay'}],
        '', 
        ''
    );

    // Call messageSender function to handle message output
    let introMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: buttons_DeliveryMethod
    }
    messageSender(client, introMessageParams)

    // Buttons constructor
    let buttons_paymentAtDelivery = new global.Buttons(
        StepsLeftDesignPattern + '\n\n*E como será o pagamento na entrega?*', 
        [{ body: 'Dinheiro', id: 'dinheiro' }, { body: 'Mastercard' , id: 'mastercard'}, { body: 'Visa' , id: 'visa'}],
        '', 
        ''
    );

    // Call messageSender function to handle message output
    let payOnDeliveryMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: buttons_paymentAtDelivery
    }

    // Buttons constructor
    let buttons_paymentMoney = new global.Buttons(
        StepsLeftDesignPattern + '\n\n*Precisa de troco?*', 
        [{ body: 'Sim, preciso de troco', id: 'payment_money_need_change' }, { body: 'Tenho o valor exato do pedido' , id: 'payment_money_no_change'}],
        '', 
        ''
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

    // order confirmation
    function createButtonsConfirmation() { // We need this constructor inside a function to create it only when the user sets additionalOrderInformation or not
        let itemsInfo = orderPayloadInstance.order.items.map(entry => `${entry.quantity} × ${entry.name} | R$ ${BRLFormatter(entry.price * entry.quantity)}`).join('\n');
        let totalPrice = BRLFormatter(orderPayloadInstance.order.total)
        let additionalOrderInformation = ''
        if (orderPayloadInstance.additionalOrderInformation) additionalOrderInformation = `\n\nObservação do Pedido: "_${orderPayloadInstance.additionalOrderInformation}_"`

        deliveryInformation = ''
        if (orderPayloadInstance.isTakeOut) {
            deliveryInformation = `*Forma de Entrega:* Retirada na Loja`
        } else {
            orderPayloadInstance.deliveryFee = process.env.DELIVERY_FEE
            deliveryInformation = `Entrega em: ${orderPayloadInstance.address.street}, Nº ${orderPayloadInstance.address.number}, CEP ${orderPayloadInstance.address.cep}`;

            if (orderPayloadInstance.address.additionalAddressInformation) deliveryInformation += `\nObservação do Endereço: _${orderPayloadInstance.address.additionalAddressInformation}_`

            deliveryInformation += `\n\nTaxa de Entrega: R$ ${BRLFormatter(orderPayloadInstance.deliveryFee)}`
        }

        return new global.Buttons(
            StepsLeftDesignPattern + '\n\n*Este é seu pedido. Podemos confirmar?*\n\n' + `${itemsInfo}${additionalOrderInformation}\n\n${deliveryInformation}\n\nValor do Pedido: R$ ${BRLFormatter(parseFloat(orderPayloadInstance.order.total) + parseFloat(orderPayloadInstance.deliveryFee))}\n\nMétodo de Pagamento: ${orderPayloadInstance.payment.method}`, 
            [{ body: 'Fazer pedido', id: 'confirm_order' }, { body: 'Alterar forma de pagamento' , id: 'change_payment' }, { body: 'Cancelar pedido' , id: 'cancel_order' }],
            '', 
            ''
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

    // Handler of message events for 'paymentChoosing Activity', with state machine approach
    let conversationState = 'payment_start';

    client.on('message', async message => {
        if (message.from == orderPayloadInstance.userId && orderPayloadInstance.checkoutPhase == fileName) { //fileName is used as control, so state machine interactions only works in one checkoutPhase at a time
            switch(conversationState) {
                case 'payment_start':
                    if (message.selectedButtonId == 'payment_on_delivery') {
                        messageSender(client, payOnDeliveryMessageParams)
                        conversationState = 'waiting_for_payment_on_delivery';
                    }
                    break;

                case 'waiting_for_payment_on_delivery':
                    orderPayloadInstance.payment.method = message.selectedButtonId
                    if (orderPayloadInstance.payment.method = 'dinheiro') {
                        messageSender(client, paymentMoneyMessageParams)
                        conversationState = 'waiting_for_money_change_option';
                    } else {
                        paymentFinalConfirmatioMessageParams.content = createButtonsConfirmation()
                        messageSender(client, paymentFinalConfirmatioMessageParams)
                        conversationState = 'waiting_for_order_confirmation';
                    }
                    break;

                case 'waiting_for_money_change_option':
                    if (message.selectedButtonId == 'payment_money_need_change') {
                        messageSender(client, moneyChangeUserInputMessageParams)
                        conversationState = 'waiting_for_money_change_input';
                    } else if (message.selectedButtonId == 'payment_money_no_change'){
                        paymentFinalConfirmatioMessageParams.content = createButtonsConfirmation()
                        messageSender(client, paymentFinalConfirmatioMessageParams)
                        conversationState = 'waiting_for_order_confirmation';
                    }
                    break;

                case 'waiting_for_money_change_input':
                    paymentFinalConfirmatioMessageParams.content = createButtonsConfirmation()
                    messageSender(client, paymentFinalConfirmatioMessageParams)
                    conversationState = 'waiting_for_order_confirmation';
                    break;

                case 'waiting_for_order_confirmation':
                    if (message.selectedButtonId == 'confirm_order') {
                        receipt(orderPayloadInstance)
                        conversationState = 'payment_finished';
                    } else if (message.selectedButtonId == 'change_payment') {
                        paymentReset()
                        messageSender(client, introMessageParams)
                        conversationState = 'payment_start';
                    } else if (message.selectedButtonId == 'cancel_order') {
                        messageSender(client, cancelledMessageParams)
                        conversationState = 'payment_finished';
                        return;
                    }
                    break;

                case 'payment_finished':
                    //messageSender(client, finishedMessageParams)
                    break;

                default:
                    console.error('Invalid conversation state:', conversationState);
                    break;
            }
        }
    })
}

module.exports = paymentChoosing;