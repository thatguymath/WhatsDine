const express = require('express');
const qr = require('qr-image');

function generateQr(qrText) {
    const app = express();

    app.get('/qr', (req, res) => {
        const qr_svg = qr.image(qrText, { type: 'svg', size: 7 });
        res.type('svg');
        qr_svg.pipe(res);
    });

    app.listen(process.env.LOCALHOST_PORT, () => {
        console.log(global.consoleFormatter('yellow', 'LOG', `Com o app de WhatsApp do Restaurante, vá na aba 'Aparelhos conectados' e prepare-se para ler o QR Code.`))
        console.log(global.consoleFormatter('yellow', 'LOG', `Aperte em 'Adicionar dispositivo', clique neste link: http://localhost:${process.env.LOCALHOST_PORT}/qr e faça a leitura com a câmera.`))
    });
}

module.exports = generateQr;