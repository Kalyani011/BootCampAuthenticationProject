//jshint esversion:6
require("dotenv").config();
const EXPRESS = require("express");
const BODYPARSER = require("body-parser");
const EJS = require("ejs");
const MONGOOSE = require("mongoose");
const SESSION = require("express-session");
const PASSPORT = require("passport");
const PASSPORT_LOCAL_MONGOOSE = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");
const FacebookStrategy = require("passport-facebook");

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
  password: String,
  googleId: String,
  facebookId: String,
  secret: String
});

// userSchema.plugin(ENCRYPT, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"]
// });
userSchema.plugin(PASSPORT_LOCAL_MONGOOSE);
userSchema.plugin(findOrCreate);

const USER = MONGOOSE.model("User", userSchema);

PASSPORT.use(USER.createStrategy());

PASSPORT.serializeUser(function(user, done) {
  done(null, user.id);
});

PASSPORT.deserializeUser(function(id, done) {
  USER.findById(id, function(err, user) {
    done(err, user);
  });
});

PASSPORT.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileUrl: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    USER.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

PASSPORT.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    USER.findOrCreate({
      facebookId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

APP.get("/", (req, res) => {
  res.render("home");
});

APP.get("/auth/google", PASSPORT.authenticate('google', {
  scope: ["profile"]
}));

APP.get('/auth/google/secrets',
  PASSPORT.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });

APP.get('/auth/facebook',
  PASSPORT.authenticate('facebook'));

APP.get('/auth/facebook/secrets',
  PASSPORT.authenticate('facebook', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

APP.get("/login", (req, res) => {
  res.render("login");
});

APP.get("/register", (req, res) => {
  res.render("register");
});

APP.get("/secrets", (req, res) => {
  USER.find({
    "secret": {
      $ne: null
    }
  }, (err, foundUsers) => {
    if (!err && foundUsers) {
      res.render("secrets", {
        usersWithSecrets: foundUsers
      });
    } else {
      console.log(err);
    }
  })
});

APP.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

APP.get("/submit", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

APP.post("/submit", (req, res) => {
  USER.findById(req.user.id, (err, foundUser) => {
    if (err) {
      console.log(err);
      res.redirect("/secrets");
    } else {
      if (foundUser) {
        foundUser.secret = req.body.secret;
        foundUser.save((err) => {
          err ? console.log(err) : res.redirect("/secrets");
        });
      }
    }
  });
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

let port = process.env.PORT;
if (port === "" || port === null) {
  port = 3000;
}

APP.listen(port || 3000, () => {
  console.log("Server running on port 3000");
});
