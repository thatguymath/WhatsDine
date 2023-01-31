const chalk = require('chalk');
const moment = require('moment-timezone');
moment.tz.setDefault('America/Sao_Paulo');

function formatter(color, header, content) {
    var logging = `${chalk[color](`[${header}]`)} ${moment().format('DD/MM/YYYY - HH:mm:ss')} | ${content}`;
    return logging;
}

module.exports = formatter;