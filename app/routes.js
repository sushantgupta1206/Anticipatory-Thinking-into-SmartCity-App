var expressValidator = require('express-validator');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var mysql = require('mysql');
var dbconfig = require('../config/database');
var connection = mysql.createConnection(dbconfig.connection);
connection.query('USE ' + dbconfig.database);
var bcrypt = require('bcrypt-nodejs');
var nodemailer = require('nodemailer');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(expressValidator());

module.exports = function(app, passport) {
    app.get('/', function(req, res){
        console.log("Going to render login page");
        res.render('login.ejs', {message: req.flash('loginMsg')});
    });

    app.get('/login', redirectToHome, function(req, res){
        console.log("Going to render login page");
        res.render('login.ejs', {message: req.flash('loginMsg')});
    });

    app.get('/register', function(req, res){
        console.log("Going to render signup page");
        res.render('signup.ejs', {message: req.flash('registerMsg')});
    });

    app.get('/verified', function(req, res){
        console.log("Rendering verified page");
        res.render('verified.ejs');
    });

    app.get('/resend', function(req, res){
        console.log("Rendering resend email page");
        res.render('resend.ejs', {resendMsg: null});
    });

    app.post('/register', passport.authenticate('local-signup', {
		successRedirect : '/login',
		failureRedirect : '/register',
		failureFlash : true
	}));

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/home',
        failureRedirect: '/',
        failureFlash: true
    }));

    app.get('/home', isLoggedIn, function(req, res){
        //console.log(req);
        console.log("Going to render home page");
        res.render('home.ejs', {
            user: req.user
        });
    });

    app.get('/logout', function(req, res) {
        console.log("Logging out of application");
		req.logout();
		res.redirect('/');
	});   

    app.get('/verify', function(req, res){
        var username = req.query.username;
        var token = req.query.token;
        console.log('Username: ' + username);
        console.log('Token: ' + token);
        var cipher = bcrypt.hashSync(username, null, null);
        console.log('Cipher: ' + cipher);
        console.log('Status - ' + bcrypt.compareSync(username, token));
        if(bcrypt.compareSync(username, token)){
            console.log('Tokens matched during account verification');
            var update_query = "update fw.users set verified_ind = 1 where username = '" + username + "';";
            console.log("Update Query - " + update_query);
            connection.query(update_query, function(err, result) {
                if(err){
                    console.log("Error occurred");
                }else{
                    if(result.affectedRows > 0){
                        console.log("Verification done!!!");
                        res.redirect('/verified');
                    }                        
                }
            });
        }
    });

    app.get('/forgot', function(req, res){
        res.render('forgot.ejs');
    });

    app.post('/forgot', function(req, res){
        var email = req.body.forgot_email;
        console.log("Received request to reset password for " + email);
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'scat.noreply@gmail.com',
                pass: 'noreplyscat1#'
            }
        });

        var link = "http://" + req.get('host') + "/reset?email=" + email + "&token=" + bcrypt.hashSync(email, null, null);
        console.log("Password Reset URL - " + link);

        transporter.sendMail({
            from: 'scat.noreply@gmail.com',
            to: email,
            subject: 'Reset Password Email',
            text: 'Please click this link(' + link + ') to reset your account password'
        });       

        console.log("Reset passsword link emailed!!");
        res.render('login.ejs', {message: ""});
    });

    app.get('/reset', function(req, res){
        var email = req.query.email;
        var token = req.query.token;
        console.log('Handling reset request');
        console.log('email - ' + email);
        console.log('token - ' + token);
        //TODO - Handle invalid URL params
        if(!email || !token){
            return res.redirect('/forgot');
        }
        if(bcrypt.compareSync(email, token)){
            res.render('reset.ejs');
        }
    });

    app.post('/reset', function(req, res){        
        console.log('Handling post request for password reset');
        var email = req.query.email;
        var token = req.query.token;
        console.log('Email - ' + email);
        console.log('Token - ' + token);
        var pwd = req.body.reset_pwd;
        var conf_pwd = req.body.reset_pwd_cnf;
        
        //TODO - validate post params
        if(email === null || token === null){
            return res.redirect('/forgot');
        }
        if(bcrypt.compareSync(email, token)){
            console.log('Tokens are good');
            var update_query = "update fw.users set password = '" + bcrypt.hashSync(pwd, null, null) + "' where email = '" + email + "';";
            console.log(update_query);
            connection.query(update_query, function(err, result){
                if(err){
                    console.log("Error updating password");
                }else{
                    if(result.affectedRows > 0){
                        console.log("Password updated!!!");
                        res.redirect('/login');
                    }                        
                }
            });
        }
    });

    app.post('/resend', function(req, res){
        var resend_email = req.body.resend_email;
        console.log('Request to resend account verification email to ' + resend_email);
        //Verify if it is a valid email.
        connection.query("select * from users where email = ?", [resend_email], function(err, rows){
            if(err) {
                console.log('Error while checking if email address is valid.');
            } else if(!rows.length) {
                res.render('resend.ejs', {resendMsg: 'No such email address found.'});
            } else {
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'scat.noreply@gmail.com',
                        pass: 'noreplyscat1#'
                    }
                });

                var link = "http://" + req.get('host') + "/verify?username=" + rows[0].username + "&token=" + bcrypt.hashSync(rows[0].username, null, null);
                console.log("Verification URL - " + link);

                transporter.sendMail({
                    from: 'scat.noreply@gmail.com',
                    to: resend_email,
                    subject: 'Verify Account',
                    text: 'Please verify your account by clicking on the link (' + link + ') to login and use the application. This link is valid only for 24 hours'
                });
                console.log('Verification mail sent');            
                res.render('resend.ejs', {resendMsg: 'Resent verification email. Please verify within 24 hours.'});
                console.log('Check if control comes here or is pre-empted');
            }    
        });
    });

    app.use(function (err, req, res, next) {
        console.error(err.stack);
        res.status(500).send('Internal server error!');
    });
};

function isLoggedIn(req, res, next) {
    console.log('Inside isLoggedIn');
	if (req.isAuthenticated()){        
        return next();        
    }else{
        res.redirect('/');
    }	    
}

/*
 * This function redirects the user to the home page if they have already logged in.
 */
function redirectToHome(req, res, next){
    console.log('Inside redirectToHome');
    if(req.isAuthenticated() && req.user.verified_ind === 1)
        res.redirect('/home');
    return next();
}