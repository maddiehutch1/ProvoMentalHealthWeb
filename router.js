var express = require('express');
var router = express.Router();

const credential = {
    username: 'admin',
    password: 'admin123'
};

// login user
router.post('/login', (req, res) => {
    if (req.body.username == credential.username && req.body.password == credential.password) {
        req.session.user = req.body.username;
        res.redirect('/adminlanding');
        // res.end('Login Successful');
    }else {
        res.end('Invalid username or password');
    }
});

module.exports = router;