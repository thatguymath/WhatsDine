const consoleFormatter = require('../../util/consoleFormatter');
const createOrderPayload = require('../order/createOrderPayload');

function userInputHandler(client) {
    //Fired after a new message is received
    client.on('message', async message => {
        // Ignore any group messages, so only private messages are accepted
        const chat = await message.getChat();
        if (chat.isGroup) return;

        // If message type is order
        if (message.type == 'order') {
            const order = await message.getOrder()
            createOrderPayload(client, message, chat, order)
        }
    });
}

module.exports = userInputHandler;