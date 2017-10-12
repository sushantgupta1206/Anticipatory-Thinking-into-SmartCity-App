var expressValidator = require('express-validator');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var mysql = require('mysql');
var config = require('../config/config');
var connection = mysql.createConnection({
    'host': config.host,
    'user': config.username,
    'password': config.password,
    'database': config.database
});
connection.connect();
var bcrypt = require('bcrypt-nodejs');
var nodemailer = require('nodemailer');
var moment = require('moment');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(expressValidator());

module.exports = function(app, passport) {
    app.get('/', function (req, res) {
        res.render('login.ejs', {message: req.flash('loginMsg')});
    });

    app.get('/login', function (req, res) {
        res.render('login.ejs', {message: req.flash('loginMsg')});
    });

    app.get('/home', isLoggedIn, function (req, res) {
        console.log(req.user);
        res.render('home.ejs', { user: req.user });
    });

    // route for logging out
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/auth/google', passport.authenticate('google', {
        scope: ['profile', 'email']
    }));

    app.get('/auth/google/callback', passport.authenticate('google', {
        successRedirect: '/home',
        failureRedirect: '/'
    }));

/*
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

    app.get('/home', isLoggedIn, function(req, res){
        //console.log(req);
        console.log("Going to render home page");
        res.render('home.ejs', {
            user: req.user
        });
    });
*/
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

    app.post('/forgot', function (req, res) {
        var forEmail = req.body.forgot_email;
        connection.query("select * from users where email = ?", [forEmail], function (err, rows) {
            if (err) {
                //If there is any error, then print in console
                console.log('Error while checking if email address is valid.' + err);
            } else if (!rows.length) {
                //If no rows were retrieved, then the email address does not exist in records
                console.log('No such email id found');
                //return done(null, false, req.flash('forgotMsg', 'Email id not in database'));
                res.render('forgot.ejs', { forMsg: 'No such email address found.' });
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
                resres.render('login.ejs', { message: "" });
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
        var data = req.body;
        var pname = data.pname;
        var consequences = data.fw;
        var sql_date = moment.utc().format('YYYY-MM-DD HH:mm:ss');
        
        /**
         * Pseudocode:
         * Check if the project exists
         *      If it exists
         *          1. Delete the existing policies tagged to consequences
         *          2. Delete the consequences
         *          3. Insert the new consequences
         *          4. Retrieve the consequence IDs to insert the policies
         *          5. Insert the new policies tagged to consequences
         *      If the project does not exist
         *          1. Create a new project
         *          2. Insert the new consequences
         *          3. Retrieve the consequence IDS to insert the policies
         *          4. Insert the new policies tagged to consequences
         */ 
        
        var query = "select * from projects where pname = ? and powner = ?";
        connection.query(query, [data.pname, req.user.username], function(error, rows){
            if(error){
                console.error('Error selecting projects');
                throw error;
            }else if(rows.length){
                console.log('Project already exists');
                var rowID = rows[0].pid;                
                // 1. Delete the existing policies tagged to consequences
                var delete_policies = "delete from conseq_policies where pid = " + rowID;
                connection.query(delete_policies, function(error_delete, delete_result){
                    if(error_delete){
                        console.log('Error removing old policies');
                        throw error_delete;
                    }
                    var delete_consequences = "delete from consequences where pid = " + rowID;
                    // 2. Delete the consequences
                    connection.query(delete_consequences, function(error, result){
                        if(error){
                            console.error('Error deleting entries in consequences table');
                            throw error;
                        }
                        var values = [];
                        for(var i = 0; i < consequences.length; i++){
                            var c = consequences[i];
                            var item = [null, c.name, c.id, c.parentid, c.likelihood, c.impact, c.importance, c.notes, rowID];
                            values.push(item);
                        }
                        var insert_conseq_query = "insert into consequences (cid, name, cnodeid, cparentnodeid, likelihood, impact, importance, notes, pid) values ?;";
                        // 3. Insert the new consequences
                        connection.query(insert_conseq_query, [values], function(err, result){
                            if(err){
                                console.error('Error inserting into consequences table - ' + err);
                                throw err;
                            }
                            var insertID = result.insertId;
                            var select_con_id_query = "select c.cid, c.cnodeid from consequences c where c.pid = " + rowID;
                            // 4. Retrieve the consequence IDs to insert the policies
                            connection.query(select_con_id_query, function(error_select, select_rows){
                                if(error_select){
                                    console.log('Error selecting consequences');
                                    throw err;
                                }
                                // Construct array to insert the consequences policies
                                var policy_values = [];
                                for(var idx = 0; idx < select_rows.length; idx++){
                                    for(var k = 0; k < consequences.length; k++){
                                        if(select_rows[idx].cnodeid == consequences[k].id){
                                            for(var j = 0; j < consequences[k].policies.length; j++){
                                                if(consequences[k].policies[j] != null || consequences[k].policies[j] != "null")
                                                    policy_values.push([select_rows[idx].cid, rowID, consequences[k].policies[j].toString()]);
                                            }
                                        }                                        
                                    }
                                }
                                var insert_policies_query = "insert into conseq_policies (cid, pid, policyid) values ?;";
                                // 5. Insert the new policies tagged to consequences
                                connection.query(insert_policies_query, [policy_values], function(error, rows){
                                    if(error){
                                        console.log('Error inserting policies');
                                        throw error;
                                    }
                                    var response = {
                                        pid: rowID,
                                        status: 200,
                                        success: 'Inserted futures wheel into the DB'
                                    };
                                    res.end(JSON.stringify(response));
                                });
                            });                                                                                      
                        });                                                                                                                
                    });
                });                                
            }else{
                console.log('Project not found');
                var project_insert_query = "insert into projects (pid, pname, powner, created_dttm) values (?, ?, ?, ?);";
                // 1. Create a new project
                connection.query(project_insert_query, [null, pname, req.user.username, sql_date], function(err, result){
                    if(err){
                        console.error("Error creating a new project - " + err);
                        throw err; 
                    }
                    var rowID = result.insertId;
                    var values = [];
                    for(var i = 0; i < consequences.length; i++){                        
                        var c = consequences[i];
                        var item = [null, c.name, c.id, c.parentid, c.likelihood, c.impact, c.importance, c.notes, rowID];
                        values.push(item);
                    }
                        
                    var insert_conseq_query = "insert into consequences (cid, name, cnodeid, cparentnodeid, likelihood, impact, importance, notes, pid) values ?;";
                    // 2. Insert the new consequences
                    connection.query(insert_conseq_query, [values], function(err, resultRow){
                        if(err){
                            console.error('Error inserting into consequences table - ' + err);
                            throw err;
                        }
                        var insertID = resultRow.insertId;
                        var select_con_id_query = "select c.cid, c.cnodeid from consequences c where c.pid = " + rowID;
                        // 3. Retrieve the consequence IDs to insert the policies
                        connection.query(select_con_id_query, function(error_select, select_rows){
                            if(error_select){
                                console.log('Error selecting consequences');
                                throw err;
                            }
                            // Construct array to insert the consequences policies
                            var policy_values = [];
                            for(var idx = 0; idx < select_rows.length; idx++){
                                for(var k = 0; k < consequences.length; k++){
                                    if(select_rows[idx].cnodeid == consequences[k].id){
                                        for(var j = 0; j < consequences[k].policies.length; j++){
                                            policy_values.push([select_rows[idx].cid, rowID, consequences[k].policies[j].toString()]);
                                        }
                                    }                                        
                                }
                            }
                            var insert_policies_query = "insert into conseq_policies (cid, pid, policyid) values ?;";
                            // 4. Insert the new policies tagged to consequences
                            connection.query(insert_policies_query, [policy_values], function(error, rows){
                                if(error){
                                    console.log('Error inserting policies');
                                    throw error;
                                }
                                var response = {
                                    pid: rowID,
                                    status: 200,
                                    success: 'Inserted futures wheel into the DB'
                                };
                                res.end(JSON.stringify(response));
                            });                            
                        }); 
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

    app.post('/get_fw_project', function(req, res){
        if(req.user && req.user.username){
            var pid = req.body.pid;
            var project_name = null;
            console.log(req.user.username + ' has requested to view project ID - ' + pid);
            connection.query("select * from projects p where p.pid=" + pid, function(error, result){
                if(error){
                    console.log(error);
                    res.status(500).send('Error retrieving project');
                }
                if(!result.length){
                    console.log('Project does not exist');
                    res.status(500).send('Project does not exist');
                }
                project_name = result[0].pname;
                if(result[0].powner == req.user.username && result[0].pid == pid){
                    var get_fw_query = "select * from projects p, consequences c, conseq_policies cp where p.pid = " + pid + " and c.pid = p.pid and (cp.cid=c.cid) union select p.*,c.*, c.cid, c.pid, null from projects p, consequences c, conseq_policies cp where p.pid = " + pid + " and c.pid = p.pid and c.cid not in (select cid from conseq_policies);";
                    connection.query(get_fw_query, function(error, rows){
                        if(error){
                            console.log(error);
                            res.status(500).send('Error retrieving consequences');
                        }else if(!rows.length){                            
                            var response = {
                                status: 200,
                                row_length: rows.length,
                                data: null,
                                pname: project_name                
                            }
                            res.end(JSON.stringify(response));
                        }else{
                            var consequences = [];   // This will store the future wheels object to be sent to the frontend
                            // Construct the tagged policies section for each consequence
                            for(var i = 0; i < rows.length; i++){
                                var found = false;
                                for(var j = 0; j < consequences.length; j++){
                                    // The condition after && is to ensure that null values dont creep in
                                    if(rows[i].cid == consequences[j].cid && (rows[i].policyid != null)){
                                        found = true;
                                        consequences[j].policies.push(rows[i].policyid);
                                    }
                                }
                                if(found == false){
                                    rows[i].policies = [];
                                    if(rows[i].policyid != null){
                                        rows[i].policies.push(rows[i].policyid);
                                    }                                        
                                    delete rows[i].policyid;
                                    consequences.push(rows[i]);                                    
                                }
                            }

                            var response = {
                                status: 200,
                                row_length: consequences.length,
                                data: consequences,
                                pname: project_name
                            }
                            res.end(JSON.stringify(response)); 
                        }
                    });
                }else{//If the owner is different, meaning shared item

                }
            });            
        }
    });

    app.post('/delete_project', function(req, res){    
        pname = req.body.pname;
        pid = req.body.pid;
        console.log(req.body);
        connection.query('select * from projects p where p.pname = ? and p.powner = ?;', [pname, req.user.username], function(error, rows){
            if(error){
                console.log(error);
                res.status(500).send('Error deleting project');
            }else if(!rows.length){
                console.log(error);
                res.status(500).send('Project not found or only project owner can delete the project');
            }else{
                pid = rows[0].pid;
                console.log('Going to delete project');
                connection.query('delete from projects where pid = ' + pid, function(error, result){
                    if(error){
                        console.log(error);
                        res.status(500).send('Error deleting project');
                    }else{
                        console.log('Number of affected rows - ' + result.affectedRows);
                        res.status(200).send('Project successfully deleted');
                    }
                });
            }
        });
    });

    app.post('/view_policies', function(req, res){
        console.log('View policies request');
        connection.query("select * from policies", function(err, result){
            if(err){
                res.status(500).send('Failed to retrieve policies');                
            }else{
                console.log(result);
                var response = {
                    status: 200,
                    data: result,
                }
                res.end(JSON.stringify(response)); 
            }
        });
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
