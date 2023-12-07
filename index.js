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
        host: process.env.RDS_HOSTNAME || 'awseb-e-53wyk8kamn-stack-awsebrdsdatabase-kcxprbtmnmgb.cibesl0vtc3a.us-east-1.rds.amazonaws.com',
        user: process.env.RDS_USERNAME || 'ebroot',
        password: process.env.RDS_PASSWORD || 'SuperSecretPassword275',
        database: process.env.RDS_DB_NAME || 'ebdb', 
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

app.get("/databaseadmin", (req, res) => {
    knex.select().from("Login").then(Login => {
        res.render("databaseadmin", {mylogin: Login});
    });
});

app.get("/editlogin", (req, res) => {
    res.render("editlogin");
});

app.get("/createlogin", (req, res) => {
    res.render("createlogin");
});

app.post("/createlogin", (req, res)=> {
    knex("Login").insert({
      Username: req.body.Username,
      Password: req.body.Password,
      FirstName: req.body.FirstName.toUpperCase(),
      LastName: req.body.LastName.toUpperCase(),
      Email: req.body.Email,
      UserRole: req.body.UserRole
   }).then(mylogin => {
      res.redirect("/databaseadmin");
   })
});

app.post("/deleteUser/:id", (req, res) => {
    knex("Login").where("LoginID",req.params.id).del().then( mylogin => {
      res.redirect("/databaseadmin");
   }).catch( err => {
      console.log(err);
      res.status(500).json({err});
   });
});

app.get("/editemployee/:id", (req, res)=> {
    knex.select("LoginID",
          "Username",
          "Password",
          "FirstName",
          "LastName",
          "Email",
          "UserRole").from("Login").where("LoginID", req.params.id).then(Login => {
    res.render("editemployee", {mylogin: Login});
   }).catch( err => {
      console.log(err);
      res.status(500).json({err});
   });
});

app.post("editemployee", (req, res)=> {
    knex("Login").where("LoginID", parseInt(req.body.LoginID)).update({
      LoginID: req.body.LoginID,
      Username: req.body.Username,
      Password: req.body.Password,
      FirstName: req.body.FirstName.toUpperCase(),
      LastName: req.body.LastName.toUpperCase(),
      Email: req.body.Email,
      UserRole: req.body.UserRole
   }).then(mylogin => {
      res.redirect("/adminlanding");
   })
});

app.get("/surveydata", (req, res) => {
    res.render("surveydata");
});

app.listen(port, () => console.log("Server is listening."));
