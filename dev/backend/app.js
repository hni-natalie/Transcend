const express = require("express");
const session = require("express-session");
const passport = require("passport");
const authRoutes = require("./routes/authlogin");

require("./config/passport"); // import passport configuration

const app = express();

// session configuration
// server will create a session for each logged in user and store user info in session
app.use(
	session({
		secret: process.env.SESSION_SECRET || "dev_secret", // to be defined in .env file
		resave: false,
		saveUninitialized: false,
		cookie: {
			httpOnly: true,
			secure: false,
			maxAge: 24 * 60 * 60 * 1000, // time session live
		}
	})
)

// initialize passport and session
app.use(passport.initialize());
app.use(passport.session());

// use auth routes for authentication
app.use("/auth", authRoutes);

module.exports = app;