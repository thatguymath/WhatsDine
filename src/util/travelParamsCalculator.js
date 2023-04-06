const { Client } = require('@googlemaps/google-maps-services-js');
const moment = require('moment-timezone');
moment.tz.setDefault('America/Sao_Paulo');

const client = new Client({});

function calculateTravelParameters(destination) {
    return new Promise((resolve, reject) => {
        client.distancematrix({
        params: {
            origins: [process.env.RESTAURANT_ADDRESS],
            destinations: destination,
            units: 'metric',
            traffic_model: 'best_guess',
            language: 'pt-BR',
            departure_time: moment(new Date()).add(process.env.ESTIMATED_PREPARING_TIME, 'minutes').toDate(),
            key: process.env.GOOGLE_API_KEY,
        },
        timeout: 1000, // milliseconds
        })
        .then((response) => {
            const distance = response.data.rows[0].elements[0].distance.text;

            const durationWithTraffic = response.data.rows[0].elements[0].duration_in_traffic.text;
            const durationWithoutTraffic = response.data.rows[0].elements[0].duration.text; // routes with little to no traffic may not return estimated travel times, so we need this

            const duration = durationWithTraffic ? durationWithTraffic : durationWithoutTraffic

            resolve ({ distance: distance, duration: duration })
        })
        .catch((err) => {
            reject(err);
        });
    })
}

module.exports = calculateTravelParameters;