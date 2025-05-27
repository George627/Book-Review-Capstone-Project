import express from 'express';
import passport from 'passport';
import GoogleStrategy from 'passport-google-oauth20'; 
import session from 'express-session';
import supabase from '../supabaseClient.js';
import env from "dotenv";

//ENV Config.
env.config();

//Router to communicate with index.js.
var router = express.Router();

//Session.
router.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

//Passport Session.
router.use(passport.initialize());
router.use(passport.session());

//Google Passport Strategy.
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CLIENT_CALLBACK_URL,
},
  async (accessToken, refreshToken, profile, done) => {

    // Check if the user already exists in the database
    const {data, error} = await supabase
        .from('users')
        .select('google_id')
        .eq('google_id', profile.id);

    if (error) {
      return done(error, null);
    }

    //If there are no results, add the user and password to the users database.
    if(data.length === 0){
      
      // Save the user profile to the database or session
      const {data2, err} = await supabase
      .from('users')
      .insert({ google_id: profile.id, username: profile.displayName, email: profile.emails[0].value })
      
      
      if (err) {
        return done(error, null);
      }

      else {
        const user = profile.displayName; // or any other user information you want to store
        return done(null, user);
      }

    } 
    
    else {
      //Grabs the user's name from the profile.
      const user = profile.displayName; 

      //User already exists, proceed with authentication
      return done(null, user); 
    }
      
  }
));

//Complete Serialization of User.
passport.serializeUser((user, done) => {
  done(null, user);
});

//Undo Serialization of User.
passport.deserializeUser((user, done) => { 
  done(null, user);
});

//Render Login path. 
router.get('/login', (req, res) => {
  res.render('login');
});

//Google login with the user's profile and email.
router.get('/login/federated/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

//If the Google login is a success, send them to the main page. Else, send them to the signin page.
router.get('/auth/google/bookreview', passport.authenticate('google', { 
  successRedirect: "/",
  failureRedirect: "/signin" 
}));

//Log the User out.
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

export default router;
