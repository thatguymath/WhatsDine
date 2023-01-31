function UStoBRLFormatter(enUSCurrency) {
    let BRLConverted = parseFloat(enUSCurrency).toFixed(2).toString().replace('.', ',')
    return BRLConverted
}

module.exports = UStoBRLFormatter;