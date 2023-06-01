const generateQr = require('./qrHandler');

function authenticateClient(client) {
    client.on('qr', async (qr) => {
        //This event will not be fired if a session is specified in clientSession
        generateQr(qr)
    });
    
    client.on('auth_failure', async msg => {
        //This event is fired if something went wrong with session restore
        console.log(global.consoleFormatter('red', 'LOG', `Autenticação com o WhatsApp falhou. Nova tentativa em 1 minuto.`))

        setTimeout(() => {
            client.initialize()
        }, 60000);
    });
}

module.exports = authenticateClient;