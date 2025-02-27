const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');


module.exports = (req, res, next) => {
    const authHeader = JSON.parse(req.headers.authorization);
    //console.log(authHeader)
    if(!authHeader)
        return res.status(401).send({msg:"Autenticação invalida!", error:'Token não foi informado' });

    const parts = authHeader.split(' ');
    
    if(!parts.length === 2)
        return res.status(401).send({ error:'Token error' });

    const [ scheme, token ] = parts;

    if(!/^Bearer$/i.test(scheme))
        return res.status(401).send({ error:'Token formato inválido' });

    jwt.verify(token, authConfig.Admin, (err, decoded) => {
        if(err) return res.status(401).send({ error: 'Token inválido', err: err });

        req.userID = decoded.id;
       

        return next();
    })

};