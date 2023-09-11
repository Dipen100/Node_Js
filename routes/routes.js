const express= require('express')
const router = express.Router()
const controllers = require('../controllers/controllers')
const multer = require('multer')
const req = require('express/lib/request')
const res = require('express/lib/response')

//configuring multer storage engine
const fileStorageEngine = multer.diskStorage({
    destination: (req, filename, cb) => {
        cb(null, './public/uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "--" + file.originalname);
    }
})

const upload = multer({ storage: fileStorageEngine });

//checked if the user is logged in or not(isUserLoggedIn)
let isUserLoggedIn=(req,res,next)=>{
    if(!req.session.userId){
        req.flash('error_message','Please login first')
        res.redirect('/login')
    }else{
        next()
    }
}

let redirect=(req,res,next)=>{
    if(req.session.userId){
        res.redirect('/blog')
    }else{
        next()
    }
}


//ROUTES HERE

// GET METHODS

router.get('/',controllers.home);

router.get('/about',controllers.about);

router.get('/blog',isUserLoggedIn,controllers.blog);

router.get('/login',redirect,controllers.login);

router.get('/register',controllers.register);

router.get('/postDetail/:id',controllers.postDetail);

router.get('/createPost',controllers.createPost);

router.get('/edit/:id',controllers.edit);

router.get('/delete/:id',controllers.delete);

// POST METHODS

router.post('/edit/:id',upload.single('image'),controllers.update);

router.post('/createPost',upload.single('image'),controllers.savePost);

router.post('/register',redirect,controllers.saveUser);

router.post('/login',redirect,controllers.postLogin);

router.get('/logout',controllers.postlogout);

module.exports = router