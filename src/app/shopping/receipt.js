const express = require('express');
const path = require('path');

function receipt(orderPayloadInstance) {
    const app = express();

    app.set('view engine', 'ejs');
    app.set("views", path.join(__dirname, "../views"));

    app.get('/receipt', (req, res) => {
        res.render('receipt', { orderPayloadInstance });
    });

    app.listen(3000, () => {
        console.log(global.consoleFormatter('blue', 'LOG', `Recibo da venda disponível em http://localhost:3000/receipt`))
    });

}

module.exports = receipt;