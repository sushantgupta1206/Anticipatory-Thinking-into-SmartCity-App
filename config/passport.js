var LocalStrategy = require('passport-local').Strategy;
var mysql = require('mysql');
var bcrypt = require('bcrypt-nodejs');
var dbconfig = require('./database');
var connection = mysql.createConnection(dbconfig.connection);

connection.query('USE ' + dbconfig.database);

module.exports = function(passport) {
    passport.serializeUser(function(user, done){
        //console.log('Serializing User');
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        connection.query("SELECT * FROM users WHERE id = ? ",[id], function(err, rows){
            //console.log('De-Serializing User: ' + rows[0]);
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
            console.log(req);
            connection.query("select * from users where username = ?",[username], function(err, rows) {
                if (err)
                    return done(err);
                if (rows.length) {
                    return done(null, false, req.flash('registerMsg', 'The provided username is not available.'));
                } else {
                    connection.query("select * from users where email = ?", [req.body.email], function(err, rows){
                        if(err)
                            return done(err);
                        if(rows.length){
                            return done(null, false, req.flash('registerMsg', 'The provided email address is not available.'));
                        } else {
                            var newUser = {
                                username: username,
                                password: bcrypt.hashSync(password, null, null),
                            };

                            var insertQuery = "insert into users ( id, name, username, password, email, question, answer) values (?,?,?,?,?,?,?);";

                            connection.query(insertQuery,[null, req.body.fullname, newUser.username, newUser.password, req.body.email, req.body.question, req.body.answer],function(err, rows) {
                                //console.log("Insertion successful: " + rows);
                                newUser.id = rows.insertId;
                                return done(null, newUser);
                            });
                        }
                    })                    
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

                if (!bcrypt.compareSync(password, rows[0].password))
                    return done(null, false, req.flash('loginMsg', 'Username and password combination is wrong.'));

                return done(null, rows[0]);
            });
        })
    );
};