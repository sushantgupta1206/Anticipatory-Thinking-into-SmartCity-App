var express = require('express');
var session  = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var methodOverride = require('method-override');

var app = express();
var port = process.env.PORT || 3000;

var passport = require('passport');
var flash = require('connect-flash');

require('./config/passport')(passport);

app.use(express.static(__dirname + '/public'));
app.use(cookieParser());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(expressValidator());

app.set('view engine', 'ejs');

app.use(session({
    secret: 'at-fw',
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

require('./app/routes.js')(app, passport);

app.listen(port);
console.log('Server running on port ' + port);