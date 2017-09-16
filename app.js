
require('dotenv').config()
const express = require('express');
const session = require('express-session');
const recaptcha = require('express-recaptcha');
const compression = require('compression');

const bodyParser = require('body-parser');

const mongoose = require('mongoose');
const altcoin = require('node-altcoin')()

const _ = require('underscore');
const path = require('path');
const chalk = require('chalk');

const app = express();

recaptcha.init(process.env.RECAPTCHA_SITE_KEY, process.env.RECAPTCHA_SECRET_KEY);

altcoin.auth(process.env.rpcuser, process.env.rpcpassword)
altcoin.set('host', process.env.rpchost)
altcoin.set({port:process.env.rpcport})


app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(compression());
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
app.post('/', recaptcha.middleware.verify, faucetController.post);



app.listen(app.get('port'), () => {
  console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
});

module.exports = app;