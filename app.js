
require('dotenv').config();// (environment varibale)this needs to be on the top
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");// juumbling the user sensitve data like passwords


const app = express();

// console.log(process.env.SECRET);//this how we access the env(environment) variable process.env.variable_name



app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB");

// basic mongoose schema just like JS object
// const userSchema = {
//   email: String,
//   password: String
// };

// this schema is made from mongoose schema class
const userSchema = new mongoose.Schema({
  email: String,
password: String
});



// const secret="This our little secrets";//this s the key which we used to encrupt our DB
// userSchema.plugin(encrypt,{secret:secret});//this will encrypt everything in the User model
// userSchema.plugin(encrypt,{secret:secret, encryptedFields:["password"]});//this will just encrypt the encryptedFields//to add multiple fields just add , and write the it down after the first field(without environment varibale)




userSchema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields:["password"]});

const User = new mongoose.model("User", userSchema);




app.get("/", function(req, res) {

  res.render("home");
})

app.get("/login", function(req, res) {

  res.render("login");
})

app.get("/register", function(req, res) {

  res.render("register");
})

app.post("/register", function(req, res) {

  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });

  newUser.save(function(err) {/*when we save mongoose will encrypt our field*/
    if (err) {
      console.log(err);
    } else {
      res.render("secrets"); //we are rendering the secrets page only when the uuser has registered
    }

  });

});

app.post("/login", function(req, res) {
  const userName = req.body.username;
  const password = req.body.password;
  User.findOne({/*when we find we decrypt the field just to check the credentials*/
    email: userName
  }, function(err, foundUser) {

    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        if (foundUser.password === password) {
          res.render("secrets");
        }
      }
    }

  })

})

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
