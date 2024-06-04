//Import Statements.
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import env from "dotenv";


//Setting up the app and the port number.
const app = express();
const port = 3000;

//Salt Rounds.
const saltRounds = 10;

//ENV Configuration.
env.config();

//Establishing the database.
const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

//Connecting to the database.
db.connect();


//Body-Parser as well as setting up the static route to public.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

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

//Get method for the starting page of the app.
app.get("/", (req, res) => {
    res.render("start.ejs");
});

app.route("/signin")
//Sign-in get method
.get((req, res) => {
    res.render("signin.ejs");
})
//Sign-in post request.
.post(passport.authenticate("local", {
    successRedirect: "/homepage",
    failureRedirect: "/signin",
}));


app.route("/create")
//Create get method.
.get((req, res) => {
    res.render("signin.ejs");
})
//Create post request.
.post(async(req, res) => {

    //Grabs the username and password from the user.
    const username = req.body.username.trim();
    const password = req.body.password.trim();  

    //Try Catch checks if the user is in the database.
    try {

        const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);

        //If there are no results, add the user and password to the users database.
        if(result.rows.length === 0){
            
            bcrypt.hash(password, saltRounds, async(err, hash) => {
                
                if(err){
                    console.log("Error hashing password: ", err);
                }
                
                else{
                   const result = await db.query(
                        "INSERT INTO users(username, password) VALUES ($1, $2) RETURNING *",
                        [username, hash]
                    );

                    const user = result.rows[0];

                    req.login(user, (err) => {
                        console.log(err);
                        res.redirect("/homepage");
                    });

                }
                 
            });
            
        }

        //Else, the user already exist in the database.
        else {
            res.send("User already exist.");
        }
        
    } catch (error) {
        res.send("Error adding credentials into database", error);
    }

});


app.route("/homepage")
//Get method for the homepage.
.get((req, res) => {
    
    if(req.isAuthenticated()){
        
        //Render the homepage.ejs with the user. The user is created from the signin or create post request.
        res.render("homepage.ejs", {     
            username: req.user.username
        });  
   
    } else {
        res.redirect("/signin");
    }
 
})
//Homepage post request.
.post(async(req, res) => {
    
    //Grabs the author and title from the user.
    const author = req.body.author.trim();
    const title = req.body.title.trim();

    //Try Catch statement that uses the Open Library API. 
    try {
        
        //Getting results from the API request using the title and author from the user. 
        const results = await axios.get(`https://openlibrary.org/search.json?title=${title}&author=${author}`);

        //Placeholder to get the cover, author, and title for the book. 
        let cover = '';
        let resultAuthor = '';
        let resultTitle = '';

        //If there are no results from the request, then the API has no infomation on the book.
        if(results.data.numFound === 0){
            res.send("Book not found, please go back to try another book.");
        }

        //Else, check to see if the book has more than one entry. 
        else{
            
            //If the book results have more than one entry, grab the first results information.
            if(results.data.docs.length > 0){

                //Gets the cover ID of the book.
                cover = results.data.docs[0].cover_edition_key;

                //Gets the author of the book.
                resultAuthor = results.data.docs[0].author_name;

                //Gets the title of the book.
                resultTitle = results.data.docs[0].title;
            
            }

            //Else, grab the only result information.
            else{
                
                //Gets the cover ID of the book.
                cover = results.data.docs.cover_edition_key;

                //Gets the author of the book.
                resultAuthor = results.data.docs.author_name;

                //Gets the title of the book.
                resultTitle = results.data.docs.title;
            }

            //Get the cover of the book using the Open Library Covers API.
            cover = await axios.get("https://covers.openlibrary.org/b/olid/" + cover + "-M.jpg");

            //If the cover url is undefined, set the url to a no image png.
            if(cover.config.url === 'https://covers.openlibrary.org/b/olid/undefined-M.jpg'){
                cover.config.url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png';
            }
          
            //Render the homepage.ejs with the user, cover, author, and title for the book.
            res.render("homepage.ejs", {
                username: req.user.username,
                image: cover.config.url,
                author: resultAuthor,
                title: resultTitle,
            }); 
              
        }
        
    } catch (error) {
        res.status(404).send(error, 'Error in the homepage.');
    }

});


app.route("/reviews")
//Get method to get all reviews for the user.
.get(async (req, res) => {

    //Try to get the reviews from the database, Catch any errors.
    try {

        //This query gets the results of all reviews from the selected user.
        const results = await db.query("SELECT * FROM reviews WHERE username = $1", [req.user.username]);

        //Empty reviews array that will hold all the results.
        const reviews = [];

        //ForEach method that pushes all data from the results into the reviews array.
        results.rows.forEach((ele) => {
            reviews.push(ele);
        })

        //Render the reviews.ejs page with the username and the reviews.
        res.render("reviews.ejs", {
            username: req.user.username,
            reviews: reviews 
        });
        
    } catch (error) {
        res.send("Error in accessing database.", error);
    }
})
//Review post request.
.post(async(req, res) => {

    //Try to get the reviews from the database, Catch errors accessing the database.
    try {

        //This query gets the results of all reviews from the selected user.
        const results = await db.query("SELECT * FROM reviews WHERE username = $1", [req.user.username]);

        //Empty reviews array that will hold all the results.
        const reviews = [];
        
        //ForEach method that pushes all data from the results into the reviews array.
        results.rows.forEach((ele) => {
            reviews.push(ele);
        });

        //Render the reviews.ejs page with the username and the reviews.
        res.render("reviews.ejs", {
            username: req.user.username,
            reviews: reviews 
        });
        
    } catch (error) {
        res.send("Error in accessing database."); 
    }

});


