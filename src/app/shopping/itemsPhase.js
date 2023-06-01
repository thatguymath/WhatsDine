const messageSender = require('../chatting/messageSender');
const deliveryPhase = require('./deliveryPhase');
const BRLFormatter = require('../../util/UStoBRLFormatter')

const path = require('path');
const fileName = path.basename(__filename, path.extname(__filename));

async function itemsPhase(client, orderPayloadInstance) {
    orderPayloadInstance.checkoutPhase = fileName // switches control of orderPayloadInstance to current file

    const StepsLeftDesignPattern = '🛒 *Escolha*  →  🛵 Entrega  →  💵 Pagamento' // As in https://ui-patterns.com/patterns/StepsLeft

    // Buttons constructor
    let buttons_AdditionalOrderInformation = new global.Buttons(
        StepsLeftDesignPattern + '\n\nDeseja adicionar alguma observação ao seu pedido?', 
        [{ body: 'Adicionar observação', id: 'additionalOrderInformation_yes' }, { body: 'Continuar pedido' , id: 'additionalOrderInformation_no'}],
        '', 
        'Retirar ingredientes, ponto da carne...'
    );

    // Call messageSender function to handle message output
    let introMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: buttons_AdditionalOrderInformation
    }
    await messageSender(client, introMessageParams)

    // Parameters that will be used for the state machine interactions of 'itemsPhase Activity'
    // additionalOrderInformation phase
    let additionalOrderInformationMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: 'Certo! Quais são suas observações para o pedido?'
    }

    // confirmation phase
    function createButtonsConfirmation() { // We need this constructor inside a function to create it only when the user sets additionalOrderInformation or not
        let itemsInfo = orderPayloadInstance.order.items.map(entry => `${entry.quantity} × ${entry.name} | R$ ${BRLFormatter(entry.price * entry.quantity)}`).join('\n');
        let itemsTotalPrice = BRLFormatter(orderPayloadInstance.order.itemsTotal)
        let additionalOrderInformation = ''
        if (orderPayloadInstance.additionalOrderInformation) additionalOrderInformation = `\n\nObservação: "_${orderPayloadInstance.additionalOrderInformation}_"`

        return new global.Buttons(
            StepsLeftDesignPattern + `\n\n*Aqui está um resumo do seu pedido!*\n\n${itemsInfo}${additionalOrderInformation}\n\nTotal: R$ ${itemsTotalPrice}`, 
            [{ body: 'Confirmar', id: 'confirm_items' }, { body: 'Cancelar' , id: 'cancel_order'}],
            '', 
            'Caso queira alterar seu pedido, é necessário cancelar e fazer as alterações no carrinho de itens!'
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

    // Handler of message events for 'itemsPhase Activity', with state machine approach
    let conversationState = 'start_items';

    client.on('message', async message => {
        if (message.from == orderPayloadInstance.userId && orderPayloadInstance.checkoutPhase == fileName) { //fileName is used as control, so state machine interactions only works in one checkoutPhase at a time
            switch(conversationState) {
                case 'start_items':
                    if (message.selectedButtonId == 'additionalOrderInformation_yes') {
                        await messageSender(client, additionalOrderInformationMessageParams)
                        conversationState = 'waiting_for_additionalOrderInformation';
                        
                    } else if (message.selectedButtonId == 'additionalOrderInformation_no') {
                        confirmationMessageParams.content = createButtonsConfirmation()
                        await messageSender(client, confirmationMessageParams)
                        conversationState = 'waiting_for_final_items_confirmation';
                    }
                    break;
                    
                case 'waiting_for_additionalOrderInformation':
                    if (message.type == 'chat') {
                        orderPayloadInstance.additionalOrderInformation = message.body
                        confirmationMessageParams.content = createButtonsConfirmation()
                        await messageSender(client, confirmationMessageParams)
                        conversationState = 'waiting_for_final_items_confirmation';
                    }
                    break;

                case 'waiting_for_final_items_confirmation':
                    if (message.selectedButtonId == 'confirm_items') {
                        deliveryPhase(client, orderPayloadInstance)
                        conversationState = 'finish_items';

                    } else if (message.selectedButtonId == 'cancel_order') {
                        await messageSender(client, cancelledMessageParams)
                        conversationState = 'finish_items';
                        return;
                    }
                    break;

                case 'finish_items':
                    //await messageSender(client, finishedMessageParams)
                    break;

                default:
                    console.error('Invalid conversation state:', conversationState);
                    break;
            }
        }
    });
}

module.exports = itemsPhase;