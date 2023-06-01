const itemsPhase = require('./itemsPhase');

const path = require('path');
const fileName = path.basename(__filename, path.extname(__filename));

function createOrderPayload(client, message, chat, order) {

    class orderPayload {
        constructor(message, chat, order) {
            this.cartOrderId = message.orderId,
            this.checkoutPhase = fileName,
            this.userId = message.from/* .split('@')[0] */,
            this.name = message._data?.notifyName,
            this._cpf = '',
            this.order = {
                createdAt: new Date(1000*order.createdAt), // UNIX' secs epoch to Javascript millisecs epoch
                itemsTotal: new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2 }).format(order.total/1000),
                items: order.products.map( product => {
                    return {
                        id: product.id,
                        name: product.name,
                        quantity: product.quantity,
                        price: new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2 }).format(product.price/1000)
                    }
                }),
                _additionalOrderInformation: ''
            },
            this.delivery = {
                _isTakeOut: false,
                _serviceAproxTime: '',
                _deliveryFee: 0.00,
                _address: {
                    street: '',
                    number: '',
                    cep: '',
                    fullAddress: '',
                    additionalAddressInformation: '',
                    distance: '',
                    travelTime: ''
                }
            },
            this.payment = {
                _totalValue: '',
                info: {
                    _method: '',
                    _changeForAmount: '',
                    _pixTxId: '',
                    _isPaid: false
                }
            }
        }
        
        // CPF GetSet Pair
        get cpf() {
            return this._cpf;
        }

        set cpf(value) {
            this._cpf = value;
        }

        // additionalOrderInformation GetSet Pair
        get additionalOrderInformation() {
            return this.order._additionalOrderInformation;
        }

        set additionalOrderInformation(value) {
            this.order._additionalOrderInformation = value;
        }

        // isTakeOut GetSet Pair
        get isTakeOut() {
            return this.delivery._isTakeOut;
        }

        set isTakeOut(value) {
            this.delivery._isTakeOut = value;
        }

        // serviceAproxTime GetSet Pair
        get serviceAproxTime() {
            return this.delivery._serviceAproxTime;
        }

        set serviceAproxTime(value) {
            this.delivery._serviceAproxTime = value;
        }

        // deliveryFee GetSet Pair
        get deliveryFee() {
            return this.delivery._deliveryFee;
        }

        set deliveryFee(value) {
            this.delivery._deliveryFee = value;
        }

        // address GetSet Pair
        get address() {
            return this.delivery._address;
        }
        set address(value) {
            this.delivery._address.street = value.street;
            this.delivery._address.number = value.number;
            this.delivery._address.cep = value.cep;
            this.delivery._address.fullAddress = value.fullAddress;
            this.delivery._address.additionalAddressInformation = value.additionalAddressInformation;
            this.delivery._address.distance = value.distance;
            this.delivery._address.travelTime = value.travelTime;
        }

        // payment GetSet Pair
        get totalValue() {
            return this.payment._totalValue;
        }
        set totalValue(value) {
            this.payment._totalValue = value;
        }

        // payment method GetSet Pair
        get method() {
            return this.payment.info._method;
        }
        set method(value) {
            this.payment.info._method = value;
        }

        // payment changeForAmount GetSet Pair
        get changeForAmount() {
            return this.payment.info._changeForAmount;
        }
        set changeForAmount(value) {
            this.payment.info._changeForAmount = value;
        }

        // payment pixTxId GetSet Pair
        get pixTxId() {
            return this.payment.info._pixTxId;
        }
        set pixTxId(value) {
            this.payment.info._pixTxId = value;
        }

        // payment isPaid GetSet Pair
        get isPaid() {
            return this.payment.info._isPaid;
        }
        set isPaid(value) {
            this.payment.info._isPaid = value;
        }
    }

    const orderPayloadInstance = new orderPayload(message, chat, order);
    
    itemsPhase(client, orderPayloadInstance)
}

module.exports = createOrderPayload;