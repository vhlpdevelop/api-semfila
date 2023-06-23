const axios = require("axios")
require("dotenv").config()
module.exports = {
  async CreateOrder(items_second, pedido, phone, contract, id) {
    var request = buildOrder(items_second, pedido, phone, contract, id)
    var pixCode = {
      qrcode: "",
      imagemQrcode: "",
      order_id: "",
      success: false,
      pix_charge_id: ""
    }
    await axios
      .post(`https://api.pagar.me/core/v5/orders`, request, {
        auth: {
          username: PAGARME_SECRET,
          password: "",
        },
      })
      .then(async (order) => {
        let data = order.data
        pixCode.order_id = data.id
        pixCode.qrcode = data.charges[0].last_transaction.qr_code
        pixCode.imagemQrcode = data.charges[0].last_transaction.qr_code_url
        pixCode.success = true;
        pixCode.pix_charge_id = data.charges[0].id
        console.log("Resultado ===>")
        console.log(order.data)

      })
      .catch((err) => {
        console.log(err);

      });
    return pixCode

  },
}

const {
  PAGARME_SECRET
} = process.env


function buildOrder(items_second, pedido, phone, contract, id) {
  console.log(id)
  const request = {
    "items": items_second,
    "customer": {
      "name": "Consumidor",
      "email": "none@none.none",
      "type": "individual",
      "document": "01234567890",
      "phones": {
        "mobile_phone": {
          "country_code": "55",
          "number": phone.substr(2),
          "area_code": phone.substr(0, 2)
        }
      }
    },
    "payments": [
      {
        "payment_method": "pix",
        "pix": {
          "expires_in": "3600",
          "additional_information": [
            {
              "name": `Número do pedido ${pedido._id}`,
              "value": "0"
            }
          ]
        },
        /*
        "split" : [
      {
        "amount": contract.tax,
        "recipient_id": "re_cli0mncj2024k019tqxvlurws",
        "type": "percentage",
        "options": {
          "charge_processing_fee": true,
          "charge_remainder_fee": true,
          "liable": true
        }
      },
      {
        "amount": 100-parseFloat(contract.tax),
        "type": "percentage",
        "recipient_id": id,
        "options": {
          "charge_processing_fee": false,
          "charge_remainder_fee": false,
          "liable": false
        }
      }
    ]
        */


      }
    ]

  }
  if (id) {
    request.payments[0].split = [
      {
        "amount": contract.tax,
        "recipient_id": "re_cli0mncj2024k019tqxvlurws", //CHAVE PROD MARKETPLACE PROD ==>re_clhzl359q4d8f019td3a2kd6o
        "type": "percentage",
        "options": {
          "charge_processing_fee": true,
          "charge_remainder_fee": true,
          "liable": true
        }
      },
      {
        "amount": 100 - parseFloat(contract.tax),
        "type": "percentage",
        "recipient_id": id,
        "options": {
          "charge_processing_fee": false,
          "charge_remainder_fee": false,
          "liable": false
        }
      }
    ]
  }
  console.log(request)
  return request
}