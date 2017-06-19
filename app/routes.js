var expressValidator = require('express-validator');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var express = require('express');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(expressValidator());

module.exports = function(app, passport) {
    app.get('/', function(req, res){
        res.render('login.ejs', {message: req.flash('loginMsg')});
    });

    app.get('/login', function(req, res){
        res.render('login.ejs', {message: req.flash('loginMsg')});
    });

    app.get('/register', function(req, res){
        res.render('signup.ejs', {message: req.flash('registerMsg')});
    });

    app.post('/register', passport.authenticate('local-signup', {
		successRedirect : '/home',
		failureRedirect : '/register',
		failureFlash : true
	}));

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/home',
        failureRedirect: '/',
        failureFlash: true
    }));

    app.get('/home', isLoggedIn, function(req, res){
        console.log(req);
        res.render('home.ejs', {
            user: req.user
        });
    });    
};

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();
    else
	    res.redirect('/');
}