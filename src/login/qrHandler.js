const express = require('express');
const qr = require('qr-image');
const consoleFormatter = require('../../util/consoleFormatter');

function generateQr(qrText) {
    const app = express();

    app.get('/qr', (req, res) => {
        const qr_svg = qr.image(qrText, { type: 'svg', size: 7 });
        res.type('svg');
        qr_svg.pipe(res);
    });

    app.listen(process.env.LOCALHOST_PORT, () => {
        console.log(consoleFormatter('blue', 'LOGIN', `Escaneie o QR Code em http://localhost:${process.env.LOCALHOST_PORT}/qr`))
    });
}

module.exports = generateQr;