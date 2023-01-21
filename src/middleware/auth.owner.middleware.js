const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');
const userModel = require("../models/user.model")
const user_StoreModel = require("../models/user_store.model")


module.exports = (req, res, next) => {
    const authHeader = JSON.parse(req.headers.authorization);
    //console.log(authHeader)
    if(!authHeader)
        return res.status(401).send({msg:"Autenticação invalida!", error:'Token não foi informado', success:false });

    const parts = authHeader.split(' ');
    
    if(!parts.length === 2)
        return res.status(401).send({ error:'Token error', success:false , msg:'Entre novamente'  });

    const [ scheme, token ] = parts;

    if(!/^Bearer$/i.test(scheme))
        return res.status(401).send({ error:'Token formato inválido', success:false, msg:'Entre novamente'   });

    jwt.verify(token, authConfig.secret, async (err, decoded) =>  {
        if(err) return res.status(401).send({ error: 'Token inválido', success:false, msg:'Entre novamente' });
        /*
         
        */
        const user = await userModel.findById({ _id: decoded.id});
        if(user){
            var user_store = await user_StoreModel.findOne( {company_id:decoded.company_id, user_id: user._id})
            if(user_store){
                req.authenticate = false;
                if(user_store.type === 'dono'){
                    console.log(user_store)
                    req.userID = decoded.id;
                    req.company_id = decoded.company_id;
                    req.userName = decoded.user_name
                    req.stores= decoded.stores
                    req.authenticate = true;
                }
                
            }else{
                req.authenticate = false;
            }
        }
            
       
        res.header("Access-Control-Allow-Origin", "*");
        return next();
    })

};