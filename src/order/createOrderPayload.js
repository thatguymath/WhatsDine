const itemsChoosing = require('./itemsChoosing');

const path = require('path');
const fileName = path.basename(__filename, path.extname(__filename));

function createOrderPayload(client, message, chat, order) {

    class orderPayload {
        constructor(message, chat, order) {
            this.checkoutPhase = fileName,
            this.userId = message.from/* .split('@')[0] */,
            this.name = message._data?.notifyName,
            this._cpf = '',
            this.userNumber = message.from,
            this.order = {
                id: message.orderId,
                createdAt: order.createdAt,
                total: new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2 }).format(order.total/1000),
                items: order.products.map( product => {
                    return {
                        id: product.id,
                        name: product.name,
                        quantity: product.quantity,
                        price: new Intl.NumberFormat('en-US', { style: 'decimal', minimumFractionDigits: 2 }).format(product.price/1000)
                    }
                })
            },
            this._additionalOrderInformation = '',
            this._isTakeOut = false,
            this._deliveryFee = 0.00
            this._address = {
                street: '',
                number: '',
                additionalAddressInformation: '',
                city: '',
                cep: ''
            },
            this._payment = {
                method: '',
                changeForAmmount: ''
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
            return this._additionalOrderInformation;
        }

        set additionalOrderInformation(value) {
            this._additionalOrderInformation = value;
        }

        // isTakeOut GetSet Pair
        get isTakeOut() {
            return this._isTakeOut;
        }

        set isTakeOut(value) {
            this._isTakeOut = value;
        }

        // deliveryFee GetSet Pair
        get deliveryFee() {
            return this._deliveryFee;
        }

        set deliveryFee(value) {
            this._deliveryFee = value;
        }

        // address GetSet Pair
        get address() {
            return this._address;
        }
        set address(newAddress) {
            this._address.street = newAddress.street;
            this._address.number = newAddress.number;
            this._address.additionalAddressInformation = newAddress.additionalAddressInformation;
            this._address.city = newAddress.city;
            this._address.cep = newAddress.cep;
        }

        // payment GetSet Pair
        get payment() {
            return this._payment;
        }
        set payment(value) {
            this._payment.method = value.method;
            this._payment.changeForAmmount = value.changeForAmmount;
        }
    }

    const orderPayloadInstance = new orderPayload(message, chat, order);
    
    itemsChoosing(client, orderPayloadInstance)
}

module.exports = createOrderPayload;