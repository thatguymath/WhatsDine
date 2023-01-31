const messageSender = require('../chatting/messageSender');
const deliveryChoosing = require('./deliveryChoosing');
const BRLFormatter = require('../util/UStoBRLFormatter')

const path = require('path');
const fileName = path.basename(__filename, path.extname(__filename));

function itemsChoosing(client, orderPayloadInstance) {
    orderPayloadInstance.checkoutPhase = fileName // switches control of orderPayloadInstance to current file

    const StepsLeftDesignPattern = '🛒 *Escolha*  →  🛵 Entrega  →  💵 Pagamento' // As in https://ui-patterns.com/patterns/StepsLeft

    // Buttons constructor
    let buttons_AdditionalOrderInformation = new global.Buttons(
        StepsLeftDesignPattern + '\n\nDeseja adicionar alguma informação ao seu pedido?', 
        [{ body: 'Adicionar observação', id: 'additionalOrderInformation_yes' }, { body: 'Continuar pedido' , id: 'additionalOrderInformation_no'}],
        '', 
        'Retirar ingredientes, ponto da carne...'
    );

    // Call messageSender function to handle message output
    let introMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: buttons_AdditionalOrderInformation
    }
    messageSender(client, introMessageParams)

    // Parameters that will be used for the state machine interactions of 'itemsChoosing Activity'
    // additionalOrderInformation phase
    let additionalOrderInformationMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: 'Certo! Adicione suas observações abaixo:'
    }

    // confirmation phase
    function createButtonsConfirmation() { // We need this constructor inside a function to create it only when the user sets additionalOrderInformation or not
        let itemsInfo = orderPayloadInstance.order.items.map(entry => `${entry.quantity} × ${entry.name} | R$ ${BRLFormatter(entry.price * entry.quantity)}`).join('\n');
        let totalPrice = BRLFormatter(orderPayloadInstance.order.total)
        let additionalOrderInformation = ''
        if (orderPayloadInstance.additionalOrderInformation) additionalOrderInformation = `\n\nObservação: "_${orderPayloadInstance.additionalOrderInformation}_"`

        return new global.Buttons(
            StepsLeftDesignPattern + `\n\n*Aqui está um resumo do seu pedido!*\n\n${itemsInfo}${additionalOrderInformation}\n\nTotal: R$ ${totalPrice}`, 
            [{ body: 'Confirmar', id: 'items_final_confirm' }, { body: 'Cancelar' , id: 'delivery_final_cancel'}],
            '', 
            'Caso queira alterar seu pedido, é necessário cancelar e adicionar os itens ao carrinho.'
        );
    }

    let confirmationMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: undefined // Will be set later, as it has possible user input
    }

    // cancelled order phase
    let cancelledMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: 'Seu pedido foi cancelado.'
    }

    // finished order phase
    let finishedMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: 'Oops! Parece que você já escolheu uma opção desse menu.'
    }

    // Handler of message events for 'itemsChoosing Activity', with state machine approach
    let conversationState = 'items_start';

    client.on('message', async message => {
        if (message.from == orderPayloadInstance.userId && orderPayloadInstance.checkoutPhase == fileName) { //fileName is used as control, so state machine interactions only works in one checkoutPhase at a time
            switch(conversationState) {
                case 'items_start':
                    if (message.selectedButtonId == 'additionalOrderInformation_yes') {
                        messageSender(client, additionalOrderInformationMessageParams)
                        conversationState = 'waiting_for_additionalOrderInformation';
                    } else if (message.selectedButtonId == 'additionalOrderInformation_no') {
                        confirmationMessageParams.content = createButtonsConfirmation()
                        messageSender(client, confirmationMessageParams)
                        conversationState = 'waiting_for_final_items_confirmation';
                    }
                    break;
                    
                case 'waiting_for_additionalOrderInformation':
                    if (message.type == 'chat') {
                        orderPayloadInstance.additionalOrderInformation = message.body
                        confirmationMessageParams.content = createButtonsConfirmation()
                        messageSender(client, confirmationMessageParams)
                        conversationState = 'waiting_for_final_items_confirmation';
                    }
                    break;

                case 'waiting_for_final_items_confirmation':
                    if (message.selectedButtonId == 'items_final_confirm') {
                        deliveryChoosing(client, orderPayloadInstance)
                        conversationState = 'items_finished';
                    } else if (message.selectedButtonId == 'delivery_final_cancel') {
                        messageSender(client, cancelledMessageParams)
                        conversationState = 'items_finished';
                        return;
                    }
                    break;

                case 'items_finished':
                    //messageSender(client, finishedMessageParams)
                    break;

                default:
                    console.error('Invalid conversation state:', conversationState);
                    break;
            }
        }
    });
}

module.exports = itemsChoosing;