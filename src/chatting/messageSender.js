function messageSender(client, messageParams) {
    client.sendMessage(messageParams.userId, messageParams.content)
}

module.exports = messageSender;