:brazil:
# WhatsDine - Chatbot via Whatsapp para Delivery
Este projeto apresenta um sistema de delivery desenvolvido com base no aplicativo de troca de mensagens WhatsApp, a fim de facilitar o processo de venda entre clientes e restaurantes de pequeno porte. Com a popularidade massiva e gratuidade do aplicativo WhatsApp, que alcança 99% da população brasileira com acesso a smartphones, é plausível o oferecimento de uma solução que aproveite as funcionalidades da ferramenta de forma acessível para os stakeholders envolvidos nesse tipo de venda recorrente.

Quer saber mais? Veja em https://repositorio.unesp.br/handle/11449/244406

## Instalação
```
git clone https://github.com/thatguymath/WPP-DeliveryChatbot.git
cd WPP-DeliveryChatbot  
npm install  
```

## Utilização
Antes de executar o projeto, você precisa configurar um arquivo `.env` no diretório raiz do projeto com as seguintes variáveis:

- LOCALHOST_PORT define a porta na qual o aplicativo será executado;
- MAX_DELIVERY_RANGE_IN_KM define o range máximo para delivery das entregas, em kilômetros;
- PRICE_PER_KILOMETER define o preço por kilômetro percorrido;
- ESTIMATED_PREPARING_TIME define o tempo médio de preparo;
- RESTAURANT_ADDRESS define o endereço do restaurante (cozinha);
- GOOGLE_API_KEY define a chave da API Google Matrix Maps;
- EFI_CLIENT_ID & EFI_CLIENT_SECRET definem as credenciais de acesso ao endpoint EFI;
- EFI_CERTIFICATE_FILENAME define o nome do certificado gerado pela EFI;
- EFI_RECEIVER_PIX_KEY define a chave de recebimento das transferências Pix;
- EFI_ENDPOINT é o endpoint da API EFI, pré-estabelecido para endpoint de produção.

Então, para iniciar o projeto, execute:  
`npm start` ou `node .`  

--

:us:
# WhatsDine - Whatsapp Chatbot for Delivery
This project presents a delivery system developed based on the messaging application WhatsApp, in order to facilitate the sales process between customers and small restaurants. With the massive popularity and free to use nature of WhatsApp, reaching 99% of the Brazilian population with access to smartphones, it is plausible to offer a solution that takes advantage of its features in an accessible way for stakeholders involved in this kind of recurring sales.

Want to know more? Check it on https://repositorio.unesp.br/handle/11449/244406

## Installation
```
git clone https://github.com/thatguymath/WPP-DeliveryChatbot.git
cd projectname  
npm install  
```

## Usage
Before running the project, you need to set up a `.env` file in the root directory of the project with the following variables:
LOCALHOST_PORT=8000
CLIENT_NUMBER=<number with area code>

- LOCALHOST_PORT sets the port on which the application will run on;
- MAX_DELIVERY_RANGE_IN_KM sets the max range for deliveries, in kilometers;
- PRICE_PER_KILOMETER sets the price per kilometer traveled;
- ESTIMATED_PREPARING_TIME sets the average prep time;
- RESTAURANT_ADDRESS sets the restaurant address;
- GOOGLE_API_KEY sets the Google Maps Matrix API key;
- EFI_CLIENT_ID & EFI_CLIENT_SECRET sets the EFI endpoint credentials;
- EFI_CERTIFICATE_FILENAME sets the EFI certificate filename;
- EFI_RECEIVER_PIX_KEY sets the Pix payment receiver key;
- EFI_ENDPOINT is the EFI API endpoint, preset as production.

Then, to start the project, run:  
`npm start` or `node .`
