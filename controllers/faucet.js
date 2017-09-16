const altcoin = require('node-altcoin')()

altcoin.auth(process.env.rpcuser, process.env.rpcpassword)
altcoin.set('host', process.env.rpchost)
altcoin.set({port:process.env.rpcport})
/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
    /*this.getAssociationsCities(req, res, (err, cities) => {
        if(err) { return next(err)}*/
    //req.session.returnTo = req.path
    altcoin.getBalance(function(balance) {
        res.render('home', {
            title: 'Pradinis',
            captcha: req.recaptcha,
            balance: balance 
        })
    })
};
exports.post = (req, res) => {
    if (!req.recaptcha.error) {
        res.render('home', {
            title: 'Home',
            message: 'Success' 
        })      
    } else {
        res.render('home', {
            title: 'home',
            error: 'Invalid reCaptcha'
        })
    }
}