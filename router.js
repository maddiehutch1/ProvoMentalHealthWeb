var express = require('express');
var router = express.Router();

const credential = {
    username: 'admin',
    password: 'admin123'
};


// route for dashboard
router.get('/adminlanding', (req, res) => {
    if (req.session.user) {
        res.render('adminlanding', {user:req.session.user});
    }else {
        res.send('Unauthorize User');
    }
});

// route for logout
router.get('/logout', (req, res) => {
    req.session.destroy(function(err){
        if(err){
            console.log(err);
            res.send("Error");
        }
        else{
            res.render('login', { logout: true });
        }
    })
});

module.exports = router;