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
var moment = require('moment');

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
        console.log('Status - ' + bcrypt.compareSync(username, token));
        var get_query = "select * from fw.user_verification where username = '" + username + "';";
        connection.query(get_query, function(error, result){
            if(error){
                console.log('Internal server error - ' + error)
                res.send('Internal server error');
            }else{
                if(token != result[0].token){
                    console.log('Tokens do not match');
                    res.send('Token for verification is invalid');                 
                }else{              
                    var SECS_IN_DAY = 24*60*60*1000;//Change this value for testing
                    var date = new Date();
                    console.log(date);
                    var created_date = new Date(result[0].created_dttm + "Z");
                    console.log(created_date.getTime());
                    console.log('Difference - ' + (date.getTime() - created_date.getTime()));
                    var time_diff = (date.getTime() - created_date.getTime());
                    if(time_diff <= SECS_IN_DAY){
                        var update_query = "update fw.users set verified_ind = 1 where username = '" + username + "';";
                        console.log("Update Query - " + update_query);
                        connection.query(update_query, function(err, result) {
                            if(err){
                                console.log("Error updating database - " + err);
                            }else{
                                if(result.affectedRows > 0){
                                    console.log("Account verified!!!");
                                    res.redirect('/verified');
                                }                        
                            }
                        });
                    }else{
                        console.log('Link has expired. Go to login page to resend account verification link.');
                        res.send("Link has expired. Go to <a href='/login'>login page</a> to resend account verification link.");
                    }                    
                }
            }
        });        
    });

    app.post('/resend', function(req, res){
        var resend_email = req.body.resend_email;
        console.log('Request to resend account verification email to ' + resend_email);
        //Verify if it is a valid email.
        connection.query("select * from users where email = ?", [resend_email], function(err, rows){
            if(err) {
                //If there is any error, then print in console
                console.log('Error while checking if email address is valid.' + err);
            } else if(!rows.length) {
                //If no rows were retrieved, then the email address does not exist in records
                res.render('resend.ejs', {resendMsg: 'No such email address found.'});
            } else {
                //If select is successful, then first send the email and update the user_verification table with new information.
                var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'scat.noreply@gmail.com',
                        pass: 'noreplyscat1#'
                    }
                });
                var username = rows[0].username;
                var token = bcrypt.hashSync(username, null, null);
                var link = "http://" + req.get('host') + "/verify?username=" + username + "&token=" + token;
                console.log("Verification URL - " + link);

                transporter.sendMail({
                    from: 'scat.noreply@gmail.com',
                    to: resend_email,
                    subject: 'Verify Account',
                    text: 'Please verify your account by clicking on the link (' + link + ') to login and use the application. This link is valid only for 24 hours'
                });
                console.log('Verification mail sent');  
                //Once mail is sent, update the database with new values.
                var update_verif_query = 'update user_verification set token = ?, created_dttm = ? where username = ?';
                var sql_date = moment.utc().format('YYYY-MM-DD HH:mm:ss');
                connection.query(update_verif_query, [token, sql_date, username], function(error, result){
                    if(error){
                        console.log('Internal server error - ' + error);
                    } else{
                        console.log(result.affectedRows + " record(s) updated");
                        console.log('Successfully updated database with new values');
                        res.render('resend.ejs', {resendMsg: 'Resent verification email. Please verify within 24 hours.'});
                    }
                });                       
            }    
        });
    });

    app.get('/forgot', function(req, res){
        res.render('forgot.ejs',{forMsg: ""});
    });

    app.post('/forgot', function(req, res){
        var forEmail = req.body.forgot_email;
		connection.query("select * from users where email = ?", [forEmail], function(err, rows){
			if(err) {
                //If there is any error, then print in console
                console.log('Error while checking if email address is valid.' + err);
            } else if(!rows.length) {
                //If no rows were retrieved, then the email address does not exist in records
				console.log('No such email id found');
				//return done(null, false, req.flash('forgotMsg', 'Email id not in database'));
				res.render('forgot.ejs', {forMsg: 'No such email address found.'});
            } 
			else {
		console.log("Received request to reset password for " + forEmail);
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'scat.noreply@gmail.com',
                pass: 'noreplyscat1#'
            }
        });

        var link = "http://" + req.get('host') + "/reset?email=" + forEmail + "&token=" + bcrypt.hashSync(forEmail, null, null);
        console.log("Password Reset URL - " + link);

        transporter.sendMail({
            from: 'scat.noreply@gmail.com',
            to: forEmail,
            subject: 'Reset Password Email',
            text: 'Please click this link(' + link + ') to reset your account password'
        });       

        console.log("Reset passsword link emailed!!");
        res.render('login.ejs', {message: ""});
	}
	});
    });

    app.get('/reset', function(req, res){
        var email = req.query.email;
        var token = req.query.token;
        //console.log("Hi");
		console.log('Handling reset request');
        console.log('email - ' + email);
        console.log('token - ' + token);
        //console.log("HI");
		//TODO - Handle invalid URL params
        console.log(!email || !token);
		if(!email || !token){
            return res.redirect('/forgot');
        }
        console.log(bcrypt.compareSync(email, token));
		if(bcrypt.compareSync(email, token)){
            var reset_msg={};
			reset_msg.email=email;
			reset_msg.token=token;
			console.log(reset_msg);
        
			res.render('reset.ejs',{reset_msg: reset_msg});
        }
    });

    app.post('/reset', function(req, res){        
        console.log('Handling post request for password reset');
        //var email = req.body.email;
		console.log(req.body);
		var email = req.body.email;
		var token = req.body.token;
		var pwd = req.body.reset_pwd;
        var conf_pwd = req.body.reset_pwd_cnf;
        
        //TODO - validate post params
        if(email === null || token === null){
            return res.redirect('/forgot');
        }
        if(bcrypt.compareSync(email, token)){
            console.log('Tokens are good');
            var update_query = "update fw.users set password = '" + bcrypt.hashSync(pwd, null, null) + "' where email = '" + email + "';";
            //console.log(update_query);
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

    app.use(function (err, req, res, next) {
        console.error(err.stack);
        var status = err.status || 500;
        res.status(status).send('Internal server error!');
    });

    //Check if project name is available
    app.post('/check_project_name', function(req, res){
        var data = req.body;
        console.log(data.pname);
        console.log(req.user.username);
        var query = "select * from projects where pname = ? and powner = ?";
        connection.query(query, [data.pname, req.user.username], function(error, rows){
            if(error){
                console.error('Error fetching projects');
                throw error;
            }else if(rows.length){
                console.log('Project already exists');
                var response = {
                    isAvailable: false,
                    status: 200                    
                }
                res.end(JSON.stringify(response));
            }else{
                console.log('Project not found');
                var response = {
                    isAvailable: true,
                    status: 200
                }
                res.end(JSON.stringify(response));
            }
        });
    });

    //Save futures wheel to database
    app.post('/save_project', function(req, res){
        console.log('POST data');
        var data = req.body;
        console.log(data);
        /**
         * JSON data received from AJAX call
         * {
         *      data: {
         *          pname: '',
         *          fw: []
         *      }
         * }
         */
        var pname = data.pname;
        var consequences = data.fw;
        var sql_date = moment.utc().format('YYYY-MM-DD HH:mm:ss');
        console.log(req.user);        
        
        var query = "select * from projects where pname = ? and powner = ?";
        connection.query(query, [data.pname, req.user.username], function(error, rows){
            if(error){
                console.error('Error selecting projects');
                throw error;
            }else if(rows.length){
                console.log('Project already exists');
                var rowID = rows[0].pid;
                var values = [];
                for(var i = 0; i < consequences.length; i++){
                    var c = consequences[i];
                    var item = [null, c.name, c.id, c.parentid, c.likelihood, c.impact, c.importance, c.comments, rowID];
                    values.push(item);
                }
                console.log(values);
                console.log('Figured out entries to be inserted into db');
                //Delete all the existing entries in consequences table and then insert the new ones.
                var delete_query = "delete from consequences where pid = " + rowID;
                connection.query(delete_query, function(error, result){
                    if(error){
                        console.error('Error deleting entries in consequences table');
                        throw error;
                    }
                    var insert_conseq_query = "insert into consequences (cid, cname, cnodeid, cparentnodeid, likelihood, impact, importance, notes, pid) values ?;";
                    connection.query(insert_conseq_query, [values], function(err, result){
                        if(err){
                            console.error('Error inserting into consequences table - ' + err);
                            throw err;
                        }
                        console.log('No of affected rows - ' + result.affectedRows);
                        var response = {
                            pid: rowID,
                            status: 200,
                            success: 'Inserted futures wheel into the DB'
                        }
                        res.end(JSON.stringify(response));
                    });                    
                });                
            }else{
                console.log('Project not found');
                var project_insert_query = "insert into projects (pid, pname, powner, created_dttm) values (?, ?, ?, ?);"
                connection.query(project_insert_query, [null, pname, req.user.username, sql_date], function(err, result){
                    if(err){
                        console.error("Error inserting into projects table - " + err);
                        throw err; 
                    }
                    var rowID = result.insertId;
                    console.log("Insert ID - " + rowID);
                    var values = [];
                    for(var i = 0; i < consequences.length; i++){
                        var c = consequences[i];
                        var item = [null, c.name, c.id, c.parentid, c.likelihood, c.impact, c.importance, c.comments, rowID];
                        values.push(item);
                    }
                    console.log(values);
                    console.log('Figured out entries to be inserted into db');
                    var insert_conseq_query = "insert into consequences (cid, cname, cnodeid, cparentnodeid, likelihood, impact, importance, notes, pid) values ?;";
                    connection.query(insert_conseq_query, [values], function(err, result){
                        if(err){
                            console.error('Error inserting into consequences table - ' + err);
                            throw err;
                        }
                        console.log('No of affected rows - ' + result.affectedRows);
                        var response = {
                            pid: rowID,
                            status: 200,
                            success: 'Inserted futures wheel into the DB'
                        }
                        res.end(JSON.stringify(response));
                    });                    
                });
            }
        });            
    });

    app.post('/view_items', function(req, res){
        if(req.user && req.user.username){
            console.log(req.user.username + " made request for viewing all projects");
            connection.query("select p.pid, p.pname, u.name, p.created_dttm from users u, projects p where u.username='" + req.user.username + "' and p.powner = u.username;", function(error, result){
                if(error){
                    console.log(error);
                    throw error;
                }else if(!result.length){
                    var response = {
                        resultLength: 0,
                        status: 200
                    };
                    res.end(JSON.stringify(response));
                }else{
                    var response = {
                        resultLength: result.length,
                        result: result,
                        status: 200
                    };
                    res.end(JSON.stringify(response));
                }
            });
        }else{
            console.log('Error with username or request object');
            res.status(400).send("HTTP Error 400 - Bad request");
        }      
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
