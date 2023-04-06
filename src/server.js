const express = require('express');
const httpProxy = require('express-http-proxy');
const fs = require("fs");
const path = require('path');
require("dotenv").config()
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require('helmet')
const mongoSanitize = require("express-mongo-sanitize")
const httpsOptions = {
    cert: fs.readFileSync('/etc/letsencrypt/live/api-semfila.api-semfila.online/fullchain.pem'), // Certificado fullchain do dominio
    key: fs.readFileSync('/etc/letsencrypt/live/api-semfila.api-semfila.online/privkey.pem'), // Chave privada do domínio
    ca: fs.readFileSync(path.resolve(__dirname, `./config/certs/${process.env.GN_WEBHOOK}`)), // Certificado público da Gerencianet
    minVersion: "TLSv1.2",
    requestCert: true,
    rejectUnauthorized: false, //Mantenha como false para que os demais endpoints da API não rejeitem requisições sem MTLS
};

class Server {
    constructor() {
        this.app = express();
        this.port = 443;
        this.app.use(cors());
        this.app.use(helmet());
        this.app.use(mongoSanitize())
        this.app.disable('x-powered-by')
        this.app.use(bodyParser.json({ limit: '10mb' }));
        this.app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
        this.server = require("https").createServer(httpsOptions, this.app);
        const {
            ADMIN_PORT,
            FRONT_PORT,
            LOGIN_PORT,
            QRCODE_PORT,
            CRUD_PORT,
            ENTRANCE_PORT
        } = process.env;
        this.AdminServiceProxy = httpProxy('http://localhost:' + ADMIN_PORT);
        this.FrontServiceProxy = httpProxy('http://localhost:' + FRONT_PORT);
        this.LoginServiceProxy = httpProxy('http://localhost:' + LOGIN_PORT);
        this.QrCodeServiceProxy = httpProxy('http://localhost:' + QRCODE_PORT);
        this.CrudServiceProxy = httpProxy('http://localhost:' + CRUD_PORT);
        this.EntranceServiceProxy = httpProxy('http://localhost:' + ENTRANCE_PORT);
        this.app.use('/admin', (req, res, next) => this.AdminServiceProxy(req, res, next));
        this.app.use('/frontService', (req, res, next) => this.FrontServiceProxy(req, res, next));
        this.app.use('/auth', (req, res, next) => this.LoginServiceProxy(req, res, next));
        this.app.use('/qrcode', (req, res, next) => this.QrCodeServiceProxy(req, res, next));
        this.app.use('/crud', (req, res, next) => this.CrudServiceProxy(req, res, next));
        this.app.use('/payment', (req, res, next) => this.EntranceServiceProxy(req, res, next));
        console.log("Inicializado")
    }

    getApp(){
        return this.app
    }
    getServer(){
        return this.server;
    }
}

module.exports = Server