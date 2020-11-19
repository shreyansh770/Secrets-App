 require('dotenv').config(); // (environment varibale)this needs to be on the top
const PORT = process.env.PORT||3000
 const express = require("express");
 const bodyParser = require("body-parser");
 const ejs = require("ejs");
 const mongoose = require("mongoose");
 // const bcrypt = require("bcrypt");
 // const saltRounds = 10; //no of salting rounds
 // const encrypt = require("mongoose-encryption");// juumbling the user sensitve data like passwords
 // const md5= require("md5");

 const session = require('express-session');
 const passport = require('passport');
 const passportLocalMongoose = require('passport-local-mongoose');
 var GoogleStrategy = require("passport-google-oauth20").Strategy;
 var findOrCreate = require("mongoose-findorcreate"); ///*we have to install findOrCreate using hyper as it is a pseduo package*/
 const app = express();

 // console.log(process.env.SECRET);//this how we access the env(environment) variable process.env.variable_name

 app.set('view engine', 'ejs');
 app.use(bodyParser.urlencoded({
   extended: true
 }));
 app.use(express.static("public"));
 //THIS HOW WE SETUP PASSPORT
 //ask the app to use express-session
 app.use(session({
   secret: 'Any litttle secret',
   resave: false,
   saveUninitialized: true,
   cookie: {}
 }));

 //to use and initialize passport
 app.use(passport.initialize()); //it a library that comes with passport

 app.use(passport.session()); //use passport to dea with the session:(a method in passport library)

 //////////////////////////
 mongoose.connect("mongodb://localhost:27017/userDB");
 mongoose.set("useCreateIndex", true); //to get rid of decpritiation warning

 // basic mongoose schema just like JS object
 // const userSchema = {
 //   email: String,
 //   password: String
 // };

 // this schema is made from mongoose schema class
 const userSchema = new mongoose.Schema({
   email: String,
   password: String,
   googleId: String,
   secret: String //user will store the secret
 });

 userSchema.plugin(passportLocalMongoose);
 userSchema.plugin(findOrCreate);

 // const secret="This our little secrets";//this s the key which we used to encrupt our DB
 // userSchema.plugin(encrypt,{secret:secret});//this will encrypt everything in the User model
 // userSchema.plugin(encrypt,{secret:secret, encryptedFields:["password"]});//this will just encrypt the encryptedFields//to add multiple fields just add , and write the it down after the first field(without environment varibale)
 // userSchema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields:["password"]});

 const User = new mongoose.model("User", userSchema);

 passport.use(User.createStrategy()); //to staterzie passport

 //this serialize and deserialize is applicable only on local routes
 // passport.serializeUser(User.serializeUser());//Creates the cokkie
 // passport.deserializeUser(User.deserializeUser());//destroy the cookie

 //this serialize and deserialize is applicable everywhere
 passport.serializeUser(function(user, done) {
   done(null, user.id);
 });

 passport.deserializeUser(function(id, done) {
   User.findById(id, function(err, user) {
     done(err, user);
   });
 });

 passport.use(new GoogleStrategy({
     clientID: process.env.CLIENT_ID,
     clientSecret: process.env.CLIENT_SECRET,
     callbackURL: "https://localhost:3000/auth/google/secrets",
     userProfileURL: "https://www/googleapis.com/oauth2/v3/userinfo"
   },
   function(accessToken, refreshToken, profile, cb) {
     User.findOrCreate /*first we find the googleId if not we create one*/({
       googleId: profile.id
     }, function(err, user) {
       return cb(err, user);
     });
   }
 ));

 app.get("/", function(req, res) {

   res.render("home");
 });



 app.get("/auth/google", /*the button on login and register page will route here*/

   passport.authenticate("google" /*where to authenticate*/ , {
     scope: ["profile"]
   }) /*what we want after hitting google is user profile(email,username at google)*/ )

 app.get('/auth/google/secrets',
   passport.authenticate('google', {
     failureRedirect: '/login'
   }),
   function(req, res) {
     // Successful authentication, redirect home.
     res.redirect('/');
   }); //this is used to redirect back to our website from google


 app.get("/login", function(req, res) {

   res.render("login");
 });

 app.get("/register", function(req, res) {

   res.render("register");
 });
 // we are using secrets route when are using cookie authetication(level5)
 app.get("/secrets", function(req, res){
   User.find({"secret": {$ne: null}}, function(err, foundUsers){
     if (err){
       console.log(err);
     } else {
       if (foundUsers) {
         res.render("secrets", {usersWithSecrets: foundUsers});
       }
     }
   });


   // if (req.isAuthenticated()) {
   //   res.render("secrets");
   // } else {
   //   res.redirect("/login");
   // }
 });

 app.get("/submit", function(req, res) {

   if (req.isAuthenticated()) {
     res.render("submit");
   } else {
     res.redirect("/login");
   }
 });

 app.post("/submit", function(req, res){
   const submittedSecret = req.body.secret;

 //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
   // console.log(req.user.id);

   User.findById(req.user.id, function(err, foundUser){
     if (err) {
       console.log(err);
     } else {
       if (foundUser) {
         foundUser.secret = submittedSecret;
         foundUser.save(function(){
           res.redirect("/secrets");
         });
       }
     }
   });
 });


 app.get("/logout", function(req, res) {
   req.logout();
   res.redirect("/");
 })




 app.post("/register", function(req, res) {

   User.register({
     username: req.body.username
   }, req.body.password /*passoword*/ , function(err, user) {
     if (err) {
       console.log(err);
       res.redirect("/register"); //if error we will redirect them to the register page
     } else {
       passport.authenticate("local" /*type of aunthetication*/ )(req, res, function() {
         res.redirect("/secrets");
       });
     }

   }); /*register() is a package inside passport*/

 });


 app.post("/login", function(req, res) {

   const user = new User({

     username: req.body.username,
     password: req.body.password

   });

   req.login(user, function(err) {

     if (err) {
       console.log(err);

     } else {
       passport.authenticate("local") /*where to authenticate*/ (req, res, function() {
         res.redirect("/secrets");
       });

     }

   });

 });



 app.listen(3000, function() {
   console.log("Server started on port 3000");
 });


 //REGISTER TILL LEVEl 4

 // // bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash){}//saltrounds hashing using bycrypt
 //
 // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
 //   const newUser = new User({
 //     email: req.body.username,
 //     // password: md5(req.body.password)//converting the input password into hash function while using md5
 //     passoword: hash
 //   });
 //
 //   newUser.save(function(err) {
 //     /*when we save mongoose will encrypt our field*/
 //     if (err) {
 //       console.log(err);
 //     } else {
 //       res.render("secrets"); //we are rendering the secrets page only when the uuser has registered
 //     }
 //
 //   });
 // });


 //LOGIN TILL LEVEL 4

 // const userName = req.body.username;
 // // const password = md5(req.body.password);//this will compare the password with the credentials in the hash format only
 // const password = req.body.password;
 //
 //
 // User.findOne({
 //   /*when we find we decrypt the field just to check the credentials*/
 //   email: userName
 // }, function(err, foundUser) {
 //
 //   if (err) {
 //     console.log(err);
 //   } else {
 //     if (foundUser) {
 //       bcrypt.compare(password, foundUser.passoword, function(err, result) {
 //
 //         if (result === true) {
 //
 //           res.render("secrets");
 //         }
 //       });
 //     }
 //   }
 // });
