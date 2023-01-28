const { Client, LocalAuth } = require('whatsapp-web.js');
const consoleFormatter = require('../util/consoleFormatter');
const authentication = require('./login/authentication');
const userInputHandler = require('./chatting/userInputHandler');

function spawnNewClient() {
    //Set client settings before initialization; puppeteer args are set to '--single-process', '--no-zygote','--no-sandbox' for high compatibility with linux and VPS hosting
    const client = new Client({
        authStrategy: new LocalAuth({dataPath: './lib/WWebJS'}),
        authTimeoutMs: 300000,
        puppeteer: { headless: true, args: ['--single-process', '--no-zygote','--no-sandbox'] }
    });

    console.log(consoleFormatter('blue', 'SISTM', `O sistema está sendo iniciado!`))
    
    //Initialize session with given settings and parameters  
    client.initialize();

    //Athenticate the client using QRCode and express server with hosted locally
    authentication(client);
    
    //Fired after authentication is successful and system is connected to WhatsApp API
    client.on('ready', async () => {
        console.log(consoleFormatter('blue', 'SISTM', `O sistema está conectado ao WhatsApp!`))
    });

    //Listen to and handle user message inputs
    userInputHandler(client)
}

module.exports = spawnNewClient;