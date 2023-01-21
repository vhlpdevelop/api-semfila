const qr = require("qr-image");
module.exports = {
  async createQrcoder(object) {
    //TESTE
    var texto = "NOLINE//";
    texto += "_id:" + object._id + "/store_id:" + object.store_id;
    const code = qr.imageSync(JSON.stringify(texto), { type: 'png', size : 10 });
    
    return code;
  },
};
