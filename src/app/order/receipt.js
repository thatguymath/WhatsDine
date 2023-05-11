const express = require('express');
const consoleFormatter = require('../../util/consoleFormatter');
const path = require('path');

function receipt(orderPayloadInstance) {
    const app = express();

    app.set('view engine', 'ejs');
    app.set("views", path.join(__dirname, "../views"));

    app.get('/receipt', (req, res) => {
        res.render('receipt', { orderPayloadInstance });
    });

    app.listen(3000, () => {
        console.log(consoleFormatter('blue', 'LOGIN', `Recibo da venda disponível em http://localhost:3000/receipt`))
    });

}

module.exports = receipt;