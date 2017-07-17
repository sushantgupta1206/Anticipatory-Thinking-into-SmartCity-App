var LocalStrategy = require('passport-local').Strategy;
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('./database');
var connection = mysql.createConnection(dbconfig.connection);
var moment = require('moment');

var nodemailer = require('nodemailer');

connection.query('USE ' + dbconfig.database);

module.exports = function(passport) {
    passport.serializeUser(function(user, done){
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        connection.query("SELECT * FROM users WHERE id = ? ",[id], function(err, rows){
            done(err, rows[0]);
        });
    });

    passport.use('local-signup', 
        new LocalStrategy({
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true
        }, 
        function(req, username, password, done){
            //Check if username is available
            connection.query("select * from users where username = ?",[username], function(err, rows) {
                if (err)
                    return done(err);//If error is encountered, send it to callback.
                if (rows.length) {
                    //If row with username already exists, then send error message
                    return done(null, false, req.flash('registerMsg', 'The provided username is not available.'));
                } else {
                    //Check the same for email address.
                    connection.query("select * from users where email = ?", [req.body.email], function(err, rows){
                        if(err)
                            return done(err);
                        if(rows.length){
                            return done(null, false, req.flash('registerMsg', 'The provided email address is not available.'));
                        } else {
                            //If both username and email address are available, then send verification mail
                            var transporter = nodemailer.createTransport({
                                service: 'gmail',
                                auth: {
                                    user: 'scat.noreply@gmail.com',
                                    pass: 'noreplyscat1#'
                                }
                            });

                            var newUser = {
                                username: username,
                                password: bcrypt.hashSync(password, null, null)
                            };
                            var token = bcrypt.hashSync(username, null, null);
                            var link = "http://" + req.get('host') + "/verify?username=" + username + "&token=" + token;
                            console.log("Verification URL - " + link);

                            transporter.sendMail({
                                from: 'scat.noreply@gmail.com',
                                to: req.body.email,
                                subject: 'Verify Account',
                                text: 'Please verify your account by clicking on the link (' + link + ') to login and use the application'
                            });
                            //Once mail is sent, insert into users table.
                            var insertQuery = "insert into users ( id, name, username, password, email, question, answer, verified_ind) values (?,?,?,?,?,?,?,?);";

                            connection.query(insertQuery,[null, req.body.fullname, newUser.username, newUser.password, req.body.email, req.body.question, req.body.answer, false],function(err, result) {
                                if(err){
                                    console.log('Server Error - ' + err);
                                    return done(err);
                                }                                
                                console.log("Insertion into users table successful: ");
                                console.log(result);
                                newUser.id = result.insertId;
                                console.log(newUser);
                                //After that insert into user verification table
                                var verif_query = 'insert into user_verification (username , token, created_dttm) values(?, ?, ?);';
                                var sql_date = moment.utc().format('YYYY-MM-DD HH:mm:ss');
                                console.log('SQL Date -' + sql_date);
                                connection.query(verif_query, [newUser.username, token, sql_date], function(error, result){
                                    if(error){
                                        console.log('Internal server error - ' + error);
                                        return done(err);
                                    } else{
                                        console.log('Successfully inserted into database');
                                        return done(null, newUser, req.flash('loginMsg', 'Successfully registered. Please verify your account before logging in!!'));
                                    }
                                });                                
                            });
                        }
                    });                  
                }
            });
        })
    );

  passport.use('local-login', 
        new LocalStrategy({
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true
        }, 
        function(req, username, password, done){

connection.query("select * from users where username = ?",[username], function(err, rows){
                if (err)
                    return done(err);
                if (!rows.length) {
                    return done(null, false, req.flash('loginMsg', 'No such user found.'));
                }
                
                if (!bcrypt.compareSync(password, rows[0].password)) {
                    console.log('BCrypt section');
                    connection.query("select * from users where username = ?", [username], function (err, rows) {
                        if (err) 
                            return done(err);
                        if (rows[0].attempts == 0)
                            return done(null, false, req.flash('loginMsg', 'Please reset your password as max attempts are completed.'));
                        var attempts = rows[0].attempts;
                        var sql_query = "UPDATE users SET attempts = " + --attempts + " WHERE username = '" + username + "';";
                        console.log(sql_query);
                        connection.query(sql_query, function (err, rows) {
                            if (err)
                                return done(err);
                            console.log('Updating the number of attempts ' + attempts);
                            //var msg = (attempts + ' attempts are left to login. Username and password combination is wrong.');
                            return done(null, false, req.flash('loginMsg', 'failed'));
                        });
                    }); 
                }else{
                    if(rows[0].verified_ind === 0){
                        return done(null, false, req.flash('loginMsg', 'You account has not been verified yet.'));
                    }
                    console.log('Success!');
                    return done(null, rows[0]);
                }                
            });
		}
		)
		);
};
