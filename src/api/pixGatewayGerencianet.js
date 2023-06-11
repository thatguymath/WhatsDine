const axios = require('axios');
const fs = require('fs');
const https = require('https');

var certificado = fs.readFileSync(`./src/certificates/${process.env.EFI_CERTIFICATE_FILENAME}`);

const agent = new https.Agent({
  pfx: certificado,
  passphrase: ''
});

const authenticateCredentials = ({ clientID, clientSecret }) => {
  try {
    const credentials = Buffer.from(
      `${clientID}:${clientSecret}`
    ).toString('base64');
  
    return axios({
      method: 'POST',
      url: `${process.env.EFI_ENDPOINT}/oauth/token`,
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      httpsAgent: agent,
      data: {
        grant_type: 'client_credentials'
      }
    });
  } catch (err) {
    console.error(err)
  }
};


const requestEFI_API = async (credentials) => {
  try {
    const authResponse = await authenticateCredentials(credentials);
    const accessToken = authResponse.data?.access_token;
  
    return axios.create({
      baseURL: process.env.EFI_ENDPOINT,
      httpsAgent: agent,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    console.error(err)
  }
}

module.exports = requestEFI_API;