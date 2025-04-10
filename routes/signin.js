import express from 'express';
import passport from "passport";
import { Strategy } from "passport-local";
import supabase from '../supabaseClient.js';
import bcrypt from "bcrypt";
const router = express.Router();

//Sign-in Route.
router.route("/")
//Sign-in get method
.get((req, res) => {
    res.render("signin.ejs");
})
//Sign-in post request.
.post(passport.authenticate("local", {
    successRedirect: "/homepage",
    failureRedirect: "/signin",
}));

passport.use(new Strategy(async function verify(username, password, cb) {
    try {
        const { data, error } = await supabase
            .from('users')
            .select("username, password")
            .eq('username', username.trim());

        if (error) {
            return cb(error);
        }

        // Check if the user exists in the database
        if (data && data.length > 0) {
            const user = data[0].username; // Access the first element of the array
            const databasePassword = data[0].password; // Access the hashed password

            // Compare the database password with the user's password
            bcrypt.compare(password, databasePassword, (err, result) => {
                if (err) {
                    return cb(err);
                }

                if (result) {
                    return cb(null, user); // Passwords match
                } else {
                    return cb(null, false); // Passwords do not match
                }
            });
        } else {
            return cb(null, false); // User not found
        }
    } catch (err) {
        return cb(err); // Handle unexpected errors
    }
}));


passport.serializeUser((user, cb) => {
    cb(null, user);
});


passport.deserializeUser((user, cb) => {
    cb(null, user);
});


export default router;