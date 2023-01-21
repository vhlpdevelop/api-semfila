const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');

const cert = fs.readFileSync(
  path.resolve(__dirname, `../certs/${process.env.GN_CERT}`)
);

const agent = new https.Agent({
  pfx: cert,
  passphrase: ''
});

const authenticate = ({ clientID, clientSecret }) => {
  const credentials = Buffer.from(
    `${clientID}:${clientSecret}`
  ).toString('base64');

  return axios({
    method: 'POST',
    url: `${process.env.GN_ENDPOINT}/oauth/token`,
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/json'
    },
    httpsAgent: agent,
    data: {
      grant_type: 'client_credentials'
    }
  });
};
const createWebhook = async () => {
  const chave = 'de8d8feb-a41c-47b0-969f-6afa1f35da4f';
  const authResponse = await authenticate({
    clientID: process.env.GN_CLIENT_ID,
    clientSecret: process.env.GN_CLIENT_SECRET,
  });
  const accessToken = authResponse.data?.access_token;
  const certificado = cert;
  const data = JSON.stringify({
    webhookUrl: 'https://api-semfila.api-semfila.online/webhook/pix'
  })
  const agent = new https.Agent({
    pfx: certificado,
    passphrase: '',
  })

  

  const config = {
    method: 'PUT',
    url: process.env.GN_ENDPOINT + '/v2/webhook/' + chave,
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-type': 'application/json',
    },
    httpsAgent: agent,
    data: data,
  }
  const result = await axios(config)
  return result.data
}

const GNRequest = async (credentials) => {
  const authResponse = await authenticate(credentials);
  const accessToken = authResponse.data?.access_token;

  return axios.create({
    baseURL: process.env.GN_ENDPOINT,
    httpsAgent: agent,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });
}

module.exports = {
  GNRequest, createWebhook
}