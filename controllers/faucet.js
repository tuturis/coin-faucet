/**
 * GET /
 * Home page.
 */
exports.index = (req, res) => {
    /*this.getAssociationsCities(req, res, (err, cities) => {
        if(err) { return next(err)}*/
    req.session.returnTo = req.path
    res.render('home', {
        title: 'Pradinis'
    })
};
