const express = require("express");
const middleware = require("../../middleware/auth.middleware");
const user_controller = require("../controllers/user.controller");
const auth_owner = require("../../middleware/auth.owner.middleware")
const login_controller = require("../controllers/login.controllers");
const router = express.Router();
const limiter = require("../resources/limiter")
//const admin_middleware = require("../middleware/auth.admin.middleware")
//USERS

router.post('/PasswordReset', user_controller.PasswordReset);
//USUARIOS EMP
router.post('/checkOnline', limiter.padrao, middleware, login_controller.checkOnline)
router.post('/loginEmp', limiter.Login_limiter, login_controller.loginEmp)
router.post('/registerEmp',limiter.Login_limiter, user_controller.registerUserEmp)
router.post('/verifyEmailEmp',limiter.Login_limiter, user_controller.VerifyEmailEmp); //cadastrar restante dos dados e verificar email
router.post('/TokenPasswordReset',limiter.Login_limiter, user_controller.TokenPasswordReset);
router.post('/VerifyTokenPasswordReset',limiter.Login_limiter, user_controller.VerifyTokenPasswordReset);
//

//FUNC
router.post('/InviteUserEmp',limiter.padrao, auth_owner,user_controller.InviteUserEmp);
router.post('/VerifyTokenFunc', limiter.padrao,user_controller.VerifyTokenFunc);
router.post('/registerUserEmpFunc', limiter.Login_limiter,user_controller.registerUserEmpFunc);
router.post('/removeFunc',limiter.padrao,auth_owner, user_controller.removeFunc);
router.get('/getUsers',limiter.padrao, auth_owner,user_controller.allUsers)
//

//USUARIOS COMUM
router.post('/login', limiter.Login_limiter, login_controller.Login)
router.post('/register', limiter.Login_limiter, user_controller.registerUser)
router.post('/verifyEmail', limiter.Login_limiter, user_controller.verifyEmail);
router.post('/verifyTokenEmail', user_controller.verifyTokenEmail);
router.post('/CommonTokenPasswordReset', limiter.Login_limiter, user_controller.CommonTokenPasswordReset);
router.post('/CommonVerifyTokenPasswordReset', limiter.Login_limiter, user_controller.CommonVerifyTokenPasswordReset);

//router.post('/deleteuser', middleware, user_controller.deleteUser)


router.get('/autoLogin',limiter.padrao, middleware,login_controller.autoLogin)
//router.post('/updateProfile', middleware, user_controller.updateUser)

//LOGIN
//router.get('/ping',login_controller.ping); //TESTE

router.get('/verifytoken',limiter.padrao,middleware)
router.post('/checkToken',limiter.padrao, login_controller.checkToken)
router.post('/getProfile',limiter.padrao, middleware, user_controller.getProfile)
router.post('/saveProfile',limiter.padrao, middleware, user_controller.saveProfile)
//router.get('/verifyAlterarSenha/:id', login_controller.verifyAlterarSenha)
//router.post('/alterarSenha', login_controller.alterarSenha);

//Admin
router.post('/login/Admin', login_controller.loginAdmin)

module.exports = router;

