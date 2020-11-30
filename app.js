//jshint esversion:6
require("dotenv").config();
const EXPRESS = require("express");
const BODYPARSER = require("body-parser");
const EJS = require("ejs");
const MONGOOSE = require("mongoose");
const ENCRYPT = require("mongoose-encryption");
const MD5 = require("md5");

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

userSchema.plugin(ENCRYPT, {
  secret: process.env.SECRET,
  encryptedFields: ["password"]
});

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
  const password = MD5(req.body.password);

  USER.findOne({
    email: username
  }, (err, foundUser) => {
    if (!err && foundUser && foundUser.password === password) {
      res.render("secrets");
    } else {
      res.send(err);
    }
  });
});

APP.post("/register", (req, res) => {
  const newUser = new USER({
    email: req.body.username,
    password: MD5(req.body.password)
  });
  newUser.save((err) => {
    err ? res.send(err) : res.render("secrets");
  });
});

APP.listen(3000, () => {
  console.log("Server running on port 3000");
});
