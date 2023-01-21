
const { Schema, model } = require('mongoose');
const Product = new Schema({
        produto: { type: String},
        linha: { type: String},
        tipo: { type: String},
        desc: { type: String},
        preco: { type: String},
        image: [],
});

module.exports = model('Product', Product);