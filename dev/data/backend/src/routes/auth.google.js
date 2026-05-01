const router = require('express').Router();
const passport = require("passport");

// redirect user to google login
// get user profile and email from google
router.get("/google",
	passport.authenticate("google", {scope: ["profile", "email"]})
);

// callback route for google to redirect to after login
// redirect to dashboard or admin page based on user role
router.get("/google/callback",
	passport.authenticate("google",
		{
			failureRedirect:"auth/google/failure",
			session: true,
		}),
	async (req, res) => 
	{
		const user = req.user;
		req.session.user = user;
		if (user.role == "admin")
		{
			return res.redirect('http://localhost:3000/admin'); // to be changed 
		}
		return res.redirect('http://localhost:3000/dashboard'); // to be changed
	}
);

// check if user is logged in and getting user info
router.get("/me", (req, res) =>
{
	if (!req.session.user)
	{
		return res.status(401).json({message: "Unauthorized"});
	}
	return res.json({user: req.session.user});
});

// logout user and clear session
router.post("/logout", (req, res) =>
{
	req.session.destroy(() =>
	{
		res.clearCookie("connect.sid");
		res.json({message: "Logged out"});
	});
});

