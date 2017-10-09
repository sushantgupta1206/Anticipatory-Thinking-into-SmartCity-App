var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var config = require('./config');

var connection = mysql.createConnection({
    'host': config.host,
    'user': config.username,
    'password': config.password,
    'database': config.database
});
connection.connect();

var moment = require('moment');
var nodemailer = require('nodemailer');

module.exports = function(passport) {
    passport.serializeUser(function(user, done){
        done(null, user);
    });

    passport.deserializeUser(function(obj, done) {        
        done(null, obj);
    });

    passport.use(new GoogleStrategy({
        clientID: config.clientID,
        clientSecret: config.clientSecret,
        callbackURL: config.callbackURL,
        passReqToCallback: true
    }, function(req, token, refreshToken, profile, done){
        process.nextTick(function(){
            connection.query('select * from users where uid = ?', [profile.id], function(error, result){
                if(error){
                    throw error;
                }
                if(result.length === 0){//If user is not found add an entry to the database
                    console.log(profile);
                    console.log('No such user found');
                    var newUser = {
                        id: profile.id,
                        token: token,
                        fullname: profile.displayName,
                        username: profile.emails[0].value,
                        email: profile.emails[0].value
                    };

                    console.log(newUser);
                    console.log('length of token - ' + newUser.token.length);
                    // Email address will serve as the username too for the user
                    connection.query('insert into users(uid, token, username, email, name) values (?,?,?,?,?)', [newUser.id, newUser.token, newUser.email, newUser.email, newUser.fullname], function(error, rows){
                        if(error){
                            return done(error);
                        }
                        done(null, newUser);
                    });
                }else{//User already exists
                    var user = {
                        id: profile.id,
                        token: token,
                        fullname: profile.displayName,
                        username: profile.emails[0].value,
                        email: profile.emails[0].value
                    };
                    return done(null, user);
                }
            });
        })
    }));
}

/*
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
                        if (rows[0].attempts == 1){
							//var SECS_IN_DAY = 24*60*60*1000;
							//var date = new Date(); //moment //update query here for nattempts
							var attempts = rows[0].attempts;
							var date = moment.utc().format('YYYY-MM-DD HH:mm:ss'); //current time stamp //moment js
							console.log('date in bcrypt:' +date);
							var update_locktime_query = "UPDATE users SET lock_time = '"+date+"' , attempts =0 WHERE username = '" + username + "';";
							console.log(update_locktime_query);
                        	connection.query(update_locktime_query, function (err, update_rows) {
                            if (err)
                                return done(err);
                            console.log('Updating the lock time');
                        	return done(null, false, req.flash('loginMsg', 'Please reset your password as max attempts are completed or try after 24 hours.'));
							});
						}else if(rows[0].attempts==0){return done(null, false, req.flash('loginMsg', 'Wrong password max attempts done kindly reset passsword'));}
						else{
						var attempts = rows[0].attempts;
                        var sql_query = "UPDATE users SET attempts = " + --attempts + " WHERE username = '" + username + "';";
                        console.log(sql_query);
                        connection.query(sql_query, function (err, update_rows) {
                            if (err)
                                return done(err);
                            console.log('Updating the number of attempts ' + attempts);
                            //var msg = (attempts + ' attempts are left to login. Username and password combination is wrong.');
                            return done(null, false, req.flash('loginMsg', 'Try again; Total 3 attempts allowed'));
                        });
						}
                    }); 
                }else{
                    if(rows[0].verified_ind === 0){
                        return done(null, false, req.flash('loginMsg', 'You account has not been verified yet.'));
                    }
					
                    //var date=new Date();
					var date = moment.utc().format('YYYY-MM-DD HH:mm:ss'); //current time stamp //moment js
					var date_local=new Date(date + "Z");
					console.log('date:' + date); // GMT Time
					console.log('date in local: '+date_local);
					console.log('locktime:' +rows[0].lock_time);
					//console.log(rows[0].lock_time); // Local Time  (kuch toh machqa hai)
					var locked_date = new Date(rows[0].lock_time + "Z");
                    console.log('locked_date: ' +locked_date); //Local Time
                    console.log('locked date get time: '+locked_date.getTime()); //difference is microseconds
                    console.log('Difference - ' + (date_local - locked_date)); 
                    if(rows[0].lock_time==null){
						console.log("entering the lockdate =null if consition");
						var update_query = "UPDATE fw.users SET attempts = 3 WHERE username = '" + username + "';";
						console.log(update_query);
						connection.query(update_query, function (err, update_rows) {
							if (err)
								return done(err);
							console.log('Success!');
							//console.log(row[0]);
							return done(null, rows[0]);//should go to main home page of FW
					
					});	
					}else{
						console.log('entering the else condition for locked_date not null');
						var time_diff = (date_local - locked_date);
						var SECS_IN_DAY= 24*60*60*1000;
						console.log("time limit of days: " + SECS_IN_DAY);
						console.log("difference of time now: "+time_diff);
						if(locked_date!=null && time_diff >= SECS_IN_DAY){
							var reset_lock_query = "update fw.users set lock_time = NULL, attempts =3 where username = '" + username + "';";
							//var update_query = "UPDATE users SET attempts = 3 WHERE username = '" + username + "';";
							console.log(reset_lock_query);
							connection.query(reset_lock_query, function (err, update_rows) {
								if (err)
									return done(err);
							console.log('Lock time reset to null!');
						//return done(null, rows[0]);
							console.log('Success!');
							return done(null, rows[0]);
										
						});
					}else return done(null, false, req.flash('loginMsg', 'Account still locked'));
					
					}
				}                
            });
		}
		)
		);
};
*/