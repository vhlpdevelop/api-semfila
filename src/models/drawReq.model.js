
const { Schema, model } = require('mongoose');
const drawReq = new Schema({
        user_id: {type:String},
        value: {type:String},
        company_id: {type:String},
        sellRegistries: {type: Array},
        earns: {type:String},
        status:{type:Boolean, default: false},
        createdAt:{ type: Date, default: Date.now }
});

module.exports = model('drawReq', drawReq);