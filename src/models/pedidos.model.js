const { Schema, model } = require("mongoose");
const pedido = new Schema({
  items: [],
  txid: {type:String},
  status: {type:Boolean, default: false},
  socket: {type:String},
  loc_id: {type:String},
  user_id: {type:String},
  user_email: {type:String},
  price: {type: String},
  cortesia: {type: Boolean, default: false},
  company_id: {type: String},
  store_id: {type:String},
  store_name: {type:String},
  createdAt:{ type: Date, default: Date.now }
});

module.exports = model("Pedido", pedido);
