const userModel = require("../../models/user.model");
const storeModel = require("../../models/store.model");
const financialModel = require("../../models/financial.model");
const companyModel = require("../../models/company.model")
const User_store_model = require("../../models/user_store.model")
const menuModel = require("../../models/menu.model");
const mailer = require("../../modules/NodeMailer.controllers");
const mailerconfig = require("../../config/NodeMailer.config");
const bcrypt = require("bcrypt");
const authConfig = require("../../config/auth");
const jwt = require("jsonwebtoken");
const {sendConfirmToken} = require("../utils/sendMessages")
function validateEmail(email) {
  var re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}
module.exports = {
  async getProfile(req, res) {
    const idUser = req.userID;
    try {
      const response = await userModel.findOne({ _id: idUser });
      if (response) {
        //console.log(response);
        let datatosend = {
          user: {
            email: response.email,
            cpf: response.cpf,
            name: response.name,
            phone: response.phone
            
          },
        };
        return res.status(200).send({ obj: datatosend.user, success: true });
      }else{
        return res.send({ obj: null, success: false, msg:"Usuário não localizado." });
      }
    } catch (e) {
      console.log(e);
      return res.send({ obj: null, success: false, msg:"Ocorreu um erro ao trazer os dados.", error:e.message });
    }
  },
  async saveProfile(req, res) {
    const idUser = req.userID;
    const dataToSave = req.body.user;
   
    try {
      const response = await userModel.findOne({ _id: idUser });
      if (response && dataToSave) {
        //console.log(response);

        response.email = dataToSave.email
        response.phone = dataToSave.phone
        response.cpf = dataToSave.cpf
        response.name = dataToSave.name
       
        const update = await userModel.findByIdAndUpdate( {_id:response._id}, response)
        if(!update)
          return res.send({ obj: null, success: false, msg:"Não foi possível atualizar." });
          let datatosend = {
            user: {
              email: response.email,
              cpf: response.cpf,
              name: response.name,
              phone: response.phone
              
            },
          };
        return res.status(200).send({ obj: datatosend.user,success: true, msg: "Suas alterações foram salvas." });
      }else{
        return res.send({ obj: null, success: false, msg:"Usuário não localizado." });
      }
    } catch (e) {
      console.log(e);
      return res.send({ obj: null, success: false, msg:"Ocorreu um erro ao trazer os dados.", error:e.message });
    }
  },
  async removeFunc(req, res) {
    if (!req.authenticate) {
      res.json({
        success: false,
        msg: "Usuário não tem permissão."
      });
      return;
    }
    const idCompany = req.company_id;
    try {
      const response = await User_store_model.findOne({ company_id: idCompany, type: "Func", user_id: req.body._id});
      if (!response) {
        throw new Error("Usuário não encontrado.");
      }
      const userRemove = await User_store_model.findByIdAndDelete({ _id: response._id});
      if(!userRemove)
        throw new Error("Usuário não encontrado.");
      
      
      res.status(200).json(
        {
          msg: "Usuário removido da empresa.",
          success: true
        }
      );
    } catch (error) {
      res.status(400).json({
        msgError: error.message,
        success: false,
        msg: "Infelizmente ocorreu um erro."
      });
    }

  },
  async allUsers(req, res) {
    if (!req.authenticate) {
      res.json({
        success: false,
        msg: "Usuário não tem permissão."
      });
      return;
    }
    const idCompany = req.company_id;
    console.log(idCompany)
    try {
      const response = await User_store_model.find({ company_id: idCompany, type: "Func"});
      var array_toSend = []
      for(let i =0; i<response.length; i++){
        var user = await userModel.findById({_id: response[i].user_id})
        if(user)
          array_toSend.push(user)
      }
      if (!response) {
        throw new Error("Usuário não encontrado.");
      }
      res.status(200).json(
        {
          object: array_toSend,
          msg: "Usuários carregados.",
          success: true
        }
      );
    } catch (error) {
      res.status(400).json({
        msgError: error.message,
        success: false,
        msg: "Infelizmente ocorreu um erro."
      });
    }

  },
  async OneUser(req, res) {
    try {
      const { _ra, pss } = req.body.userData;
      const findUser = await userModel.findOne({
        _ra: _ra,
      });
      if (!findUser) {
        throw new Error("Usuário não encontrado.");
      }
      // -- NOVO --
      try {
        const findPerfil = await perfilModel.findById({
          _id: req.params.id,
        });
        if (!findPerm) {
          throw new Error("Usuário não encontrado.");
        }
      } catch (error) {
        res.status(400).json({
          msgError: error.message,
        });
      }
      res.status(200).json({
        findedUser: findUser,
        findedPerm: findPerm,
      });
    } catch (error) {
      res.status(400).json({
        msgError: error.message,
      });
    }
  },
  // async VerifyUserEmp(req, res) {}, //VERIFICAR UM FUNCIONARIO EMPRESARIAL E CADASTRA-LO
  async VerifyEmailEmp(req, res) {
    const schema = req.body
    const token = schema.id;
    try {
      let object = jwt.verify(token, authConfig.secret, (err, decoded) => {
        if (err)
          return res.send({ msg: "Token inválido", ok: false, error: err });

        let email = decoded.email;
        let company_id = decoded.company;
        let object = {
          email: email,
          company_id: company_id,
        };
        return object;
      });

      const response = await userModel.findOne({ email: object.email });
      if (!response) return res.send({ msg: "Usuário não encontrado", success: false });
      if (response.verifyEmail) {
        return res.send({ msg: "Conta já verificada", success: false });
      } else {
        response.verifyEmail = true;

        //CRIAR COMPANY, STORE E MENU
        const company = await companyModel.findById(object.company_id);
        if (!company)
          return res.send({
            msg: "Empresa não existente, erro ocorreu",
            success: false,
          });

        aux_company = {
          contract: "633f3735495e7e3f75b808ba",
          cnpj: company.cnpj,
          type: company.type,
          company_name: schema.empresaData.nome,
          endereco: schema.empresaData.endereco
        };

        const update_company = await companyModel.findByIdAndUpdate(
          object.company_id,
          aux_company,
          {
            new: true,
          }
        );
        if (update_company) {
          //CASO ATUALIZE A EMPRESA, CONTINUE
          let aux_store = {
            name: schema.storeData.nome,
            company_id: company._id,
            store_url: schema.storeData.url,
            store_img: "",
          };
          let aux_draw = ""
          if (schema.financialData.draw_type === "1") {
            aux_draw = "week"
          } else {
            aux_draw = "month"
          }
          let aux_financial = {
            company_id: company._id,
            contract_id: "633f3735495e7e3f75b808ba",
            juridic: schema.financialData.type,
            store_name: schema.storeData.nome,
            account_type: ' - ',
            responsible: {
              name: response.name,
              contact: response.phone,
              cpf: response.cpf,
              email: response.email,
            },
            cnpj: company.cnpj,
            draw: true,
            company_id: company.company_id,
            agency: schema.financialData.agency,
            account_number: schema.financialData.account_number,
            bank: schema.financialData.bank,
            draw_type: aux_draw,
          };
          let aux_user_store = {
            company_id: company._id,
            type: "dono",
            user_id: response._id
          }
          const user_store = await User_store_model.create(aux_user_store)
          const store = await storeModel.create(aux_store);
          const financial = await financialModel.create(aux_financial);
          let aux_menu = {
            store_id: store._id,
            menu_name: "default"
          };
          const menu = await menuModel.create(aux_menu);
          const updater = await userModel.findByIdAndUpdate(
            response._id,
            response,
            {
              new: true,
            }
          );
          if (updater && store && financial && menu && user_store) {
            return res.send({ msg: "Autenticação completa, aguarde verificarmos seus dados", success: true });
          } else {
            return res.send({
              msg: "Erro ocorreu ao autenticar",
              success: false,
            });
          }
        }
      }
    } catch (e) {
      console.log(e);
      return res.send({ msg: "Erro ocorreu ao autenticar", ok: false });
    }
  },

  async verifyTokenEmail(req, res) {
    const token = req.body.token;

    try {
      let object = jwt.verify(token, authConfig.secret, (err, decoded) => {
        if (err)
          return res.send({
            msg: "Token inválido",
            success: false,
            error: err,
          });

        let email = decoded.email;
        let object = {
          email: email,
        };
        return object;
      });

      const response = await userModel.findOne({ email: object.email });
      if (!response)
        return res.send({ msg: "Usuário desativado", success: false });
      if (response.verifyEmail) {
        return res.send({ msg: "Conta já verificada", success: false });
      }
      return res.status(200).send({
        msg: "Carregado com sucesso",
        success: true,
        obj: object.email,
      });
    } catch (e) {
      console.log(e);
      return res.send({
        msg: "Ocorreu um erro",
        success: false,
        error: e.message,
      });
    }
  },
  async verifyEmail(req, res) {
    const token = req.body.token;
    //console.log(req.body)

    //Verificar email, o token ja é válido
    try {
      let object = jwt.verify(token, authConfig.secret, (err, decoded) => {
        if (err)
          return res.send({
            msg: "Token inválido",
            success: false,
            error: err,
          });

        let email = decoded.email;
        let object = {
          email: email,
        };
        return object;
      });

      const response = await userModel.findOne({ email: object.email });
      if (!response)
        return res.send({ msg: "Usuário desativado", success: false });
      if (response.verifyEmail) {
        return res.send({ msg: "Conta já verificada", success: false });
      } else {
        response.verifyEmail = true;

        const updater = await userModel.findByIdAndUpdate(
          response._id,
          response,
          {
            new: true,
          }
        );
        if (updater) {
          return res.send({ msg: "Autenticação completa", success: true });
        } else {
          return res.send({
            msg: "Erro ocorreu ao autenticar",
            success: false,
          });
        }
      }
    } catch (e) {
      console.log(e.message);
      return res.send({ msg: "Erro ocorreu ao autenticar", ok: false });
    }
  },
  async registerUser(req, res) {
    const { email } = req.body.account;
    console.log(req.body.account)
    try {
      if(!validateEmail(email)){
        return res.send({success:false, msg:"Email inválido"})
      }
      const response = await userModel.findOne({ email: email });

      if (response) {
        return res.send({
          msg: "Usuário já cadastrado",
          success: false,
        });
      }
      const verifyToken = jwt.sign(
        {
          email: req.body.account.email,
          time: Date.now(),
        },
        authConfig.secret
      );

      let userTosave = {
        password: req.body.account.pss,
        email: req.body.account.email,
        cpf: req.body.account.cpf,
        phone: req.body.account.phone,
        name: req.body.account.name,
        type: "Common",
        type_status: false,
        verifyEmail: false,
        verifyToken: verifyToken,
      };
      console.log(userTosave)

      const user = await userModel.create(userTosave);

      if (!user)
        return res.send({ msg: "Erro ao criar usuário", success: false });

      user.password = undefined;


      if (user) {
        //Se cadastrou, enviar email de confirmação e mensagem whatsapp

        await sendConfirmToken(verifyToken, user.name, user.phone)
        mailer.sendMail(
          {
            to: email,
            from: mailerconfig.from,
            template: "verifyEmailTemplate2",
            subject: "Bem-vindo ao SemFila - Autentique sua conta",
            context: { verifyToken },
          },
          (err) => {
            if (err) {
              console.log(err);
              return res.send({
                msg: "Não foi possivel gerar o email!",
                success: false,
              });
            }
          }
        );
        return res.send({
          success: true,
          msg: "Cadastrado com sucesso! Verifique seu Email!"
        });
      }
      
    } catch (error) {
      console.log(error);
      return res.send({ msg: "Falha ao cadastrar", success: false });
    }
  },
  async registerUserEmp(req, res) {
    const { email } = req.body;
    try {
      if(!validateEmail(email)){
        return res.send({success:false, msg:"Email inválido"})
      }
      const response = await userModel.findOne({ email: email });
      const responseCompany = await companyModel.findOne({
        cnpj: req.body.cnpj,
      });
      if (response) {
        return res.send({
          msg: "Usuário já cadastrado",
          success: false,
        });
      }
      if (responseCompany) {
        return res.send({
          msg: "CNPJ já cadastrado",
          success: false,
        });
      }

      let companyTosave = {
        cnpj: req.body.cnpj,
        type: req.body.option,
      };
      const create_company = await companyModel.create(companyTosave);
      if (!create_company)
        return res.send({ msg: "Erro ao criar empresa", success: false });
      const verifyToken = jwt.sign(
        {
          email: req.body.email,
          time: Date.now(),
          company: create_company._id,
        },
        authConfig.secret
      );

      let userTosave = {
        password: req.body.senha,
        email: req.body.email,
        name: req.body.name,
        phone: req.body.telefone,
        cpf: req.body.cpf,
        type: "Emp",
        type_status: false, //FALSE PARA ELE NÃO VALIDAR O CNPJ DE PRIMEIRA
        verifyEmail: false,
        verifyToken: verifyToken,
        pss_ResetToken: "",
      };
      const user = await userModel.create(userTosave);

      if (!user)
        return res.send({ msg: "Erro ao criar usuário", success: false });

      user.password = undefined;

      if (user) {
        //Se cadastrou, enviar email de confirmação
        mailer.sendMail(
          {
            to: email,
            from: mailerconfig.from,
            template: "templateEmailEmp",
            subject: "Bem-vindo a SemFila - Complete agora seu cadastro",
            context: { verifyToken },
          },
          (err) => {
            if (err) {
              console.log(err);
              return res.send({
                msg: "Não foi possivel gerar o email!",
                success: false,
              });
            }
          }
        );
      }
      return res.send({
        success: true,
        msg: "Cadastrado com sucesso! Verifique seu Email!",
      });
    } catch (error) {
      console.log(error);
      return res.send({ msg: "Falha ao cadastrar", ok: false });
    }
  },
  //AREA DE FUNCIONARIO

  async InviteUserEmp(req, res) { //Pre-cadastrar e enviar um email com token para terminar cadastro
    if (!req.authenticate) {
      res.send({
        success: false,
        msg: "Usuário não tem permissão."
      });
      return;
    }
    //Ver se email ja está em uso
    if(!validateEmail(req.body.email)){
      return res.send({
        success: false,
        msg: "Email inválido."
      });
    }
    const user_find = await userModel.findOne({ email: req.body.email })
    if (user_find)
      return res.send({
        success: false,
        msg: "Email já cadastrado."
      });
    //Criar usuário
    const verifyToken = jwt.sign(
      {
        email: req.body.email,
        time: Date.now(),
        company: req.company_id,
      },
      authConfig.secret
    );

    let user_create = {
      email: req.body.email,
      name: '',
      type: '',
      phone: '',
      cpf: '',
      type_status: true, //Caso seja um emp e esteja Validado
      password: req.body.email,
      verifyEmail: false,
      verifyToken: verifyToken,
    }


    const user = await userModel.create(user_create);
    if (user) {
      //Se cadastrou, enviar email de confirmação
      mailer.sendMail(
        {
          to: req.body.email,
          from: mailerconfig.from,
          template: "templateEmailInviteEmp",
          subject: "Bem-vindo a SemFila - Complete agora seu cadastro",
          context: { verifyToken },
        },
        (err) => {
          if (err) {
            console.log(err);
            return res.send({
              msg: "Não foi possivel gerar o email",
              success: false,
            });
          }
        }
      );
      return res.send({
        success: true,
        msg: "Um email foi enviado para " + req.body.email,
      });
    } else {
      return res.send({
        success: false,
        msg: "Não foi possivel convidar este usuário."
      });
    }

  },
  async VerifyTokenFunc(req,res){
    const token = req.body.token;

    try {
      let object = jwt.verify(token, authConfig.secret, (err, decoded) => {
        if (err)
          return res.send({
            msg: "Token inválido",
            success: false,
            error: err,
          });

        let email = decoded.email;
        let company_id = decoded.company;
        let object = {
          email: email,
          company_id: company_id
        };
        return object;
      });

      const response = await userModel.findOne({ email: object.email });
      if (!response)
        return res.send({ msg: "Usuário desativado", success: false });
      if (response.verifyEmail) {
        return res.send({ msg: "Conta já verificada", success: false });
      }
      return res.status(200).send({
        msg: "Carregado com sucesso",
        success: true,
        obj: object,
      });
    } catch (e) {
      console.log(e);
      return res.send({
        msg: "Ocorreu um erro",
        success: false,
        error: e.message,
      });
    }
  },
  async registerUserEmpFunc(req, res) { //Registrar usuário a Store.
    console.log(req.body)
    const schema = req.body
    var object_concrete = jwt.verify(schema.id, authConfig.secret, (err, decoded) => {
      if (err)
        return res.send({
          msg: "Token inválido",
          success: false,
          error: err,
        });

        let email = decoded.email;
        let company_id = decoded.company;
        let object = {
          email: email,
          company_id: company_id
        };
      return object;
    });
    try {
      const user = await userModel.findOne({ email: object_concrete.email });
      if (!user)
        return res.send({ success: false, msg: 'Usuário não encontrado.' });
      if (user.verifyEmail)
        return res.send({ success: false, msg: 'Usuário já cadastrado e autenticado.' })

      const hash = await bcrypt.hash(schema.password, 10);
      
      var aux_update = {
        email: object_concrete.email,
        name: schema.name,
        type: 'Leitor',
        phone: schema.phone,
        cpf: schema.cpf,
        profile: 'Func',
        type_status: true, //Caso seja um emp e esteja Validado
        password: hash,
        verifyEmail: true,
        verifyToken: ''
      }
      //Atualizar usuario
      const update_user = await userModel.findByIdAndUpdate( {_id:user._id}, aux_update, {
        new:true
      });
      if(!update_user)
        return res.send({ success: false, msg: 'Não foi possivel concluir cadastro.' })
      //Inserir na Store
      var aux_store = {
        user_id: user._id,
        company_id: object_concrete.company_id,
        type: 'Func',
      }
      const store = await User_store_model.create(aux_store)
      if(!store)
      return res.send({ success: false, msg: 'Não foi possivel concluir cadastro na Store.' })

      //Concluido
      return res.send({success:true, msg:"Cadastro concluído, redirecionando..."})
    } catch (e) {
      console.log(e)
      res.send({
        msg:'Ocorreu um erro',
        error_m: e.message,
        success:false,
      })
    }
  },

  //
  async updateUser(req, res) {
    const id = req.userID;
    var body = req.body;
    //console.log(body)
    if (body === undefined) {
      return res.send({ msg: "Erro ao alterar", ok: false });
    }
    try {
      const response = await userModel.findById(id).select("+password");
      if (body.password !== "") {
        if (!(await bcrypt.compare(body.password, response.password))) {
          body.password = body.newPassword;
          var updater = await userModel.findByIdAndUpdate(id, body, {
            new: true,
          });
          if (updater) {
            res.status(200).json({ ok: true });
          } else {
            res.json({ msg: "Falha ao atualizar", ok: false });
          }
        } else {
          res.json({ msg: "Senha antiga incorreta", ok: false });
        }
      } else {
        var updater = await userModel.findByIdAndUpdate(id, body, {
          new: true,
        });
        if (updater) {
          res.status(200).json({ ok: true });
        } else {
          res.json({ msg: "Falha ao atualizar", ok: false });
        }
      }
      if (!response) {
        throw new Error("Usuário não encontrado.");
      }
    } catch (error) {
      console.log(error);
      res.status(400).json({
        msgError: error.message,
        msg: "Erro ao atualizar",
        ok: false,
      });
    }
  },
  async deleteUser(req, res) {
    try {
      const { _id } = req.body.userData;
      const response = await userModel.findByIdAndDelete({ _id });
      if (!response) {
        throw new Error("Usuário não encontrado");
      }
      res.status(200).json({ deletado: response._id });
    } catch (error) {
      res.status(400).json({
        msgError: error.message,
      });
    }
  },
  async pedidoAlterarSenha(req, res) {
    const idUser = req.userID;

    try {
      const user = await userModel.findById({ _id: idUser });
      if (user) {
        const datatoken = jwt.sign(
          { idUser: user._id, login: user.email },
          authConfig.secret,
          {
            expiresIn: "1 day",
          }
        );
        const request = await userModel.findByIdAndUpdate(user._id, {
          $set: {
            pss_resetToken: datatoken,
          },
        });
        if (!request) {
          return res.send({
            msg: "Erro no sistema!",
            success: false,
          });
        }
        mailer.sendMail(
          {
            to: user.email,
            from: mailerconfig.from,
            template: "pedidoAlterarSenha",
            context: { verifyToken },
          },
          (err) => {
            if (err) {
              console.log(err);
              return res.send({
                msg: "Não foi possivel gerar o email!",
                success: false,
              });
            }
            res.send({ msg: "Pedido enviado ao seu Email", success: true });
          }
        );
      } else {
        return res.send({ msg: "Usuário inexistente", success: false });
      }
    } catch (err) {
      console.log(err);
      res
        .status(400)
        .json({ erro: err.message, success: false, msg: "Um erro ocorreu" });
    }
  },
  async TokenPasswordReset(req, res) { //Criar Token e enviar ao usuário alterar senha

    try {
      const user = await userModel.findOne({ email: req.body.email });
      if (user) {
        if (user.type_status && user.type !== 'Common') {
          const verifyToken = jwt.sign(
            { idUser: user._id, login: user.email },
            authConfig.secret,
            {
              expiresIn: "1 day",
            }
          );

          const request = await userModel.findByIdAndUpdate(user._id, {
            $set: {
              pss_ResetToken: verifyToken,
            },
          });
          if (!request) {
            return res.send({
              msg: "Erro no sistema!",
              success: false,
            });
          }
          mailer.sendMail(
            {
              to: user.email,
              from: mailerconfig.from,
              subject: "SemFila - Altere sua senha ",
              template: "pedidoAlterarSenha",
              context: { verifyToken },
            },
            (err) => {
              if (err) {
                console.log(err);
                return res.send({
                  msg: "Não foi possivel gerar o email!",
                  success: false,
                });
              }
              res.send({ msg: "Pedido enviado, Porfavor verifique seu Email", success: true });
            }
          );
        } else {
          res.send({ msg: "Esta conta não é empresarial.", success: false });
        }

      } else {
        return res.send({ msg: "Desculpe, usuário inexistente", success: false });
      }
    } catch (err) {
      console.log(err);
      res
        .status(400)
        .json({ erro: err.message, success: false, msg: "Um erro ocorreu" });
    }
  },
  async VerifyTokenPasswordReset(req, res) { //Verificar Token

    const token = req.body.token;
    try {
      let object = jwt.verify(token, authConfig.secret, (err, decoded) => {
        if (err)
          return res.send({
            msg: "Token inválido",
            success: false,
            error: err,
          });
        let email = decoded.login
        let object = {
          email: email,
        };
        return object;
      });

      const response = await userModel.findOne({ email: object.email }).select("+pss_ResetToken");
      if (!response)
        return res.send({ msg: "Usuário desativado", success: false });
      if (response.pss_ResetToken !== token) {
        return res.send({ msg: "ATENÇÃO, token inválido", success: false });
      }
      return res.status(200).send({
        msg: "Carregado com sucesso",
        success: true,
        obj: response.name,
      });
    } catch (e) {
      console.log(e);
      return res.send({
        msg: "Ocorreu um erro",
        success: false,
        error: e.message,
      });
    }
  },
  async PasswordReset(req, res) { //Alterar senha Comum ou Emp

    try {
      const token = req.body.token;
      const senha = req.body.schema;
      let object = jwt.verify(token, authConfig.secret, (err, decoded) => {
        if (err)
          return res.send({
            msg: "Token inválido",
            success: false,
            error: err,
          });
        let email = decoded.login
        let object = {
          email: email,
          idUser: decoded.idUser
        };
        return object;
      });
      const user = await userModel.findById({ _id: object.idUser }).select("+pss_ResetToken");
      if (user) {
        user.pss_ResetToken = "";
        user.password = await bcrypt.hash(senha, 10);
        const updater = await userModel.findByIdAndUpdate({ _id: user._id }, user, { new: true });
        if (updater) {
          return res.status(200).send({
            msg: "Nova senha atualizada",
            success: true
          });
        } else {
          return res.status(200).send({
            msg: "Não foi possivel atualizar sua senha",
            success: false
          });
        }
      } else {
        return res.status(200).send({
          msg: "Usuário não encontrado",
          success: false
        });
      }

    } catch (e) {
      console.log(e);
      return res.send({
        msg: "Ocorreu um erro",
        success: false,
        error: e.message,
      });
    }
  },
  async CommonTokenPasswordReset(req, res) { //Criar Token e enviar ao usuário alterar senha COMUM
    try {
      const user = await userModel.findOne({ email: req.body.email });
      if (user) {
        if (!user.type_status && user.type !== 'Emp') {
          const verifyToken = jwt.sign(
            { idUser: user._id, login: user.email },
            authConfig.secret,
            {
              expiresIn: "1 day",
            }
          );

          const request = await userModel.findByIdAndUpdate(user._id, {
            $set: {
              pss_ResetToken: verifyToken,
            },
          });
          if (!request) {
            return res.send({
              msg: "Erro no sistema!",
              success: false,
            });
          }
          mailer.sendMail(
            {
              to: user.email,
              from: mailerconfig.from,
              subject: "SemFila - Altere sua senha ",
              template: "pedidoAlterarSenha_common",
              context: { verifyToken },
            },
            (err) => {
              if (err) {
                console.log(err);
                return res.send({
                  msg: "Não foi possivel gerar o email!",
                  success: false,
                });
              }
              res.send({ msg: "Pedido enviado, Porfavor verifique seu Email", success: true });
            }
          );
        } else {
          res.send({ msg: "Esta conta é empresarial.", success: false });
        }

      } else {
        return res.send({ msg: "Desculpe, usuário inexistente", success: false });
      }
    } catch (err) {
      console.log(err);
      res
        .status(400)
        .json({ erro: err.message, success: false, msg: "Um erro ocorreu" });
    }
  },
  async CommonVerifyTokenPasswordReset(req, res) { //Verificar Token COMUM
    const token = req.body.token;
    try {
      let object = jwt.verify(token, authConfig.secret, (err, decoded) => {
        if (err)
          return res.send({
            msg: "Token inválido",
            success: false,
            error: err,
          });
        let email = decoded.login
        let object = {
          email: email,
        };
        return object;
      });

      const response = await userModel.findOne({ email: object.email }).select("+pss_ResetToken");
      if (!response)
        return res.send({ msg: "Usuário desativado", success: false });
      if (response.pss_ResetToken !== token) {
        return res.send({ msg: "ATENÇÃO, token inválido", success: false });
      }
      if (response.type === 'Common') {
        return res.status(200).send({
          msg: "Carregado com sucesso",
          success: true,
          obj: response.name,
        });
      } else {
        return res.status(200).send({
          msg: "Esta conta é empresarial",
          success: false
        });
      }
    } catch (e) {
      console.log(e);
      return res.send({
        msg: "Ocorreu um erro",
        success: false,
        error: e.message,
      });
    }
  },
};
