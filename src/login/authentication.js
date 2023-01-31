const generateQr = require('./qrHandler');
const consoleFormatter = require('../util/consoleFormatter');

function authenticateClient(client) {
    client.on('qr', async (qr) => {
        //This event will not be fired if a session is specified in clientSessionHandler
        await generateQr(qr)
    });
    
    client.on('authenticated', (session) => {
        console.log(consoleFormatter('green', 'LOGIN', `Autenticação foi realizada com sucesso!`))
    });
    
    client.on('auth_failure', async msg => {
        //This event is fired if something went wrong with session restore
        console.log(consoleFormatter('red', 'LOGIN', `Autenticação falhou, nova tentativa em 1 minuto.`))

        setTimeout(() => {
            client.initialize()
        }, 60000);
    });
}

module.exports = authenticateClient;