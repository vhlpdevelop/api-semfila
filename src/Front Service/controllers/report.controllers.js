const reportModel = require("../../models/report.model");
const userModel = require("../../models/user.model");
module.exports = {
    async reportCardapio(req, res) {

        try {
                const user = await userModel.findById({ _id: req.userID });
                if (!user)
                    return res.send({ success: false })
                if (req.body.message.length > 200)
                    return res.send({ success: false })
                const object = req.body
                let construct = {
                    idCardapio: object.idCardapio,
                    store_name: object.store_name,
                    message: object.message,
                    company_id: object.company_id,
                    user_id: user._id,
                    user_email: user.email,
                }
                const response = await reportModel.create(construct, { new: true })
                if (!response)
                    res.send({
                        success: false
                    })
                res.send({
                    success: true
                })

        } catch (e) {
            console.log(e.message)
            res.send({
                success: false
            })
            return;
        }
    }
}