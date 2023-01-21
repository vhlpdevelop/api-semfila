const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const perfilModel = require('../models/perfil.model');

//PASS PORT NAO ESTA SENDO USADO NO MOMENTO

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader)
        return res.status(401).send({msg:"Autenticação invalida!", error:'Token não foi informado' });

    const parts = authHeader.split(' ');
    
    if(!parts.length === 2)
        return res.status(401).send({ error:'Token error' });

    const [ scheme, token ] = parts;

    if(!/^Bearer$/i.test(scheme))
        return res.status(401).send({ error:'Token formato inválido' });

    jwt.verify(token, authConfig.secret, (err, decoded) => {
        if(err) return res.status(401).send({ error: 'Token inválido' });
        req.perfil = decoded.perf;
        req.userID = decoded.id;
        req.EmpresaID = decoded.idEmpresa;
        

        return next();
    })

};