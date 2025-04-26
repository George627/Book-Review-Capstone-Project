//Import Statements.
import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import passport from "passport";
import env from "dotenv";
import signinRoute from "./routes/signin.js";
import createRoute from "./routes/create.js";
import homepageRoute from "./routes/homepage.js";
import reviewsRoute from "./routes/reviews.js";
import addRoute from "./routes/add.js";
import loginRoute from "./routes/login.js";
import sortRoute from "./routes/sort.js";
import editRoute from "./routes/edit.js";
import deleteRoute from "./routes/delete.js";
import authRoute from "./routes/auth.js";
import publicRoute from "./routes/public.js";
import publicReviewsRoute from "./routes/publicReviews.js";


//Setting up the app and the port number.
const app = express();
const port = 3000;


//ENV Configuration.
env.config();

//Body-Parser as well as setting up the static route to public.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Ensure SESSION_SECRET is defined.
if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is not defined in the environment variables.");
}

//Session.
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie:{
        maxAge: 1000 * 60 * 60 * 2,
    }
}));


//Passport session.
app.use(passport.initialize());
app.use(passport.session());


//Set the view engine to EJS and set the views directory.
app.set('view engine', 'ejs');
app.set('views', './views');



//Public Root Route request.
app.use("/", publicRoute);

//Signin Route.
app.use("/signin", signinRoute);

//Auth Route.
app.use("/", authRoute);

// Remove duplicate public route registration.
app.use("/create", createRoute);


//Public Reviews Route.
app.use("/publicReviews", publicReviewsRoute);


//Homepage Route.
app.use("/homepage", homepageRoute);


//Reviews Route.
app.use("/reviews", reviewsRoute);


//Login post request.
app.use("/login", loginRoute);


//Add post request.
app.use("/add", addRoute);


//Sort post request.
app.use("/sort", sortRoute);


//Edit post request.
app.use("/edit", editRoute);


//Delete post request.
app.use("/delete", deleteRoute);


//Listening Port.
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


