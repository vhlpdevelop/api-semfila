const nodemailer = require("nodemailer")
const path = require('path')
const emailconfig = require("../config/NodeMailer.config")
const hbs = require ('nodemailer-express-handlebars')

const transport = nodemailer.createTransport({
    service: emailconfig.service,
    //port: emailconfig.port,
    auth: { user: emailconfig.user, pass: emailconfig.password}
})

transport.use('compile', hbs({
    viewEngine: {
        extName: '.html',
        partialsDir: path.resolve('./src/resources/mail/auth/'),
        layoutsDir: path.resolve('./src/resources/mail/auth/'),
        defaultLayout: '',
    },
    viewPath: path.resolve('./src/resources/mail/auth/'),
    extName: '.html'
}))

module.exports = transport;