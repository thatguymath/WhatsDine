const chalk = require('chalk');
const moment = require('moment');

function formatter(color, header, content) {
    var logging = `${chalk[color](`[${header}]`)} ${moment().format('DD/MM/YYYY HH:mm:ss Z')} | ${content}`;
    return logging;
}

module.exports = formatter;