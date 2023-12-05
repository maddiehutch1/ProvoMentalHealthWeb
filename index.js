const express = require('express');

// if we need to comment this out
const bodyparser = require('body-parser');
const { v4:uuidv4 } = require('uuid');
const session = require('express-session');
const router = require('./router');

let app = express();

let path = require('path');

const port = process.env.PORT || 3000;

// comment this code out if necessary
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended:true}));

app.use('/public', express.static('public'));
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: true
}));

app.use('/route', router);

const knex = require('knex') ({
    client: 'pg',
    connection: {
        host: process.env.RDS_HOSTNAME || 'localhost',
        user: process.env.RDS_USERNAME || 'postgres',
        password: process.env.RDS_PASSWORD || 'admin',
        database: process.env.RDS_DB_NAME || 'bucket_list', 
        port: process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false
    }
});

app.get("/", (req, res)=> {
    res.render('landing');
});

// app.get("/login", (req, res) => {
//     res.sendFile(path.join(__dirname + 'login.ejs'));
// });

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/survey", (req, res) => {
    res.render("survey");
});

app.get("/tableau", (req, res) => {
    res.render("tableau");
});

app.get("/modify", (req, res) => {
    res.render("modify");
});

app.get("/adminlanding", (req, res) => {
    res.render("adminlanding");
});

app.listen(port, () => console.log("Server is listening."));
