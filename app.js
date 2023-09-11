// importing express framework and creating app object of express
const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const routes = require('./routes/routes');
const session = require('express-session');
const flash = require('connect-flash');

//setting up templating engine
app.set('view engine','handlebars');
app.engine('handlebars',exphbs.engine());

//setting up public directory
app.use(express.static('public'));

// bodyparser config
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

//database connnection 
require('./database/connection');

app.use(session({
    secret:'thisIsMySecret',
    saveUninitialized:true,
    resave:false,
    cookie:{maxAge:600000}
}))

app.use(flash());

app.use((req, res, next) => {
    res.locals.success_message=req.flash('success_message');
    res.locals.error_message=req.flash('error_message');
    res.locals.userId=req.session.userId;
    res.locals.name=req.session.name;
    next();
})

app.use(routes)

// ERROR 404

app.use((req, res) =>{
    res.render('error404',{layout:'errorHandle'});
})

//server cofiguration 
app.listen(3000, (error, result) => {
    if (error) throw error;
    console.log('server is listening port 3000');
})
