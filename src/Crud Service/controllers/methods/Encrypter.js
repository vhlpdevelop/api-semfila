const Cryptojs = require("crypto-js");
const secret = 'SemFilaAppQrCode'

const Crypto = {
    encrypt : (item) => {
        return Cryptojs.AES.encrypt(JSON.stringify({ item }), secret).toString()
        
    },
    decrypt : (item) => {

        return JSON.parse(Cryptojs.AES.decrypt(item, secret).toString(Cryptojs.enc.Utf8))
    },

}

module.exports = Crypto