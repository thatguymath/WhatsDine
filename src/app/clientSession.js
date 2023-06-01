const { Client, LocalAuth, Buttons, MessageMedia } = require('whatsapp-web.js');
global.Client = Client;
global.LocalAuth = LocalAuth;
global.Buttons = Buttons;
global.MessageMedia = MessageMedia;

const authentication = require('./login/authentication');
const userInputHandler = require('./chatting/userInputHandler');

global.consoleFormatter = require('../util/consoleFormatter');

//Set client settings before initialization; puppeteer args are set to '--single-process', '--no-zygote','--no-sandbox' for high compatibility with linux and VPS hosting
const client = new Client({
    authStrategy: new LocalAuth({dataPath: './lib/WWebJS'}),
    authTimeoutMs: 300000,
    puppeteer: { headless: true, args: ['--single-process', '--no-zygote','--no-sandbox'] }
});

console.log(global.consoleFormatter('blue', 'LOG', `O sistema está sendo iniciado`))

//Initialize session with given settings and parameters  
client.initialize();

//Authenticate the client using QRCode and express server with hosted locally
authentication(client);

//Fired after authentication is successful and system is connected to WhatsApp API
client.on('ready', async () => {
    console.log(global.consoleFormatter('green', 'LOG', `O sistema está conectado ao WhatsApp`))

    //Starts polling from pix API to catch new payments
    require('./payment/pixPolling')
    console.log(global.consoleFormatter('blue', 'LOG', `Iniciando rotina de polling da API Pix`))
});

//Listen to and handle user message inputs
userInputHandler(client)

module.exports = { client };