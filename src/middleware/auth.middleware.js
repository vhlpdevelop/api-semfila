const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');


module.exports = (req, res, next) => {
    const authHeader = JSON.parse(req.headers.authorization);
    //console.log(authHeader)
    if(!authHeader)
        return res.send({msg:"Autenticação invalida!", error:'Token não foi informado', success:false });

    const parts = authHeader.split(' ');
    
    if(!parts.length === 2)
        return res.send({ error:'Token error', success:false , msg:'Entre novamente'  });

    const [ scheme, token ] = parts;

    if(!/^Bearer$/i.test(scheme))
        return res.send({ error:'Token formato inválido', success:false, msg:'Entre novamente'   });

    jwt.verify(token, authConfig.secret, (err, decoded) => {
        if(err) return res.status(401).send({ error: 'Token inválido', success:false, msg:'Entre novamente' });

        req.userID = decoded.id;
        req.company_id = decoded.company_id;
        req.userName = decoded.user_name
        req.stores= decoded.stores
        res.header("Access-Control-Allow-Origin", "*");
        console.log("Passou por tudo")
        return next();
    })

};