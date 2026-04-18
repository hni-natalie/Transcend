/* 
 * Configure Passport.js to use the Google OAuth 2.0 strategy for authentication. 
*/

const passport = require("passport");
const GooglesStrategy = require("passport-google-oauth20").Strategy;

passport.use(
	// register a new passport strategy
	new GooglesStrategy(
		{
			// tell google our website info and where to redirect after login
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: "/auth/google/callback",
		},
		// this function will be called after google sends back user info
		async (accessToken, refreshToken, profile, done) => {
			try 
			{
				// extract email 
				const email = profile.emails[0].value;
				if (!email)
				{
					return done(new Error("No email found from Google"), null);
				}

				// create user object based on email
				let user;
				if (email === process.env.ADMIN_EMAIL)  // to be defined in .env file
				{
					user = {
						googleId: profile.id,
						name: profile.displayName,
						email: email,
						role : "admin",
					};
				}
				else
				{
					user = {
						googleId: profile.id,
						name: profile.displayName,
						email: email,
						role : "user",
					};
				}
				// user to be saved in db
				return done(null, user);	
			}
			catch (err) {
				return done(err, null);
			}
		}
	)
);

// store user in session
passport.serializeUser((user, done) => {
	done(null, user);
});

// get user info from session
passport.deserializeUser((user, done) => {
	done(null, user);
});
