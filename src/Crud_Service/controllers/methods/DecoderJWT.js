const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth');


module.exports = (item) => {
    const authHeader = JSON.parse(item.authorization);
    console.log(authHeader)
    if(!authHeader)
        return {msg:"Autenticação invalida!", success:false };

    const parts = authHeader.split(' ');
    
    if(!parts.length === 2)
        return { msg:'Token error',success:false };

    const [ scheme, token ] = parts;

    if(!/^Bearer$/i.test(scheme))
        return { msg:'Token formato inválido',success:false };

    jwt.verify(token, authConfig.secret, (err, decoded) => {
        if(err) return { msg:'Token inválido',success:false };
        console.log(decoded)
        item.obj = {id:decoded.id, success:true}
    })

};