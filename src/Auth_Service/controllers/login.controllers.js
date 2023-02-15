const User_model = require("../../models/user.model");
const User_store_model = require("../../models/user_store.model");
const company_model = require("../../models/company.model");
const storeModel = require("../../models/store.model");
const bcrypt = require("bcrypt");
const Admin = require("../../models/adminUser.model");
//const mailer = require("../modules/NodeMailer.controllers");
//const mailerconfig = require("../config/NodeMailer.config");
const QrcodesModel = require("../../models/qrCode.model")
const authConfig = require("../../config/auth");
const jwt = require("jsonwebtoken");

function validateEmail(email) {
  var re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

module.exports = {
  async loginAdmin(req, res) {
    const { user, pss } = req.body;
    try {
      const Administrator = await Admin.findOne({ user }).select("+pss");
      //console.log(Administrator)
      if (!Administrator)
        return res.send({ error: "Usuário não encontrado", success: false });

      if (!(await bcrypt.compare(pss, Administrator.pss))) {
        //console.log("entrou aqui")
        return res.send({ msg: "Email ou Senha inválida", success: false });
      }

      const datatoken = jwt.sign(
        { id: Administrator._id, time: Date.now() },
        authConfig.Admin,
        {
          expiresIn: "1 hour",
        }
      );
      rotas = [];
      rotas.push({
        title: "Empresas",
        path: "/empresas",
        icon: "mdi-office-building",
      });
      rotas.push({
        title: "Usuarios",
        path: "/userPainel",
        icon: "mdi-account",
      });
      rotas.push({
        title: "Retiradas",
        path: "/retiradas",
        icon: "mdi-account-cash",
      });
      rotas.push({
        title: "Reports",
        path: "/reports",
        icon: "mdi-alert-box-outline",
      });
      rotas.push({
        title: "Reembolso",
        path: "/reembolso",
        icon: "mdi-cash-refund",
      });
      
      rotas.push({
        title: "Financeiro",
        path: "/financeiro",
        icon: "mdi-certificate-outline",
      });
      res.send({
        success: true,
        token: datatoken,
        msg:"Bem-vindo mestre",
        profile: rotas,
      });
    } catch (error) {
      console.log(error);
      res.status(400).send({
        error: "Não foi possível realizar o login",
        msg: error,
        success: false,
      });
    }
  },
  async loginEmp(req, res) {

    const { user, pss } = req.body;
    try {
      if(!validateEmail(user)){
        return res.send({success:false, msg:"Email inválido"})
      }
      const response = await User_model.findOne({ email: user }).select("+password");

      if (!response)
        return res.send({ error: "Usuário não encontrado", success: false });

      if (!(await bcrypt.compare(pss, response.password))) {
        //console.log("entrou aqui")
        return res.send({ msg: "Email ou Senha inválida", success: false });
      }
      if (!response.verifyEmail) {

        return res.send({
          success: false,
          msg: "Verifique seu Email.",
        });
      }
      if (response.type.trim() === "Common") {
        return res.send({
          success: false,
          msg: "Por favor, entre com uma conta empresarial",
        });
      }

      if (!response.type_status) {

        return res.send({
          success: false,
          msg: "Aguarde, estamos avaliando sua conta",
        });
      }

      let aux = response._id.toString();
      const userStore = await User_store_model.findOne({ user_id: aux });
      //console.log(userStore);
      if (!userStore) {

        return res.send({
          msg: "Usuário não está em uma empresa cadastrada",
          error: "Usuário não está em uma empresa cadastrada",
          success: false,
        });
      }

      const company = await company_model.findOne({
        _id: userStore.company_id,
      });

      if (!company) {
        return res.send({
          error: "Usuário não possui empresa cadastrada",
          success: false,
        });
      }
      if (!company.status) {

        return res.send({
          success: false,
          msg: "Aguarde, estamos avaliando CNPJ da empresa",
        });
      }
      const store = await storeModel.find({ company_id: company._id });
      //console.log("Store->")
      //console.log(store);
      const rotas = [];
      var obj_builder_one = []
      var obj_builder_two = []
      if (userStore.type === "dono") {
        rotas.push({
          title: "Cardapio",
          path: "/cardapio",
          icon: "mdi-folder-text-outline",
        });
        rotas.push({
          title: "Leitor QR CODE",
          path: "/qrcode",
          icon: "mdi-qrcode-scan",
        });
        rotas.push({
          title: "Opções Loja",
          path: "/loja", 
          icon: "mdi-cog"
        })
        rotas.push({
          title: "Cortesia QR CODE",
          path: "/Cortesiaqrcode",
          icon: "mdi-qrcode-plus",
        });
        rotas.push({
          title: "QR CODE",
          path: "/Genqrcode",
          icon: "mdi-qrcode-edit",
        });
        rotas.push({
          title: "Financeiro",
          path: "/financeiro",
          icon: "mdi-finance",
        });
        rotas.push({
          title: "Logistica",
          path: "/logistica",
          icon: "mdi-table-cog",
        });
        rotas.push({
          title: "Minha Conta",
          path: "/conta",
          icon: "mdi-account",
        });
        rotas.push({
          title: "Promoções",
          path: "/promocoes",
          icon: "mdi-lightning-bolt-circle",
        });
        rotas.push({
          title: "Limitador",
          path: "/limitador",
          icon: "mdi-contrast",
        });
        rotas.push({
          title: "Usuários",
          path: "/usuarios",
          icon: "mdi-account",
        });
         obj_builder_one =  [{ title: "Cardapio" }, { title: "QR CODE" }, { title: "Financeiro" }, {title: "Logistica"}]
         obj_builder_two = [
          { title: "QR CODE" },
          { title: "Cardapio" },
          { title: "Loja"},
          { title: "Limitador"},
          { title: "Financeiro" },
          { title: "Usuários" },
          { title: "Logistica"},
          { title: "Minha Conta" },
        ]
      }
      if (userStore.type === 'Func') {
         obj_builder_one = [{ title: "QR CODE" }, {title: "Minha Conta"}]
        obj_builder_two = [{ title: "QR CODE" }, {title: "Minha Conta"}]
        rotas.push({
          title: "Leitor QR CODE",
          path: "/qrcode",
          icon: "mdi-qrcode-scan",
        });
        rotas.push({
          title: "Minha Conta",
          path: "/conta",
          icon: "mdi-account",
        });
      }
      const datatoken = jwt.sign(
        {
          id: response._id,
          company_id: company._id,
          user_name: response.name,
          stores: store,
          time: Date.now(),
        },
        authConfig.secret,
        {
          expiresIn: "6 hour",
        }
      );


      return res.send({
        success: true,
        token: datatoken,
        stores: store,
        company_name: company.company_name,
        obj_builder_one: obj_builder_one,
        obj_builder_two: obj_builder_two,
        user: {
          name: response.name,
          user: response.email,
          type: response.type,
          createdAt: response.createdAt,
        },
        profile: rotas,
        msg: "Sucesso! Estamos redirecionando"
      });
    } catch (error) {
      console.log(error);
      res.status(400).send({
        error: "Não foi possível realizar o login",
        msg: error,
        success: false,
      });
    }
  },
  async checkToken(req, res) {
    const { session } = req.body;
    if (session === "") return res.send({ ok: false });

    var authHeader = JSON.parse(session);

    if (!authHeader)
      return res.send({
        ok: false,
        msg: "Autenticação invalida!",
        error: "Token não foi informado",
      });

    const parts = authHeader.split(" ");

    if (!parts.length === 2)
      return res.send({ ok: false, error: "Token error" });

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme))
      return res.send({ ok: false, error: "Token formato inválido" });

    var verify = await jwt.verify(token, authConfig.secret, (err, decoded) => {
      if (err) return res.send({ ok: false });

      req.userID = decoded.id;

      return true;
    });
    if (verify) {
      return res.send({ ok: true });
    } else {
      return res.send({ ok: false });
    }
  },
  async checkOnline(req,res){
    return res.send({success:true})
  },
  async autoLogin(req, res) {
    //console.log(req.userID)
    try {
      const user = await User_model.findById(req.userID)

      if (!user)
        return res.send({ msg: "Usuário não encontrado", success: false });

      if (!user.verifyEmail) {
        return res.send({
          success: false,
        });
      }

      const qrcodes = await QrcodesModel.find({ user_id: req.userID }) //NECESSITA MELHORAR A ESTRATÉGIA
      var array_toSend = []
      for (let i = 0; i < qrcodes.length; i++) {
        //console.log(qrcodes[i].state)
        if (qrcodes[i].state) {
          if (!qrcodes[i].promotion) {
            var d = new Date(qrcodes[i].createdAt);
            var seconds = d.getTime() / 1000;
            var expire = seconds + 6 * 730 * 3600;
            var date_expire = new Date(expire * 1000);
            if (Date.now() < date_expire) {
              array_toSend.push(qrcodes[i])
            } else {
              qrcodes[i].state = false
              await QrcodesModel.findByIdAndUpdate(qrcodes[i]._id, qrcodes[i])

            }
          } else {
            array_toSend.push(qrcodes[i])
          }
        }
      }
      return res.send({
        success: true,
        profile: user.email,
        qrcodes: array_toSend
      });
    } catch (e) {
      console.log(error);
      res.send({
        msg: "Não foi possível realizar o login, por favor tente novamente",
        error: error.message,
        success: false,
      });
    }
  },
  async Login(req, res) {
    const { email, pss } = req.body;
    //console.log(email);
    try {
      if(!validateEmail(email)){
        return res.send({success:false, msg:"Email inválido"})
      }
      const user = await User_model.findOne({ email: email }).select("+password");
      //console.log(user);
      if (!user)
        return res.send({ msg: "Usuário não encontrado", success: false });

      if (!(await bcrypt.compare(pss, user.password))) {
        //console.log("entrou aqui")
        return res.send({ msg: "Email ou Senha inválida", success: false });
      }
      //futuramente, precisa otimizar isso

      if (!user.verifyEmail) {
        return res.send({
          success: false,
          msg: "Necessário autenticar o email primeiro",
        });
      }
      const datatoken = jwt.sign(
        { id: user._id, time: Date.now(), email: user.email },
        authConfig.secret,
        {
          expiresIn: "7d",
        }
      );
      return res.send({
        success: true,
        msg: "Estamos redirecionando...",
        token: datatoken
      });
    } catch (e) {
      console.log(error);
      res.status(400).send({
        msg: "Não foi possível realizar o login, por favor tente novamente",
        error: error.message,
        success: false,
      });
    }
  },
  async updateProfile(req,res){
    try{
      if(req.body.profile){
        //Construindo profile
        const profile_save = req.body.profile;
        const profile = [];
        if(profile_save.cardapio){
          profile.push(
            {
              title: "Cardapio",
              path: "/cardapio",
              icon: "mdi-folder-text-outline",
            }
          )
        }
        if(profile_save.financeiro){
          profile.push(
            {
              title: "Financeiro",
              path: "/financeiro",
              icon: "mdi-finance",
            }
          )
        }
        if(profile_save.leitor){
          profile.push(
            {
              title: "Leitor QR CODE",
              path: "/qrcode",
              icon: "mdi-qrcode-scan",
            }
          )
        }
        if(profile_save.limitador){
          profile.push(
            {
              title: "Limitador",
          path: "/limitador",
          icon: "mdi-contrast",
            }
          )
        }
        if(profile_save.logistica){
          profile.push(
            {
              title: "Logistica",
          path: "/logistica",
          icon: "mdi-table-cog",
            }
          )
        }
        const updateUser = await User_model.findByIdAndUpdate({_id: req.body.user_id}, {profile: profile, config_profile: profile_save})
        console.log(updateUser)
        if(updateUser){
          return res.send({success:true, msg:"Permissões atualizadas."})
        }else{
          return res.send({success:false, msg:"Não foi possível atualizar."})
        }


      }
    }catch(e){
      console.log(e)
      return res.send({success:false, msg:"Não foi possível atualizar, erro."})
    }
  }
};
