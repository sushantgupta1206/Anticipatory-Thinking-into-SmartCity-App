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