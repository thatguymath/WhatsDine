:brazil:
# Chatbot via Whatsapp para Delivery
Este projeto apresenta um sistema de delivery desenvolvido com base no aplicativo de troca de mensagens WhatsApp, a fim de facilitar o processo de venda entre clientes e restaurantes de pequeno porte. Com a popularidade massiva e gratuidade do aplicativo WhatsApp, que alcança 99% da população brasileira com acesso a smartphones, é plausível o oferecimento de uma solução que aproveite as funcionalidades da ferramenta de forma acessível para os stakeholders envolvidos nesse tipo de venda recorrente.

## Instalação
```
git clone https://github.com/thatguymath/WPP-DeliveryChatbot.git
cd WPP-DeliveryChatbot  
npm install  
```

## Utilização
Antes de executar o projeto, você precisa configurar um arquivo `.env` no diretório raiz do projeto com as seguintes variáveis:
LOCALHOST_PORT=8000
CLIENT_NUMBER=<número com ddd>

- LOCALHOST_PORT define a porta na qual o aplicativo será executado;
- CLIENT_NUMBER define o número do restaurante que o aplicativo usará;

Então, para iniciar o projeto, execute:  
`npm start` ou `node .`  

--

:us:
# Whatsapp Chatbot for Delivery
This project presents a delivery system developed based on the messaging application WhatsApp, in order to facilitate the sales process between customers and small restaurants. With the massive popularity and free to use nature of WhatsApp, reaching 99% of the Brazilian population with access to smartphones, it is plausible to offer a solution that takes advantage of its features in an accessible way for stakeholders involved in this kind of recurring sales.

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

- LOCALHOST_PORT variable sets the port that the application will run on
- CLIENT_NUMBER variable sets the restaurant number that the application will use

Then, to start the project, run:  
`npm start` or `node .`  
