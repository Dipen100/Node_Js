const { YEAR, DATE } = require('mysql/lib/protocol/constants/types');
const con = require('../database/connection');
const joi=require('joi');
const bcrypt=require('bcryptjs');
const { redirect } = require('express/lib/response');
const match = require('nodemon/lib/monitor/match');
const res = require('express/lib/response');

exports.postlogout=(req,res)=>{
    req.session.destroy()
    res.redirect('/login')
}


exports.postLogin=(req,res)=>{
    //destructuring request body
    const{email,password}=req.body
    
    //validate email password
    if(email==''&& password==''){
        req.flash ('error_message','All fields are required')
        res.redirect('/login')
    }else{
        //check if email exists or not
        con.query ('SELECT * FROM user WHERE email=?',email,(error,result)=>{
            if(error)throw error
            if(result.length==1){
                //check password
                let originalPassword = result [0].password
                bcrypt.compare (password,originalPassword,(error,match)=>{
                    if(match){
                        //storing the user information in the session
                        req.session.userId=result[0].id
                        req.session.name=result[0].name
                        req.session.email=result[0].email
                        req.flash('success_message','logged in successfully')
                        res.redirect('/blog')
                    }else{
                        req.flash('error_message','invalid password')
                        res.redirect('login')
                    }
                })
            }else{
                req.flash('error_message','This email doesnot exist')
                res.redirect('login')
            }
        })
    }
}

exports.home=(req,res)=>{
res.render('home',{title: 'HOME'});
}

exports.about=(req,res)=>{
    res.render('about',{title: 'ABOUT'});
}

exports.blog=(req,res)=>{
    // using connection object to fetch the data from the post table
    con.query('SELECT * FROM post',(error,results)=>{
        if(error) throw error
        results.map(post=>{
            //post.description = post.description.substring(0,200) + '...';
            let date = new Date(post.created_at);
            let year = date.getFullYear();
            let month = date.getMonth() +1;
            let day = date.getDate();
            post.created_at = (`${year}-${month}-${day}`);
        })
        res.render('blog',{results:results , title: 'BLOG'});
    })
    
}

exports.login=(req,res)=>{
    res.render('login',{title: 'LOGIN'});
}

exports.register=(req,res)=>{
    res.render('register',{title: 'REGISTER'});
}

exports.postDetail=(req,res)=>{
    let id = req.params.id;
    con.query('SELECT * FROM post WHERE id=?',id,(error,result)=>{
        if(error) throw error;
        let date = new Date(result[0].created_at)
        let year = date.getFullYear();
        let month = date.getMonth() +1;
        let day = date.getDate();
        result[0].created_at = (`${year}-${month}-${day}`);
            
        res.render('postDetail',{post:result[0]});
    })
}

exports.createPost=(req,res)=>{
    res.render('createPost',{title: 'CREATEPOST'});
}

exports.savePost=(req,res)=>{
    //destructurig request body
    const {title,description,author} = req.body;
    if(title !=='' && description !==''  && req.filename !=='' && author !==''){
        //making our object ready to be saved in the database
        const post = {
        title: title,
        description: description,
        image: req.file.filename,
        author: author
    };
    //saving post object in database using connection object
    con.query('INSERT INTO post SET ?',post,(error,result)=>{
        if(error){
            con.rollback();
            throw error;
        }
        req.flash('success_message','Post created successfully');
        res.redirect('/blog');
    });
    }else{
        req.flash('error_message', 'All fields are required');
        res.redirect('/createPost');
    }
}

exports.edit=(req,res)=>{
    let id = req.params.id;
    con.query('SELECT * FROM post WHERE id=?',id,(error,result)=>{
        if(error) throw error;
        res.render('edit',{post:result[0]});
        })
}

exports.update=(req,res) => {
    const {title, description, author} = req.body;
    let id = req.params.id;
    con.query('UPDATE post SET title=?, description=?, image=?, author=? WHERE id=?', [title, description, req.file.filename, author, id], (error, result) => {
        if(error){
            con.rollback();
            throw error;
        }
        res.redirect('/blog');
    });
}

exports.delete=(req,res)=>{
    let id = req.params.id;
    con.query('DELETE FROM post WHERE id=?', id, (error, result) => {
        if (error) throw error;
        res.redirect('/blog');
    })
}

exports.saveUser=async (req,res)=>{
    // validating incoming request body
    const userSchema = joi.object({
        name:joi.string().min(2).max(32).required(),
        address:joi.string().required(),
        email:joi.string().email().required(),
        password:joi.string().min(4).max(32).required()
    })
    const {error} = userSchema.validate(req.body)
    if(error){
        req.flash('error_message',error.message);
        res.redirect('/register');
    }else{
        // destructuring request body
        const {name,address,email,password}=req.body
        
        
        // ----------------------------------------------
        
        // ALTERNATIVE METHOD for error, "Password cannot be null"
        
        // let hashedPassword = await bcrypt.hash(password,10);
        // also add 'async' in line 'exports.saveUser = async (req, res) => {}
        
        // ---------------------------------------------- 
        
        // hashing password
        let hashedPassword=await bcrypt.hash(password,10)

        // checking if the user is already registered and doesn't need to be re-registered
        con.query('SELECT * FROM user WHERE email=?',email,(error,user) => {
            if(error) throw error;

            if(user.length>0){
                // if the user already exists
                req.flash('error_message', 'This email is already in use.');
                res.redirect('/register')
            }else{
                // making a new user object to save in 'user' database
                const user={
                    name,
                    address,
                    email,
                    password:hashedPassword
                }
                
                con.query('INSERT INTO user SET ?',user,(error,result) => {
                    if(error){
                        con.rollback();
                        throw error;
                    }
                    req.flash('success_message','Registration Successful!');
                    res.redirect('/login');
                })

            }
        })
    }
}