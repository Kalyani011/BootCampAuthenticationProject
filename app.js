//jshint esversion:6
require("dotenv").config();
const EXPRESS = require("express");
const BODYPARSER = require("body-parser");
const EJS = require("ejs");
const MONGOOSE = require("mongoose");
const SESSION = require("express-session");
const PASSPORT = require("passport");
const PASSPORT_LOCAL_MONGOOSE = require("passport-local-mongoose");


const APP = EXPRESS();
APP.use(EXPRESS.static("public"));
APP.set("view engine", "ejs");
APP.use(BODYPARSER.urlencoded({
  extended: true
}));
APP.use(SESSION({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
APP.use(PASSPORT.initialize());
APP.use(PASSPORT.session());

MONGOOSE.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
MONGOOSE.set("useCreateIndex", true);

const userSchema = new MONGOOSE.Schema({
  email: String,
  password: String
});

// userSchema.plugin(ENCRYPT, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"]
// });
userSchema.plugin(PASSPORT_LOCAL_MONGOOSE);

const USER = MONGOOSE.model("User", userSchema);

PASSPORT.use(USER.createStrategy());
PASSPORT.serializeUser(USER.serializeUser());
PASSPORT.deserializeUser(USER.deserializeUser());

APP.get("/", (req, res) => {
  res.render("home");
});

APP.get("/login", (req, res) => {
  res.render("login");
});

APP.get("/register", (req, res) => {
  res.render("register");
});

APP.get("/secrets", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

APP.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

APP.post("/register", (req, res) => {
  USER.register({
    username: req.body.username
  }, req.body.password, (err, user) => {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      PASSPORT.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  });
});

APP.post("/login", (req, res) => {
  const user = new USER({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, (err) => {
    if (err) {
      console.log(err);
    } else {
      PASSPORT.authenticate("local")(req, res, () => {
        res.redirect("/secrets");
      });
    }
  });
});

APP.listen(3000, () => {
  console.log("Server running on port 3000");
});
