module.exports = {
    ensureAuthenticated: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        req.flash('error_msg', 'Пожалуйста, войдите для доступа к ресурсу');
        res.redirect('/users/login');
    }
}