function messageSender(client, messageParams) {
    client.sendMessage(messageParams.userId, messageParams.content, messageParams.options)
}

module.exports = messageSender;