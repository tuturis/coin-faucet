require('dotenv').config()
const express = require('express');
const session = require('express-session');
const captcha = require('./express-coinhive-captcha')
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const compression = require('compression');
const lusca = require('lusca');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const mongoose = require('mongoose');
const altcoin = require('node-altcoin')()
const _ = require('underscore');
const path = require('path');
const chalk = require('chalk');

const app = express();

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

app.use(helmet())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'))
app.enable('trust proxy', 1)
app.set('trust proxy', 'loopback, linklocal, uniquelocal')
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(compression());
app.use(flash());
app.use(session({
	resave: true,
	saveUninitialized: true,
	secret: process.env.SESSION_SECRET,
	cookie: { maxAge: 60000 },
	/*	  store: new MongoStore({
			url: process.env.MONGODB_URI || process.env.MONGOLAB_URI,
			autoReconnect: true,
			clear_interval: 3600
			})	*/
}));

/**
 * Controllers (route handlers).
 */
const faucetController = require('./controllers/faucet');
const siteController = require('./controllers/site');
siteController.init((err, data) => { console.log(`err ${err}, data - ${data}`) });

app.use((req, res, next) => {
	if (req.query.ref) {
		req.session.referredBy = req.query.ref
		res.redirect('/')
		console.log(`req.session.referredBy ${req.session.referredBy}`)
	}
	siteController.getConfig((err, config) => {
		if (err) {
			console.error(`site.getConfig ${err}`)
		}
		req.config = config
	})
	req.addressStats = {}
	next();
});
captcha.init(process.env.COINHIVE_SITE_KEY, process.env.COINHIVE_SECRET_KEY,
	{
		whitelabel: false,
		hashes: 5120,
		shortenHashes: 256,
		disableElements: 'button[type=submit]',
		callback: 'CaptchaCallback'
	}
);
app.get('/', captcha.middleware.render, faucetController.getTxLogs, faucetController.getFaucetBalance, faucetController.index);
app.post('/',
	captcha.middleware.verify,
	faucetController.captchaCheck,
	faucetController.validateAdress,
	faucetController.claim,
	faucetController.addressBalance,
	faucetController.unpaidBalance,
	faucetController.checkReferrals,
	faucetController.refCount,
	faucetController.refCommision,
	faucetController.getTxLogs,
	faucetController.post);

/*Error handling*/
app.use((err, req, res, next) => {
	if (err.message === 'CSRF token mismatch' || err.message === 'CSRF token missing') {
		let ip = req.headers['x-real-ip'];
		console.error(err.message);
		console.error(`mismatch from ip ${ip}`)
		// you could res.render here if you want a custom template but I'll just `send`:
		req.flash('error', "Try again, after refreshing the page")
		res.redirect('/')
	} else {
		console.error(err)
		next(err);
	}
})

app.listen(app.get('port'), () => {
	console.log('%s App is running at http://localhost:%d in %s mode', chalk.green('✓'), app.get('port'), app.get('env'));
});

module.exports = app;