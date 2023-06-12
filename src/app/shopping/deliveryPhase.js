const messageSender = require('../chatting/messageSender');
const paymentPhase = require('./paymentPhase');
const BRLFormatter = require('../../util/UStoBRLFormatter');
const travelParametersCalculator = require('../../util/travelParamsCalculator');

const path = require('path');
const { ok } = require('assert');
const fileName = path.basename(__filename, path.extname(__filename));

async function deliveryPhase(client, orderPayloadInstance) {
    orderPayloadInstance.checkoutPhase = fileName // switches control of orderPayloadInstance to current file

    const StepsLeftDesignPattern = '🛒 Escolha  →  🛵 *Entrega*  →  💵 Pagamento' // As in https://ui-patterns.com/patterns/StepsLeft

    // Reset all values of the address object and isTakeOut flag
    function deliveryReset () {
        orderPayloadInstance.isTakeOut = false;
        orderPayloadInstance.deliveryFee = 0;
        orderPayloadInstance.serviceAproxTime = '';
        Object.keys(orderPayloadInstance.address).forEach(key => {
            orderPayloadInstance.address[key] = '';
        });
    }

    async function setTravelParameters (street, number, cep) {
        const travelParameters = await travelParametersCalculator(street, number, cep)

        if (travelParameters.status == 'NOT_FOUND') return 'NOT_FOUND';

        orderPayloadInstance.address.fullAddress = travelParameters.recommendedAddress
        orderPayloadInstance.address.distance = parseFloat(travelParameters.distance.replace(',', '.'))
        orderPayloadInstance.address.travelTime = parseInt(travelParameters.duration)
    }

    // Buttons constructor
    let buttons_DeliveryMethod = new global.Buttons(
        StepsLeftDesignPattern + '\n\nComo será a entrega do seu pedido?', 
        [{ body: 'Receber no endereço', id: 'courier_delivery' }, { body: 'Retirar no restaurante' , id: 'takeout'}]
    );

    // Call messageSender function to handle message output
    let introMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: buttons_DeliveryMethod
    } 
    await messageSender(client, introMessageParams)

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
        content: '*Estamos quase lá!*\nQual é o CEP do endereço?'
    }

    // Buttons constructor
    async function createButtonsFullAddress() {
        let recommendedAddress = orderPayloadInstance.address.fullAddress
        let givenAddress = `${orderPayloadInstance.address.street}, Nº ${orderPayloadInstance.address.number}, CEP ${orderPayloadInstance.address.cep}`

        return new global.Buttons(
            StepsLeftDesignPattern + `\n\nRecomendado: _${recommendedAddress}_\n\nFornecido: _${givenAddress}_`, 
            [{ body: 'Usar o endereço recomendado', id: 'full_address_recommended' }, { body: 'Usar o endereço fornecido por mim' , id: 'full_address_given'}],
            '', 
            'Caso o endereço recomendado estiver correto, ele pode nos ajudar na entrega do seu pedido!'
        );
    }

    // address phase 4
    let address4MessageParams = {
        userId: orderPayloadInstance.userId, 
        content: undefined // Will be set with asynchronously, as it depends on user input
    }

    // Buttons constructor
    let buttons_AdditionalAddressInformation = new global.Buttons(
        StepsLeftDesignPattern + '\n\nSeu endereço tem alguma informação adicional?', 
        [{ body: 'Adicionar uma informação ao endereço', id: 'additionalAddressInformation_yes' }, { body: 'É possível entregar com o que já passei' , id: 'additionalAddressInformation_no'}],
        '', 
        'Condomínio, portaria, apartamento, ponto de referência, instruções ao entregador...'
    );

    // address phase 5
    let address5MessageParams = {
        userId: orderPayloadInstance.userId, 
        content: buttons_AdditionalAddressInformation
    }

    // address phase 6
    let address6MessageParams = {
        userId: orderPayloadInstance.userId, 
        content: 'Ok! Quais são as informações adicionais do endereço?'
    }

    // address not found Buttons
    let buttons_addressNotFound = new global.Buttons(
        StepsLeftDesignPattern + `\n\nNão encontramos este endereço no sistema.`, 
        [{ body: 'Alterar informações de entrega', id: 'reset_delivery' }],
        '',
        'Verifique se seu endereço de entrega está correto ou selecione a opção de retirada no restaurante.'
    );

    // address not in service range
    let deliveryNotFoundMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: buttons_addressNotFound
    }

    // address not in service range Buttons
    let buttons_GivenAddressNotInDeliveryRange = new global.Buttons(
        StepsLeftDesignPattern + `\n\nSentimos muito, mas o endereço informado não está em nossa área de cobertura para delivery.`, 
        [{ body: 'Alterar informações de entrega', id: 'reset_delivery' }, { body: 'Cancelar pedido' , id: 'cancel_order'}],
        '',
        'Você ainda pode alterar sua entrega e retirar seu pedido no restaurante!'
    );

    // address not in service range
    let deliveryNotInRangeMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: buttons_GivenAddressNotInDeliveryRange
    }

    // cancelled delivery phase
    let cancelledMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: 'Seu pedido foi cancelado.'
    }

    // final confirmation phase
    async function createButtonsFinalConfirmation() { // We need this constructor inside a function to create it only when user sets activities' inputs
        deliveryInformation = ''

        if (orderPayloadInstance.isTakeOut) {
            deliveryInformation = `*Forma de Entrega:* Retirada na Loja`
            orderPayloadInstance.serviceAproxTime = process.env.ESTIMATED_PREPARING_TIME + ' minutos'
            
        } else {
            // sets deliveryFee based on price per kilometer set by the restaurant
            orderPayloadInstance.deliveryFee = (process.env.PRICE_PER_KILOMETER * orderPayloadInstance.address.distance).toFixed(2)
            
            // sets delivery approximated service time, based on route, traffic and average preparation time set by the restaurant
            orderPayloadInstance.serviceAproxTime = parseInt(orderPayloadInstance.address.travelTime) + parseInt(process.env.ESTIMATED_PREPARING_TIME) + ' minutos'

            deliveryInformation = `Entrega em: _${orderPayloadInstance.address.fullAddress}_`;

            if (orderPayloadInstance.address.additionalAddressInformation) deliveryInformation += `\nInformação do Endereço: _${orderPayloadInstance.address.additionalAddressInformation}_`

            deliveryInformation += `\n\nTaxa de Entrega: R$ ${BRLFormatter(orderPayloadInstance.deliveryFee)}`
        }

        return new global.Buttons(
            StepsLeftDesignPattern + `\n\n*Confira se está tudo certo com a entrega!*\n\n${deliveryInformation}`, 
            [{ body: 'Confirmar', id: 'confirm_delivery' }, { body: 'Corrigir' , id: 'reset_delivery'}]
        );
    }

    let finalConfirmationMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: undefined // Will be set with asynchronously, as it depends on user input
    }

    // finished delivery phase
    let finishedMessageParams = {
        userId: orderPayloadInstance.userId, 
        content: 'Oops! Parece que você já escolheu uma opção desse menu.'
    }

    // Handler of message events for 'deliveryPhase Activity', with state machine approach
    let conversationState = 'start_delivery';

    client.on('message', async message => {
        if (message.from == orderPayloadInstance.userId && orderPayloadInstance.checkoutPhase == fileName) { //fileName is used as control, so state machine interactions only works in one checkoutPhase at a time
            switch(conversationState) {
                case 'start_delivery':
                    if (message.selectedButtonId == 'courier_delivery') {
                        await messageSender(client, address1MessageParams)
                        conversationState = 'waiting_for_address_phase_1';

                    } else if (message.selectedButtonId == 'takeout') {
                        orderPayloadInstance.isTakeOut = true;
                        finalConfirmationMessageParams.content = await createButtonsFinalConfirmation()
                        await messageSender(client, finalConfirmationMessageParams)
                        conversationState = 'waiting_for_final_confirmation';
                    }
                    break;
                
                case 'waiting_for_address_phase_1':
                    orderPayloadInstance.address.street = message.body
                    await messageSender(client, address2MessageParams)
                    conversationState = 'waiting_for_address_phase_2';
                    break;

                case 'waiting_for_address_phase_2':
                    orderPayloadInstance.address.number = message.body
                    await messageSender(client, address3MessageParams)
                    conversationState = 'waiting_for_address_phase_3';
                    break;

                case 'waiting_for_address_phase_3':
                    orderPayloadInstance.address.cep = message.body

                    // sets travel info base on given user input
                    const travelParameters = await setTravelParameters(orderPayloadInstance.address.street, orderPayloadInstance.address.number, orderPayloadInstance.address.cep)
                    
                    if (travelParameters == 'NOT_FOUND') {
                        await messageSender(client, deliveryNotFoundMessageParams)
                        conversationState = 'waiting_for_action_on_address_not_found'

                    } else if (orderPayloadInstance.address.distance > process.env.MAX_DELIVERY_RANGE_IN_KM) {
                        await messageSender(client, deliveryNotInRangeMessageParams)
                        conversationState = 'waiting_for_action_on_address_not_in_range'

                    } else { 
                        orderPayloadInstance.address.cep = message.body
                        address4MessageParams.content = await createButtonsFullAddress()
                        await messageSender(client, address4MessageParams)
                        conversationState = 'waiting_for_address_phase_4';
                    }
                    break;

                    case 'waiting_for_action_on_address_not_found':
                        if (message.selectedButtonId == 'reset_delivery') {
                            deliveryReset()
                            await messageSender(client, introMessageParams)
                            conversationState = 'start_delivery';
                        }
                        break;

                    case 'waiting_for_action_on_address_not_in_range':
                        if (message.selectedButtonId == 'reset_delivery') {
                            deliveryReset()
                            await messageSender(client, introMessageParams)
                            conversationState = 'start_delivery';

                        } else if (message.selectedButtonId == 'cancel_order') {
                            await messageSender(client, cancelledMessageParams)
                            conversationState = 'finish_delivery';
                            return;
                        }
                        break;

                case 'waiting_for_address_phase_4':
                    if (message.selectedButtonId == 'full_address_recommended') {
                        // recommended address is already assigned to fullAddress

                    } else if (message.selectedButtonId == 'full_address_given') {
                        orderPayloadInstance.address.fullAddress = `${orderPayloadInstance.address.street}, Nº ${orderPayloadInstance.address.number}, CEP ${orderPayloadInstance.address.cep}`
                    }

                    await messageSender(client, address5MessageParams)
                    conversationState = 'waiting_for_address_phase_5';
                    break;

                case 'waiting_for_address_phase_5':
                    if (message.selectedButtonId == 'additionalAddressInformation_yes') {
                        await messageSender(client, address6MessageParams)
                        conversationState = 'waiting_for_address_phase_6';

                    } else if (message.selectedButtonId == 'additionalAddressInformation_no') {
                        finalConfirmationMessageParams.content = await createButtonsFinalConfirmation()
                        await messageSender(client, finalConfirmationMessageParams)
                        conversationState = 'waiting_for_final_confirmation';
                    }
                    break;

                case 'waiting_for_address_phase_6':
                    orderPayloadInstance.address.additionalAddressInformation = message.body
                    finalConfirmationMessageParams.content = await createButtonsFinalConfirmation()
                    await messageSender(client, finalConfirmationMessageParams)
                    conversationState = 'waiting_for_final_confirmation';
                    break;

                case 'waiting_for_final_confirmation':
                    if (message.selectedButtonId == 'confirm_delivery') {
                        paymentPhase(client, orderPayloadInstance)
                        conversationState = 'finish_delivery';
                        
                    } else if (message.selectedButtonId == 'reset_delivery') {
                        deliveryReset()
                        await messageSender(client, introMessageParams)
                        conversationState = 'start_delivery';
                    }
                    break;
                    
                case 'finish_delivery':
                    //await messageSender(client, finishedMessageParams)
                    break;

                default:
                    console.error('Invalid conversation state:', conversationState);
                    break;
            }
        }
    })
}

module.exports = deliveryPhase;