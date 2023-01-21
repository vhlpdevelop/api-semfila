const rateLimit = require('express-rate-limit')

const limiter = {};
const message = "Muitas tentativas, aguarde."
limiter.report = rateLimit({
    windowMS: 1*30*1000,
    max: 3,
    message: message
})
limiter.padrao = rateLimit({
    windowMS: 1*30*1000,
    max: 50,
    message: message
})
limiter.Login_limiter = rateLimit({
        windowMS: 1*60*1000,
        max: 3,
        message:message
})
limiter.Search_store = rateLimit({
    windowMS: 1*60*1000,
    max:50,
    message:message
})
limiter.getStore = rateLimit({
    windowMS: 1*30*1000,
    max:5,
    message:message
})
module.exports = limiter
