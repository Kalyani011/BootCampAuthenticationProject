//jshint esversion:6
require("dotenv").config();
const EXPRESS = require("express");
const BODYPARSER = require("body-parser");
const EJS = require("ejs");
const MONGOOSE = require("mongoose");
const ENCRYPT = require("mongoose-encryption");
const BCRYPT = require("bcrypt");
const SALTROUNDS = 10;

const APP = EXPRESS();
APP.use(EXPRESS.static("public"));
APP.set("view engine", "ejs");
APP.use(BODYPARSER.urlencoded({
  extended: true
}));

MONGOOSE.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userSchema = new MONGOOSE.Schema({
  email: String,
  password: String
});

// userSchema.plugin(ENCRYPT, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"]
// });

const USER = MONGOOSE.model("User", userSchema);

APP.get("/", (req, res) => {
  res.render("home");
});

APP.get("/login", (req, res) => {
  res.render("login");
});

APP.get("/register", (req, res) => {
  res.render("register");
});

APP.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  USER.findOne({
    email: username
  }, (err, foundUser) => {
    if (!err && foundUser) {
      BCRYPT.compare(password, foundUser.password, (err, result) => {
        if(result === true){
          res.render("secrets");
        }
      });
    } else {
      res.send(err);
    }
  });
});

APP.post("/register", (req, res) => {

  BCRYPT.hash(req.body.password, SALTROUNDS, (err, hash) => {
    const newUser = new USER({
      email: req.body.username,
      password: hash
    });
    newUser.save((err) => {
      err ? res.send(err) : res.render("secrets");
    });
  });

});

APP.listen(3000, () => {
  console.log("Server running on port 3000");
});
