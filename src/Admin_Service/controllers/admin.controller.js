const User_model = require("../../models/user.model");
const User_store_model = require("../../models/user_store.model");
const company_model = require("../../models/company.model");
const storeModel = require("../../models/store.model");
const pedido_model = require("../../models/pedidos.model");
const financeiro_model = require("../../models/financial.model")
const drawReq_model = require("../../models/drawReq.model");
const user_storeModel = require("../../models/user_store.model");
const qrCodeModel = require("../../models/qrCode.model");
const { GNRequest } = require("../config/gerenciaNet.config");
const reportModel = require("../../models/report.model")
const mailer = require("../../modules/NodeMailer.controllers");
const mailerconfig = require("../../config/NodeMailer.config");
const authConfig = require("../config/auth");
const template_function = require("./methods/template_function")
const jwt = require("jsonwebtoken");

module.exports = {
    async fetchEmpresas(req, res) {
        try {
            const company = await company_model.find({ company_name: { $regex: ".*" + req.body.query + ".", $options: "i" } })
            return res.send({ obj: company, success: true, msg: "Empresas carregadas" })
        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "Erro ocorrido", error_Msg: e.message, success: false })
        }
    },
    async fetchStoreFromEmpresa(req, res) {
        try {
            const store = await storeModel.findOne({ company_id: req.body.company_id })
            return res.send({ obj: store, success: true, msg: "Empresas carregadas" })
        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "Erro ocorrido", error_Msg: e.message, success: false })
        }
    },
    //User.
    async fetchUserId(req, res) {
        try {
            const user = await User_model.findById({ _id: req.body.user_id });
            if (user) {
                return res.send({ obj: user, success: true, msg: "Usuário encontrado" })
            } else {
                return res.send({ success: true, msg: "Usuário não encontrado" })
            }
        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "Erro ocorrido", error_Msg: e.message, success: false })
        }
    },
    async fetchUserEmail(req, res) {
        try {
            const user = await User_model.findOne({ email: req.body.email });
            if (user) {
                return res.send({ obj: user, success: true, msg: "Usuário encontrado" })
            } else {
                return res.send({ success: false, msg: "Usuário não encontrado" })
            }
        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "Erro ocorrido", error_Msg: e.message, success: false })
        }
    },
    async UserData(req, res) { //Alterar os campos do usuário.
        try {
            let user_save = {

            }

        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "Erro ocorrido", error_Msg: e.message, success: false })
        }
    },
    async RequestPasswordChangeUser(req, res) {
        try {
            const user = await User_model.findOne({ email: req.body.email });
            if (user) {
                if (!user.type_status && user.type !== 'Emp') { //usuário comum
                    const verifyToken = jwt.sign(
                        { idUser: user._id, login: user.email },
                        authConfig.secret,
                        {
                            expiresIn: "1 day",
                        }
                    );

                    const request = await User_model.findByIdAndUpdate(user._id, {
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
                            res.send({ msg: "Pedido enviado ao usuário", success: true });
                        }
                    );
                } else {
                    if (user.type_status && user.type !== 'Common') { //Usuário Empresarial
                        const verifyToken = jwt.sign(
                            { idUser: user._id, login: user.email },
                            authConfig.secret,
                            {
                                expiresIn: "1 day",
                            }
                        );

                        const request = await User_model.findByIdAndUpdate(user._id, {
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
                                res.send({ msg: "Pedido enviado ao usuário", success: true });
                            }
                        );
                    } else {
                        res.send({ msg: "Esta conta não é empresarial.", success: false });
                    }
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
    //Store
    async storeSwitchOnOff(req, res) {
        try {
            const store = await storeModel.findById({ _id: req.body.store_id });
            if (store) {
                store.activate = req.body.switch
                const update = await storeModel.findByIdAndUpdate({ _id: store._id }, store)
                if (!update)
                    return res.send({ success: false, msg: "Não foi possivel atualizar" })
                return res.send({ success: true, msg: "Store alterada" }) //retorno
            }
            return res.send({ obj: null, msg: "Store não encontrada", error_Msg: e.message, success: false })
        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "Erro ocorrido", error_Msg: e.message, success: false })
        }
    },
    async fetchEmpresa(req, res) {
        try {
            const user_store = await User_store_model.findOne({ company_id: req.body.company_id, type: 'dono' });
            if (user_store) {
                const user = await User_model.findById({ _id: user_store.user_id })
                if (!user) {
                    return res.send({ obj: null, msg: "Usuario não encontrado", error_Msg: e.message, success: false })
                }
                const store = await storeModel.findOne({ company_id: req.body.company_id })
                const financeiro = await financeiro_model.findOne({ company_id: req.body.company_id })

                let aux = {
                    user: user,
                    user_store: user_store,
                    store: store,
                    financeiro: financeiro
                }
                return res.send({ obj: aux, success: true, msg: "Dados carregados" }) //retorno
            }
            return res.send({ obj: null, msg: "Empresa não encontrada", error_Msg: e.message, success: false })
        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "Erro ocorrido", error_Msg: e.message, success: false })
        }
    },
    async fetchDrawReqData(req, res) {
        var dataIni = new Date(req.body.dataIni).toUTCString();
        var dataFim = new Date(req.body.dataFim).toUTCString();
        try {
            const draws = await drawReq_model.find({
                createdAt: {
                    $gte: dataIni,
                    $lt: dataFim
                }
            })
            return res.send({ obj: draws, success: true, msg: "Pedidos carregados" })
        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "Erro ocorrido", error_Msg: e.message, success: false })
        }
    },
    async fetchDrawReqAll(req, res) {
        try {
            const draws = await drawReq_model.find()
            return res.send({ obj: draws, success: true, msg: "Pedidos carregados" })
        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "Erro ocorrido", error_Msg: e.message, success: false })
        }
    },
    async fetchDrawRequests(req, res) {
        try {
            const draws = await drawReq_model.find({ status: false })
            return res.send({ obj: draws, success: true, msg: "Pedidos carregados" })
        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "Erro ocorrido", error_Msg: e.message, success: false })
        }
    },
    async fetchDrawRequestsEmp(req, res) {
        try {
            const draws = await drawReq_model.find({ company_id: req.body.company_id })
            return res.send({ obj: draws, success: true, msg: "Pedidos carregados" })
        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "Erro ocorrido", error_Msg: e.message, success: false })
        }
    },
    async fetchEmpresaUser(req, res) { //Trazer usuario dono de uma empresa
        try {
            const user_store = await User_store_model.findOne({ company_id: req.body.company_id, type: 'dono' });
            if (user_store) {
                const user = await User_model.findById({ _id: user_store.user_id })
                if (!user) {
                    return res.send({ obj: null, msg: "Usuario não encontrado", error_Msg: e.message, success: false })
                }

                return res.send({ obj: user, success: true, msg: "Dados carregados" }) //retorno
            }
            return res.send({ obj: null, msg: "Empresa não encontrada", error_Msg: e.message, success: false })
        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "Erro ocorrido", error_Msg: e.message, success: false })
        }
    },
    async fetchNewEmpresas(req, res) {
        try {
            const company = await company_model.find({ status: false });
            return res.send({ obj: company, success: true, msg: "Empresas carregadas" })
        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "Erro ocorrido", error_Msg: e.message, success: false })
        }
    },
    async authenticateEmpresa(req, res) { //AUTENTICAR EMPRESA - ENVIAR EMAIL TAMBÉM PARA O USUÁRIO AVISANDO...
        //user_type e company_status
        //VAI VIR USER E COMPANY
        try {
            //Mudar company e depois user_type
            const company = await company_model.findById({ _id: req.body.company_id })
            if (!company)
                return res.send({ msg: "Empresa não localizada", success: false })
            const user_store = await user_storeModel.findOne({ company_id: req.body.company_id, type: 'dono' })
            if (!user_store)
                return res.send({ msg: "Usuario nao encontrado", success: false })
            const user = await User_model.findById({ _id: user_store.user_id })
            if (!user)
                return res.send({ msg: "Usuário não localizado", success: false })

            //Se chegou aqui até entao autentique
            company.status = true;
            user.type_status = true;

            const update_user = await User_model.findByIdAndUpdate({ _id: user._id }, user);

            if (!update_user)
                return res.send({ msg: "Não foi possivel atualizar", success: false })
            const update_company = await company_model.findByIdAndUpdate({ _id: company._id }, company);

            if (!update_company)
                return res.send({ msg: "Não foi possivel atualizar", success: false })
           

            //Enviar email.
            mailer.sendMail(
                {
                    to: user.email,
                    from: mailerconfig.from,
                    html: await template_function("Sua empresa foi autenticada e está pronta para começar. Em caso de dúvida por favor entre em contato conosco pelo email contato@semfila.tech . Obrigado e boas vendas", "Clique para Começar!", "https://www.semfila.tech"),
                    subject: "SemFila - Sua empresa foi autenticada"
                },
                (err) => {
                    if (err) {
                        console.log(err);
                    }
                }
            );
            return res.send({ success: true, msg: "Empresa autenticada" })
        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "Erro ocorrido", error_Msg: e.message, success: false })
        }
    },
    async authenticateDraw(req, res) {
        //Alterar no financeiro e draw_req
        try {
            //Mudar company e depois user_type
            const financeiro = await financeiro_model.findOne({ company_id: req.body.company_id })
            if (!financeiro)
                return res.send({ msg: "financeiro não localizada", success: false })
            const draw_req = await drawReq_model.findOne({ company_id: req.body.company_id })
            if (!draw_req)
                return res.send({ msg: "DrawReq não localizado", success: false })

            //Se chegou aqui até entao autentique
            financeiro.draw = true; //Pode realizar saque novamente
            draw_req.status = true;//Já foi sacado

            const update_financeiro = await financeiro_model.findByIdAndUpdate({ _id: financeiro._id }, financeiro);

            if (!update_financeiro)
                return res.send({ msg: "Não foi possivel atualizar Financeiro", success: false })
            const update_drawReq = await drawReq_model.findByIdAndUpdate({ _id: draw_req._id }, draw_req);

            if (!update_drawReq)
                return res.send({ msg: "Não foi possivel atualizar drawreq", success: false })
            //RETORNO
            return res.send({ success: true, msg: "Saque autenticado" })
        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "Erro ocorrido", error_Msg: e.message, success: false })
        }
    },
    async fetchPedido(req, res) {
        //req.body.pedido
        try {
            const pedido = await pedido_model.findById({ _id: req.body.pedido });
            return res.send({ obj: pedido, success: true, msg: "Empresas carregadas" })
        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "Erro ocorrido", error_Msg: e.message, success: false })
        }
    },
    //qrcodes
    async fetchReembolso(req, res) {
        try {
            const qrcodes = await qrCodeModel.find({ withdraw: true, cortesia: false })
            if (!qrcodes)
                return res.send({ obj: null, msg: "Nenhum localizado", success: false })

            return res.send({ obj: qrcodes, msg: "QRCODES LOCALIZADOS", success: true })
        } catch (e) {
            return res.send({ obj: null, msg: "ERRO", success: false, error: e.message })

        }
    },
    async fetchReembolsoOne(req, res) {
        try {
            const qrcode = await qrCodeModel.findById({ _id: req.body._id })
            if (!qrcode)
                return res.send({ obj: null, msg: "Nenhum localizado", success: false })

            return res.send({ obj: qrcode, msg: "QRCODE LOCALIZADO", success: true })
        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "ERRO", success: false, error: e.message })
        }
    },
    //pedidos
    async fetchPedidos(req, res) {
        try {
            const pedido = await pedido_model.find()
            if (!pedido)
                return res.send({ obj: null, msg: "Nenhum localizado", success: false })

            return res.send({ obj: pedido, msg: "pedido LOCALIZADO", success: true })
        } catch (e) {
            return res.send({ obj: null, msg: "ERRO", success: false, error: e.message })
        }
    },
    //pedido + qrcode
    async fetchPedido(req, res) {
        try {
            const pedido = await pedido_model.findById({ _id: req.body._id })
            if (!pedido)
                return res.send({ obj: null, msg: "Nenhum localizado", success: false })

            return res.send({ obj: pedido, msg: "pedido LOCALIZADO", success: true })
        } catch (e) {
            return res.send({ obj: null, msg: "ERRO", success: false, error: e.message })
        }
    },
    async fetchTxid(req, res) { //trzer cobrança pelo txid
        try {
            const reqGNAlready = GNRequest({
                clientID: process.env.GN_CLIENT_ID,
                clientSecret: process.env.GN_CLIENT_SECRET,
            });

            const reqGN = await reqGNAlready;
            const cobResponse = await reqGN.get(`/v2/cob/${req.body.txid}`);
            //console.log(cobResponse)
            //const pix = await reqGN.put(`/v2/pix/${cobResponse.data.pix[0].endToEndId}/devolucao/12345`)
            //console.log(pix)
            return res.send({ obj: cobResponse.data, msg: "TXID localizado", success: true })
        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "ERRO", success: false, error: e.message })
        }

    },
    async withDrawAction(req, res) { //Ja marca o pedido como estornado e  reembolsa
        try {
            console.log(req.body)
            const pedido = await pedido_model.findById({ _id: req.body.pedido_id })
            if (!pedido) {
                return res.send({ obj: null, msg: "Pedido nao localizado", success: false })
            }
            const qrcode = await qrCodeModel.findById({ _id: req.body.qrcode_id })
            if (!qrcode) {
                return res.send({ obj: null, msg: "qrcode nao localizado", success: false })
            }
            console.log(qrcode)
            var valor = (parseFloat(qrcode.item.price) * parseFloat(qrcode.quantity)).toFixed(2)
            //Passar o valor do restante do item qrcode solicitado.

            qrcode.withdraw = false
            const reqGNAlready = GNRequest({
                clientID: process.env.GN_CLIENT_ID,
                clientSecret: process.env.GN_CLIENT_SECRET,
            });

            const reqGN = await reqGNAlready;
            const cobResponse = await reqGN.get(`/v2/cob/${pedido.txid}`);

            //console.log(valor)
            const pix = await reqGN.put(`/v2/pix/${cobResponse.data.pix[0].endToEndId}/devolucao/${pedido.txid}`, { valor: valor }) //OK
            //console.log(pix)
            const update_qrcode = await qrCodeModel.findByIdAndUpdate({ _id: qrcode._id }, qrcode)
            if (!update_qrcode) {
                return res.send({ obj: null, msg: "qrcode nao atualizado", success: false })
            }
            if (pedido.user_id) { //Caso tenha um usuario enviar um email
                const user = User_model.findById({ _id: pedido._id })
                if (user) { //Se encontrar o usuario enviar email.
                    let escopo = "Reembolso foi efetuado e já enviado para o pagante. "
                    let mensagem = "O Reembolso do QRCODE vindo do pedido " + pedido._id + " no valor de: R$" + valor + ". Agradecemos pela experiência conosco e estamos sempre a sua disposição. Por SemFila."
                    mailer.sendMail(
                        {
                            to: user.email,
                            from: mailerconfig.from,
                            template: "EmailTemplateBasic",
                            subject: "SemFila - Reembolso efetuado.",
                            context: { escopo, mensagem },
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
            }
            return res.send({ obj: pix.data, msg: "Reembolso concluído", success: true })
        } catch (e) {
            console.log(e)
            return res.send({ obj: null, msg: "ERRO", success: false, error: e.message })
        }
    },
    async getReports(req, res) { //ok
        try {
            const reports = await reportModel.find()
            if (!reports)
                return res.send({ obj: null, msg: "Nenhum localizado", success: false })

            return res.send({ obj: reports, msg: "Denuncias LOCALIZADAS", success: true })
        } catch (e) {
            return res.send({ obj: null, msg: "ERRO", success: false, error: e.message })
        }
    },
    async sendEmailAnalisys(req, res) { //OK
        var document = req.body
        try {
            let escopo = "Denúncia sobre o cardapio de " + document.store_name
            let mensagem = "Iremos realizar nossa investigação sobre o cardapio e seu relato." +
                "Denúncia criada em " + document.data + ", mensagem: " + document.message
                + ". Caso de fato a empresa esteja fazendo algo fora das nossas diretrizes ela receberá uma punição. A SemFila agradece pela sua denúncia. Juntos para criar um ambiente mais saúdavel."
            mailer.sendMail(
                {
                    to: document.email,
                    from: mailerconfig.from,
                    template: "EmailTemplateBasic",
                    subject: "SemFila - Denúncia do cardapio está sendo investigada",
                    context: { escopo, mensagem },
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
            const reportWarn = await reportModel.findById({ _id: document.report_id })
            reportWarn.user_warn = true;
            reportWarn.save();
            return res.send({ msg: "Email Enviado", success: true })
        } catch (e) {
            return res.send({ obj: null, msg: "ERRO", success: false, error: e.message })
        }
    },
    async SendEmailEmpresa(req, res) { //Buscar email do usuario mestre.
        var document = req.body
        try {
            //Buscar usuario antes de enviar
            //ID EMPRESA BUSCA USER_STORE E O TIPO
            //COM ISSO PEGAR EMAIL DO USUARIO FAZENDO OUTRA REQ PARA TRAZER USER_EMAIL PELO USERMODEL
            const user_store = await User_store_model.findOne({ company_id: document.company_id, type: 'dono' });
            if (user_store) {
                const user = await User_model.findById({ _id: user_store.user_id })
                if (!user) {
                    return res.send({ obj: null, msg: "Usuario não encontrado", error_Msg: e.message, success: false })
                }
                let escopo = "Houve uma denúncia sobre seu cardapio: " + document.store_name
                let mensagem = document.message_company;
                mensagem += "- Denúnica: " + document.message;
                mensagem += ". Sempre siga as nossas diretrizes para uma comunidade mais saúdavel. Porfavor, realize as mudanças imediatamente! Você possui um prazo de 48 horas para a mudança. Caso não efetuar, iremos desativar seu cardapio."
                mailer.sendMail(
                    {
                        to: user.email,
                        from: mailerconfig.from,
                        template: "EmailTemplateBasic",
                        subject: "SemFila - Atenção ao seu cardapio",
                        context: { escopo, mensagem },
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
                const reportWarn = await reportModel.findById({ _id: document.report_id })
                reportWarn.company_warn = true;
                reportWarn.save();
                return res.send({ msg: "Email Enviado", success: true })
            } else {
                return res.send({ msg: "Empresa não localizada", success: false })
            }
        } catch (e) {
            return res.send({ obj: null, msg: "ERRO", success: false, error: e.message })
        }
    },
    async deleteReport(req, res) {
        try {
            const reports = await reportModel.findByIdAndDelete({ _id: req.body._id })
            if (!reports)
                return res.send({ obj: null, msg: "Não localizado localizado", success: false })

            return res.send({ obj: reports, msg: "Denuncia deletada", success: true })
        } catch (e) {
            return res.send({ obj: null, msg: "ERRO", success: false, error: e.message })
        }
    }
}