const consoleFormatter = require('../../util/consoleFormatter');
const createShoppingCart = require('../order/createShoppingCart');

function userInputHandler(client) {
    //Fired after a new message is received
    client.on('message', async message => {
        // Ignore any group messages, so only private messages are accepted
        const chat = await message.getChat();
        if (chat.isGroup) return;

        // If message type is order
        if (message.type == 'order') {
            const order = await message.getOrder()
            createShoppingCart(client, message, chat, order)
        }
    });
}

module.exports = userInputHandler;