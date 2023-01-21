
const bcrypt = require('bcrypt');

const { Schema, model } = require('mongoose');
const User = new Schema({
  email: { type: String, required:true},
  name: { type:String},
  type: { type:String},
  phone: {type:String},
  cpf: {type:String},
  profile: { type: Array, default: []},
  type_status: {type:Boolean}, //Caso seja um emp e esteja Validado
  password: { type: String, required: true, select: false },
  pss_ResetToken: {type: String, select:false},
  verifyEmail: {type: Boolean},
  verifyToken: {type:String},
  createdAt:{ type: Date, default: Date.now }
});

User.pre('save', async function(next){
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
})

module.exports = model('User', User);
