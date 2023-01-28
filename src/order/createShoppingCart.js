function createShoppingCart(client, message, chat, order) {

    class shoppingCart {
        constructor(message, chat, order) {
            this.userId = message.from.split('@')[0],
            this.name = message._data?.notifyName,
            this._cpf = '',
            this.userNumber = message.from,
            this.order = {
                id: message.orderId,
                createdAt: order.createdAt,
                total: new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2 }).format(order.total/1000),
                items: order.products.map( product => {
                    return {
                        id: product.id,
                        name: product.name,
                        quantity: product.quantity,
                        price: new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2 }).format(product.price/1000)
                    }
                })
            },
            this._isTakeOut = true,
            this._address = {
                street: '',
                number: '',
                additionalInformation: '',
                city: '',
                cep: ''
            }
        }
        
        // CPF GetSet Pair
        get cpf() {
            return this._cpf;
        }

        set cpf(value) {
            this._cpf = value;
        }

        // isTakeOut GetSet Pair
        get isTakeOut() {
            return this._isTakeOut;
        }

        set isTakeOut(value) {
            this._isTakeOut = value;
        }

        // address GetSet Pair
        get address() {
            return this._address;
        }
        set address(newAddress) {
            this._address.street = newAddress.street;
            this._address.number = newAddress.number;
            this._address.additionalInformation = newAddress.additionalInformation;
            this._address.city = newAddress.city;
            this._address.cep = newAddress.cep;
        }
    }

    const cart = new shoppingCart(message, chat, order);
    console.log(cart.order)
}

module.exports = createShoppingCart;