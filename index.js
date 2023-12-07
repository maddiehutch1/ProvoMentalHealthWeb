const express = require('express');

// if we need to comment this out
const bodyparser = require('body-parser');
const { v4:uuidv4 } = require('uuid');
const session = require('express-session');

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

app.get("/createlogin", (req, res) => {
    res.render("createlogin");
});

app.post("/login", async (req, res)=> {
    const user_username = req.body.username;
    const user_password = req.body.password;

      // Perform a SELECT query to check if the entered credentials are valid
    try {
      const result = await knex
        .select('Username', 'Password')
        .from('Login')
        .where({ Username: user_username, Password: user_password })
        if (result.length > 0) {
            // Valid login credentials, set session variables and redirect
            req.session.loggedIn = true;
            req.session.user = result[0]; 
            res.redirect("/adminlanding");
        } else {
            // Invalid login credentials, display an error message
            res.render("login", { errorMessage: "Invalid username or password" });
        }
    } catch (error) {
        // Handle database query errors
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
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

app.post("/editemployee", (req, res)=> {
    knex("Login").where("LoginID", parseInt(req.body.LoginID)).update({
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

app.get("/surveydata", (req, res) => {
    knex.select().from("SurveyResponse").then(SurveyResponse => {
        res.render("surveydata", {mySurvey: SurveyResponse});
    });
});

app.get("/editresponse/:id", (req, res)=> {
    knex.select("SurveyID",
          "Timestamp",
          "Age",
          "Gender",
          "OccupationStatus",
          "RelationshipStatus",
          "UseSocialMedia",
          "AverageTime",
          "DoomscrollingScale",
          "PhoneDistractsYouScale",
          "RestlessnessScale",
          "HowEasilyDistractedScale",
          "BotherByWorriesScale",
          "DifficultyConcentratingScale",
          "SocialMediaComparisonScale",
          "PreviousQuestionFeelAboutComparison",
          "SocialMediaValidationScale",
          "DepressionOrDownScale",
          "DailyActivityInterestScale",
          "SleepIssueScale").from("SurveyResponse").where("SurveyID", req.params.id).then(SurveyResponse => {
    res.render("editresponse", {mySurvey: SurveyResponse});
   }).catch( err => {
      console.log(err);
      res.status(500).json({err});
   });
});

app.post("/editresponse", (req, res)=> {
    knex("SurveyResponse").where("SurveyID", parseInt(req.body.SurveyID)).update({
        Age: req.body.Age,
        Gender: req.body.Gender,
        OccupationStatus: req.body.OccupationStatus,
        RelationshipStatus: req.body.RelationshipStatus,
        UseSocialMedia: req.body.UseSocialMedia,
        AverageTime: req.body.AverageTime,
        DoomscrollingScale: req.body.DoomscroolingScale,
        PhoneDistractsYouScale: req.body.PhoneDistractsYouScale,
        RestlessnessScale: req.body.RestlessnessScale,
        HowEasilyDistractedScale: req.body.HowEasilyDistractedScale,
        BotherByWorriesScale: req.body.BotherByWorriesScale,
        DifficultyConcentratingScale: req.body.DifficultyConcentratingScale,
        SocialMediaComparisonScale: req.body.SocialMediaComparisonScale,
        PreviousQuestionFeelAboutComparison: req.body.PreviousQuestionFeelAboutComparison,
        DepressionOrDownScale: req.body.DepressionOrDownScale,
        DailyActivityInterestScale: req.body.DailyActivityInterestScale,
        SleepIssueScale: req.body.SleepIssueScale,
        SocialMediaValidationScale: req.body.SocialMediaValidationScale
   }).then(mylogin => {
      res.redirect("/surveydata");
   })
});

app.post("/deleteresponse/:id", (req, res) => {
    knex("SurveyResponse").where("SurveyID",req.params.id).del().then( mySurvey => {
      res.redirect("/surveydata");
   }).catch( err => {
      console.log(err);
      res.status(500).json({err});
   });
});

app.get('/logout', (req, res) => {
    req.session.destroy(function(err){
        if(err){
            console.log(err);
            res.send("Error");
        }
        else{
            res.render('login', { logout: true, logoutMessage: "Logout Successful" });
        }
    })
});

app.post("/createResponse", (req, res)=> {
    knex("SurveyResponse").insert({
      Age: req.body.Age,
      Gender: req.body.Gender,
      RelationshipStatus: req.body.RelationshipStatus,
      OccupationStatus: req.body.OccupationStatus,
      UseSocialMedia: req.body.UseSocialMedia,
      AverageTime: req.body.AverageTime,
      DoomscrollingScale: req.body.DoomscrollingScale,
      PhoneDistractsYouScale: req.body.PhoneDistractsYouScale,
      RestlessnessScale: req.body.RestlessnessScale,
      HowEasilyDistractedScale: req.body.HowEasilyDistractedScale,
      BotherByWorriesScale: req.body.BotherByWorriesScale,
      DifficultyConcentratingScale: req.body.DifficultyConcentratingScale,
      SocialMediaComparisonScale: req.body.SocialMediaComparisonScale,
      PreviousQuestionFeelAboutComparison: req.body.PreviousQuestionFeelAboutComparison,
      SocialMediaValidationScale: req.body.SocialMediaValidationScale,
      DepressionOrDownScale: req.body.DepressionOrDownScale,
      DailyActivityInterestScale: req.body.DailyActivityInterestScale,
      SleepIssueScale: req.body.SleepIssueScale
   }).then(mylogin => {
      res.redirect("/databaseadmin");
   })
});

app.listen(port, () => console.log("Server is listening."));