//Starting screen's post request.
app.post("/start", (req, res) => {

    //If the user clicks the signin button, have them sign in.
    if(req.body["signin"]){
        res.render("signin.ejs");
    }

    //Else, take them to create a new account.
    else{
        res.render("create.ejs");
    }
 
});

//Add post request.
app.post("/add", async(req, res) => {

    //Grabs the following information submitted for the book review. 
    const title = req.body.title;
    const author = req.body.author;
    const rating = req.body.rating;
    const review = req.body.review;
    const cover = req.body.cover;

    //Try to get the user's id from the users database. Catch any errors accessing the database.
    try {

        const result = await db.query("SELECT id FROM users WHERE username = $1", [req.user.username]);

        //Gets user's id. 
        const id = result.rows[0].id;
        
        //Try to insert data into the database. Catch any errors submitting to database.
        try {

            await db.query("INSERT INTO reviews (user_id, username, book_cover, review, title, author, rating) VALUES ($1, $2, $3, $4, $5, $6, $7)", 
            [id, req.user.username, cover, review, title, author, rating]);

            //Render the homepage.ejs with the user, cover, author, and title for the book.
            res.render("homepage.ejs", {
                username: req.user.username,
                author: author,
                title: title,
                cover: cover  
            });
        
        } catch (error) {
            res.send("Error submitting data into database."); 
        }

    } catch (error) {
        res.send("Error in accessing database."); 
    }
    
});

//Sort post request.
app.post("/sort", async(req, res) => {

    const type = req.body.type;
    const orderBy = req.body.order;

       //Try to get the reviews from the database, Catch any errors.
        try {
    
            //This query gets the results of all reviews from the selected user and sorts them.
            const results = await db.query(`SELECT * FROM reviews WHERE username = $1 ORDER BY ${type} ${orderBy}`, [req.user.username]);

            //Empty reviews array that will hold all the results.
            const reviews = [];
    
            //ForEach method that pushes all data from the results into the reviews array.
            results.rows.forEach((ele) => {
                reviews.push(ele);
            })
    
            //Render the reviews.ejs page with the username and the reviews.
            res.render("reviews.ejs", {
                username: req.user.username,
                reviews: reviews
            });
           
        } catch (error) {
            res.status("Error in accessing database.", error);
        }
});

//Edit post request.
app.post("/edit", async (req, res) => {
    
    //Grabs the review.
    const item = req.body;

    //Try to update review in the database. Catch errors in updating the database.
    try {
        
        //Update the review of the user and where the review ID is located.
        await db.query("UPDATE reviews SET review = $1 WHERE review_id = $2 AND username = $3", [item.review, item.edit, req.user.username]);

        //Redirect to reviews.ejs
        res.redirect("/reviews");
        
    } catch (error) {
        res.send("Error updating database.", error);
    }  
    
});

//Delete post request.
app.post("/delete", async(req, res) => {
    
    //Grabs review Id.
    const reviewID = req.body.delete;

    //Try to delete the review from the database, Catch errors deleting review from the database.
    try {
        
        //Delete the review of the user and where the review ID is located.
        await db.query("DELETE FROM reviews WHERE username = $1 AND review_id = $2", [req.user.username, reviewID]);

        //Redirect to reviews.ejs
        res.redirect("/reviews");
        
    } catch (error) {
        res.send("Error in deleting review from database.", error);
    }

});

passport.use(new Strategy(async function verify(username, password, cb){
    
    console.log(username + " " + password);

    //Try to find the user, Catch if the user is not in the database.
    try {
        
        //Select the user's username from the users database.
        const result = await db.query("SELECT * FROM users WHERE username = $1", [username.trim()]);

            //If there is a result from the database, check the password associated with the username.
            if(result.rows.length > 0){
                
                //User founded in database.
                const user = result.rows[0];

                //The database password.
                const databasePassword = user.password;
                
                //Compare the database password with the user's password.
                bcrypt.compare(password, databasePassword, (err, result) => {
                    
                    //If there is a error comparing the passwords, return the error.
                    if(err){
                        return cb(err);
                    }

                    //Else, check if the passwords match.
                    else{
                        
                        //If the passwords match, return the user.
                        if(result){          
                            return cb(null, user); 
                        }
  
                        //Else, the passwords do not match.
                        else{
                            return cb(null, false);
                        }
                    }
                });

            }

            //Else, no result, user not found.
            else{
                return cb("User not found");
            }   

    } catch (error) {
        return cb(err);
    }

}));

passport.serializeUser((user, cb) => {
    cb(null, user);
});

passport.deserializeUser((user, cb) => {
    cb(null, user);
});

//Listening Port.
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
  
