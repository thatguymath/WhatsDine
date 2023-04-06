const messageSender = require('../chatting/messageSender');
const paymentChoosing = require('./paymentChoosing');
const BRLFormatter = require('../util/UStoBRLFormatter');
const travelParametersCalculator = require('../util/travelParamsCalculator');

const path = require('path');
const fileName = path.basename(__filename, path.extname(__filename));

function deliveryChoosing(client, orderPayloadInstance) {
    orderPayloadInstance.checkoutPhase = fileName // switches control of orderPayloadInstance to current file

    const StepsLeftDesignPattern = '🛒 Escolha  →  🛵 *Entrega*  →  💵 Pagamento' // As in https://ui-patterns.com/patterns/StepsLeft

    // Reset all values of the address object and isTakeOut flag
    function deliveryReset () {
        orderPayloadInstance.isTakeOut = false;
        Object.keys(orderPayloadInstance.address).forEach(key => {
            orderPayloadInstance.address[key] = '';
        });
    }

    // Buttons constructor
    let buttons_DeliveryMethod = new global.Buttons(
        StepsLeftDesignPattern + '\n\nComo será a entrega do seu pedido?', 
        [{ body: 'Quero receber no endereço', id: 'courier_delivery' }, { body: 'Quero retirar na loja' , id: 'takeout'}]
    );

    // Call messageSender function to handle message output
    let introMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: buttons_DeliveryMethod
    }
    messageSender(client, introMessageParams)

    // address phase 1
    let address1MessageParams = {
        userId: orderPayloadInstance.userId, 
        content: '*Vamos adicionar o endereço de entrega!*\nEscreva apenas o logradouro (rua, avenida, alameda...):'
    }

    // address phase 2
    let address2MessageParams = {
        userId: orderPayloadInstance.userId, 
        content: 'Agora, escreva o número do imóvel:'
    }

    // address phase 3
    let address3MessageParams = {
        userId: orderPayloadInstance.userId, 
        content: 'Estamos quase lá!\nQual é o CEP do endereço?'
    }

    // Buttons constructor
    let buttons_AdditionalAddressInformation = new global.Buttons(
        'Seu endereço tem alguma informação adicional?', 
        [{ body: 'Quero adicionar uma informação ao endereço', id: 'additionalAddressInformation_yes' }, { body: 'É possível entregar com o que já passei' , id: 'additionalAddressInformation_no'}],
        '', 
        'Número da portaria, apartamento, ponto de referência...'
    );

    // address phase 4
    let address4MessageParams = {
        userId: orderPayloadInstance.userId, 
        content: buttons_AdditionalAddressInformation
    }

    // address phase 5
    let address5MessageParams = {
        userId: orderPayloadInstance.userId, 
        content: 'Ok! Quais são as informações extras para entrega?'
    }

    // final confirmation phase
    async function createButtonsFinalConfirmation() { // We need this constructor inside a function to create it only when the user sets activities' inputs
        deliveryInformation = ''
        if (orderPayloadInstance.isTakeOut) {
            deliveryInformation = `*Forma de Entrega:* Retirada na Loja`
            orderPayloadInstance.serviceAproxTime = process.env.ESTIMATED_PREPARING_TIME + ' minutos'
        } else {
            const travelParameters = await travelParametersCalculator([orderPayloadInstance.address.street, orderPayloadInstance.address.number, orderPayloadInstance.address.cep])

            // sets deliveryFee based on price per kilometer set by the restaurant
            orderPayloadInstance.deliveryFee = (process.env.PRICE_PER_KILOMETER * parseFloat(travelParameters.distance.replace(',', '.'))).toFixed(2)
            
            // sets delivery approximated service time, based on route, traffic and average preparation time set by the restaurant
            orderPayloadInstance.serviceAproxTime = parseInt(travelParameters.duration) + parseInt(process.env.ESTIMATED_PREPARING_TIME) + ' minutos'

            deliveryInformation = `Entrega em: ${orderPayloadInstance.address.street}, Nº ${orderPayloadInstance.address.number}, CEP ${orderPayloadInstance.address.cep}`;

            if (orderPayloadInstance.address.additionalAddressInformation) deliveryInformation += `\nObservação: _${orderPayloadInstance.address.additionalAddressInformation}_`

            deliveryInformation += `\n\nTaxa de Entrega: R$ ${BRLFormatter(orderPayloadInstance.deliveryFee)}`
        }

        return new global.Buttons(
            StepsLeftDesignPattern + `\n\n*Confira se está tudo certo com a entrega!*\n\n${deliveryInformation}`, 
            [{ body: 'Confirmar', id: 'delivery_final_confirm' }, { body: 'Corrigir' , id: 'delivery_final_correct'}]
        );
    }

    let finalConfirmationMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: undefined // Will be set later, as it has possible user input
    }

    // finished delivery phase
    let finishedMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: 'Oops! Parece que você já escolheu uma opção desse menu.'
    }

    // Handler of message events for 'deliveryChoosing Activity', with state machine approach
    let conversationState = 'delivery_start';

    client.on('message', async message => {
        if (message.from == orderPayloadInstance.userId && orderPayloadInstance.checkoutPhase == fileName) { //fileName is used as control, so state machine interactions only works in one checkoutPhase at a time
            switch(conversationState) {
                case 'delivery_start':
                    if (message.selectedButtonId == 'courier_delivery') {
                        messageSender(client, address1MessageParams)
                        conversationState = 'waiting_for_address_phase1';
                    } else if (message.selectedButtonId == 'takeout') {
                        orderPayloadInstance.isTakeOut = true;
                        finalConfirmationMessageParams.content = await createButtonsFinalConfirmation()
                        messageSender(client, finalConfirmationMessageParams)
                        conversationState = 'waiting_for_final_confirmation';
                    }
                    break;
                
                case 'waiting_for_address_phase1':
                    messageSender(client, address2MessageParams)
                    orderPayloadInstance.address.street = message.body
                    conversationState = 'waiting_for_address_phase2';
                    break;

                    case 'waiting_for_address_phase2':
                        messageSender(client, address3MessageParams)
                        orderPayloadInstance.address.number = message.body
                        conversationState = 'waiting_for_address_phase3';
                        break;

                        case 'waiting_for_address_phase3':
                            messageSender(client, address4MessageParams)
                            orderPayloadInstance.address.cep = message.body
                            conversationState = 'waiting_for_address_phase4';
                            break;

                            case 'waiting_for_address_phase4':
                                if (message.selectedButtonId == 'additionalAddressInformation_yes') {
                                    messageSender(client, address5MessageParams)
                                    conversationState = 'waiting_for_address_phase5';
                                } else if (message.selectedButtonId == 'additionalAddressInformation_no') {
                                    finalConfirmationMessageParams.content = await createButtonsFinalConfirmation()
                                    messageSender(client, finalConfirmationMessageParams)
                                    conversationState = 'waiting_for_final_confirmation';
                                }
                                break;

                                case 'waiting_for_address_phase5':
                                    orderPayloadInstance.address.additionalAddressInformation = message.body
                                    finalConfirmationMessageParams.content = await createButtonsFinalConfirmation()
                                    messageSender(client, finalConfirmationMessageParams)
                                    conversationState = 'waiting_for_final_confirmation';
                                    break;

                case 'waiting_for_final_confirmation':
                    if (message.selectedButtonId == 'delivery_final_confirm') {
                        paymentChoosing(client, orderPayloadInstance)
                        conversationState = 'delivery_finished';
                    } else if (message.selectedButtonId == 'delivery_final_correct') {
                        deliveryReset()
                        messageSender(client, introMessageParams)
                        conversationState = 'delivery_start';
                    }
                    break;
                    
                case 'delivery_finished':
                    //messageSender(client, finishedMessageParams)
                    break;

                default:
                    console.error('Invalid conversation state:', conversationState);
                    break;
            }
        }
    })
}

module.exports = deliveryChoosing;