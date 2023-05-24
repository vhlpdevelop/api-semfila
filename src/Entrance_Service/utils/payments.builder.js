const axios = require("axios")
require("dotenv").config()
module.exports={
    async CreateOrder(items_second, pedido, phone, contract){
        var request = buildOrder(items_second, pedido, phone, contract)
        var pixCode = {
            qrcode: "",
            imagemQrcode: "", 
            order_id: "",
            success: false,
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
          pixCode.success=true;
          console.log(pixCode)
          
        })
        .catch((err) => {
          console.log(err);
          
        });
        return pixCode

    }
}

const {
    PAGARME_SECRET
} = process.env

function buildOrder(items_second, pedido, phone, contract){
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
              "area_code": phone.substr(0,1)
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
                  "name": `Número do pedido ${pedido._id}` ,
                  "value": "0"
                }
              ]
            },
            "split": [
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
                "recipient_id": "re_cli0ms72k023y019tmd58fhwf",
                "options": {
                  "charge_processing_fee": false,
                  "charge_remainder_fee": false,
                  "liable": false
                }
              }
            ]
          }
        ]
      }
      return request
}