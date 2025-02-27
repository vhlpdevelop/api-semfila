const { Schema, model } = require("mongoose");
const pedido = new Schema({
  items: [],
  txid: { type: String, default: 'none' },
  pix_charge_id: {type:String, default: 'none'},
  charge_id: { type: String, default: 'none' },
  status: { type: Boolean, default: false },
  canceled_amount: {type: String},
  socket: { type: String },
  loc_id: { type: String },
  user_id: { type: String },
  user_phone: { type: String },
  payment: { type: String },
  price: { type: String },
  cortesia: { type: Boolean, default: false },
  company_id: { type: String },
  store_id: { type: String },
  store_name: { type: String },
  transaction_status: { type: String, default: "new" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = model("Pedido", pedido);
