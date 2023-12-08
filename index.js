// Import the Express framework
const express = require('express');

// Import the body-parser middleware for handling request data
// Import the uuid library for generating unique identifiers
// Import the express-session middleware for managing user sessions
const bodyparser = require('body-parser');
const { v4:uuidv4 } = require('uuid');
const session = require('express-session');

let app = express();

let path = require('path');

const port = process.env.PORT || 3000;

// Parse incoming JSON data
app.use(bodyparser.json());

// Parse incoming URL-encoded form data with extended options
app.use(bodyparser.urlencoded({extended: true}));

// Set the view engine for rendering HTML using EJS templates
app.set('view engine', 'ejs');

// Parse incoming URL-encoded form data with extended options using Express
app.use(express.urlencoded({extended:true}));

// connect to public folder with all the files and images, as well as views
app.use('/public', express.static('public'));
app.set('views', path.join(__dirname, 'views'));

// here is the code to initiate when a session starts (after someone logs in)
app.use(session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: true
}));

// imports the pg admin database
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

// connect to landing page
app.get("/", (req, res)=> {
    res.render('landing', { session:req.session });
});

// connect to the login page
app.get("/login", (req, res) => {
    res.render("login");
});

// connect to the survey page
app.get("/survey", (req, res) => {
    res.render("survey", { session:req.session });
});

// connect to the tableau page with the active tableau running, showing that one is logged in or not
app.get("/tableau", (req, res) => {
    res.render("tableau", { session:req.session });
});

// connect to modify page
app.get("/modify", (req, res) => {
    res.render("modify");
});

// connect to adminlanding page that shows if you are logged in or not 
app.get("/adminlanding", (req, res) => {
    const role = req.session.role;
    const user = req.session.user;
    res.render("adminlanding", { session:req.session, role, user});
});

// gets access to the ourmission page
app.get("/ourmission", (req, res) => {
    const role = req.session.role;
    res.render("ourmission", { session:req.session, role });
});

// accesses the databaseadmin page, displaying the knex database info
app.get("/databaseadmin", (req, res) => {
    knex.select().from("Login").then(Login => {
        res.render("databaseadmin", {mylogin: Login, session:req.session });
    });
});

// opens to the createlogin page
app.get("/createlogin", (req, res) => {
    res.render("createlogin");
});

// this is when the login page is submitted
app.post("/login", async (req, res)=> {
    const user_username = req.body.username;
    const user_password = req.body.password;

      // Perform a SELECT query to check if the entered credentials are valid
    try {
        const result = await knex
        .select('Username', 'Password', 'UserRole')
        .from('Login')
        .where({ Username: user_username, Password: user_password });

        if (result.length > 0) {
            // Valid login credentials, set session variables and redirect
            req.session.loggedIn = true;
            req.session.user = result[0];

            const user_role = result[0].UserRole;

            req.session.role = user_role;

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

// this is the create login page to add in another page
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

// this is what deletes the user info
app.post("/deleteUser/:id", (req, res) => {
    knex("Login").where("LoginID",req.params.id).del().then( mylogin => {
      res.redirect("/databaseadmin");
   }).catch( err => {
      console.log(err);
      res.status(500).json({err});
   });
});

// edit employee tab that shows the form and retrieves the current data
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

// when submitting the edit employee form, it runs through this code
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

// gets view of editindividual
app.get("/editindividual", (req, res) => {
    const user = req.session.user;
    res.render("editindividual", { user });
});

// when submitting the edit form for the individual account, it runs this POST code
app.post("/editindividual", async (req, res) => {
    const { LoginID, Username, Password, FirstName, LastName, Email } = req.body;

    try {
        // Update the fields excluding LoginID
        const result = await knex("Login")
            .where("LoginID", parseInt(req.body.LoginID))
            .update({
                Username,
                Password,
                FirstName,
                LastName,
                Email
            });

        res.redirect("/adminlanding");
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});


app.get("/surveydata", (req, res) => {
    knex.select().from("SurveyResponse").then(SurveyResponse => {
        res.render("surveydata", {mySurvey: SurveyResponse, session:req.session });
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

const { format } = require('date-fns');

app.post("/createResponse", async (req, res)=> {
    console.log(req.body);

    try {
        const submittedTimestamp = req.body.Timestamp;
        const formattedTimestamp = submittedTimestamp ? format(new Date(submittedTimestamp), 'yyyy-MM-dd HH:mm:ss') : null;
        // Insert data into the SurveyResponse table
        const[insertedSurvey] = await knex("SurveyResponse").insert({
            Timestamp: formattedTimestamp,
            Age: req.body.Age,
            Gender: req.body.Gender,
            Origin: "Provo",
            OccupationStatus: req.body.OccupationStatus,
            RelationshipStatus: req.body.RelationshipStatus,
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
            DepressionOrDownScale: req.body.DepressionOrDownScale,
            DailyActivityInterestScale: req.body.DailyActivityInterestScale,
            SleepIssueScale: req.body.SleepIssueScale,
            SocialMediaValidationScale: req.body.SocialMediaValidationScale // Other columns...
        }).returning("SurveyID");

        const SurveyID = insertedSurvey.SurveyID;

        const checkboxAffiliations = [];

        for (let iCount = 1; iCount <= 6; iCount++)
        {
          const name = `affiliation${iCount}`;
          if (req.body[name])
          {
            checkboxAffiliations.push(req.body[name]);
          };
        };
        await Promise.all(checkboxAffiliations.map(async (affiliation_id) => {
          await knex("Affiliations").insert({
            SurveyID: SurveyID,
            AffiliationID: affiliation_id
          });
        }));
        //gather social media types in an array
        const checkboxPlatforms = [];
        //loop through options on array values
        for (let iCount = 1; iCount <= 9; iCount++)
        {
          const name = `platform${iCount}`;
          if (req.body[name])
          {
            checkboxPlatforms.push(req.body[name]);
          };
        };
        await Promise.all(checkboxPlatforms.map(async (platform_id) => {
          await knex("Platforms").insert({
            SurveyID: SurveyID,
            PlatformID: platform_id
          });
        }));


            res.render('survey', { session:req.session , submitSuccessMessage: "Submission Successful" });
    } catch (error) {
        console.error('Error creating survey response:', error);
        res.status(500).send('Internal Server Error');
    }

});

app.post("/search", (req, res) => {
    const surveyID = req.body.surveyID;

    knex("SurveyResponse")
        .where("SurveyID", surveyID)
        .then((surveyResponses) => {
            // Handle the found surveyResponses
            res.render("searchResults", { mySurvey: SurveyResponse, session:req.session });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ err });
        });
});

app.listen(port, () => console.log("Server is listening."));
