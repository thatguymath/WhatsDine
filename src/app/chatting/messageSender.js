async function messageSender(client, messageParams) {
    await client.sendMessage(messageParams.userId, messageParams.content, messageParams.options)
}

module.exports = messageSender;