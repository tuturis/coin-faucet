
require('dotenv').config()
const express = require('express');
const session = require('express-session');
const recaptcha = require('express-recaptcha');
const flash = require('express-flash');
const compression = require('compression');

const bodyParser = require('body-parser');

const mongoose = require('mongoose');
const altcoin = require('node-altcoin')()

const _ = require('underscore');
const path = require('path');
const chalk = require('chalk');

const app = express();

recaptcha.init(process.env.RECAPTCHA_SITE_KEY, process.env.RECAPTCHA_SECRET_KEY);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'))
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(compression());
app.use(flash());
app.use(session({ 
	resave: true,
  	saveUninitialized: true,
  	secret: process.env.SESSION_SECRET,
	cookie: { maxAge: 60000 }
}));

/**
 * Controllers (route handlers).
 */
const faucetController = require('./controllers/faucet');

/**
 * Connect to MongoDB.
 */
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('error', (err) => {
  console.error(err);
  console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
  process.exit();
});

app.get('/', recaptcha.middleware.render, faucetController.index);
app.post('/', 
	recaptcha.middleware.verify,
	faucetController.captchaCheck,
	faucetController.validateAdress,
	faucetController.proxyFilter, 
	faucetController.checkClaimed, 
	faucetController.post);



app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
});

module.exports = app;