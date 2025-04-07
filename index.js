//Import Statements.
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import env from "dotenv";
import supabase from './supabaseClient.js';


//Setting up the app and the port number.
const app = express();
const port = 3000;

//Salt Rounds.
const saltRounds = 10;

//ENV Configuration.
env.config();

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
    res.render("login.ejs");
});


//Sign-in Route.
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


//Create Route.
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

        //const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
        
        const {data, error} = await supabase
            .from('users')
            .select('username')
            .eq('username', username);

       
        //If there are no results, add the user and password to the users database.
        if(data.length === 0){
            
            bcrypt.hash(password, saltRounds, async(err, hash) => {
                
                if(err){
                    console.log("Error hashing password: ", err);
                }
                 
                else{
                  /* const result = await db.query(
                        "INSERT INTO users(username, password) VALUES ($1, $2) RETURNING *",
                        [username, hash]
                    );*/

                    const {data, error} = await supabase
                        .from('users')
                        .insert({ username: username, password: hash })
                        .select();

                    if (error) {
                        console.error("Error inserting user: ", error);
                        return res.status(500).send("Error inserting user.");
                    } else if (data.length === 0) {
                        console.log('No results found for the query.');
                    } else {
                        const user = data[0].username;

                        console.log("User logged in: ", user);
                        
                             
                        req.login(user, (err) => {
                            console.log(err);
                            res.render("/homepage");
                        }); 
                    }
                }
                 
            });
            
        }

        //Else, the user already exist in the database.
        else {
            res.send("User already exist.");
        }
        
    } catch (error) {
        res.status(404).send(error);
    }

});


//Homepage Route.
app.route("/homepage")
//Homepage get request.
.get((req, res) => {
    
    if(req.isAuthenticated()){
        
        //Render the homepage.ejs with the user. The user is created from the signin or create post request.
        res.render("homepage.ejs", {     
            username: req.user
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

        //If there are no results from the request, then the API has no information on the book.
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
                username: req.user,
                image: cover.config.url,
                author: resultAuthor,
                title: resultTitle,
            }); 
              
        }
        
    } catch (error) {
        res.status(404).send(error, 'Error in the homepage.');
    }

});


//Reviews Route.
app.route("/reviews")
//Get method to get all reviews for the user.
.get(async (req, res) => {

    //Try to get the reviews from the database, Catch any errors.
    try {

        //This query gets the results of all reviews from the selected user.
        const { data, error } = await supabase
            .from('reviews')
            .select()
            .eq('username', req.user);

        if (error) {
            return cb(error);
        }   

        //Empty reviews array that will hold all the results.
        const reviews = [];

        //ForEach method that pushes all data from the results into the reviews array.
        data.forEach((ele) => {
            reviews.push(ele);
        })

        //Render the reviews.ejs page with the username and the reviews.
        res.render("reviews.ejs", {
            username: req.user,
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
        const { data, error } = await supabase
            .from('reviews')
            .select()
            .eq('username', req.user);

        if (error) {
            return cb(error);
        }

        //Empty reviews array that will hold all the results.
        const reviews = [];
        
        //ForEach method that pushes all data from the results into the reviews array.
        data.forEach((ele) => {
            reviews.push(ele);
        });

        //Render the reviews.ejs page with the username and the reviews.
        res.render("reviews.ejs", {
            username: req.user,
            reviews: reviews 
        });
        
    } catch (error) {
        res.send("Error in accessing database."); 
    }

});


//Starting screen's post request.
app.post("/login", (req, res) => {

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

        //const result = await db.query("SELECT id FROM users WHERE username = $1", [req.user]);
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('username', req.user);
            
        if (error) {
            return cb(error);
        }
        
        const id = data[0].id;
        
        //Try to insert data into the database. Catch any errors submitting to database.
        try {
            
            const { error } = await supabase
                .from('reviews')
                .insert({ user_id: id, username: req.user, book_cover: cover, review: review, title: title, author: author, rating: rating });
            
            if (error) {
                return cb(error);
            }

            //Render the homepage.ejs with the user, cover, author, and title for the book.
            res.render("homepage.ejs", {
                username: req.user,
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
    let orderBy = req.body.order;

    if(orderBy === "ASC"){
        orderBy = true;
    } else {
        orderBy = false;
    }

       //Try to get the reviews from the database, Catch any errors.
        try {
    
            //This query gets the results of all reviews from the selected user and sorts them.
            //const results = await db.query(`SELECT * FROM reviews WHERE username = $1 ORDER BY ${type} ${orderBy}`, [req.user]);
            const { data, error } = await supabase
                .from('reviews')
                .select()
                .eq('username', req.user)
                .order(type, { ascending: orderBy });

            //Empty reviews array that will hold all the results.
            const reviews = [];
    
            //ForEach method that pushes all data from the results into the reviews array.
            data.forEach((ele) => {
                reviews.push(ele);
            })
    
            //Render the reviews.ejs page with the username and the reviews.
            res.render("reviews.ejs", {
                username: req.user,
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
        const {  error } = await supabase
            .from('reviews')
            .update({ review: item.review.trim() })
            .eq('username', req.user)
            .eq('review_id', item.edit);

        if (error) {
            return cb(error);
        }

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
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('username', req.user)
            .eq('review_id', reviewID);

        if (error) {
            return cb(error);
        }

        //Redirect to reviews.ejs
        res.redirect("/reviews");
        
    } catch (error) {
        res.send("Error in deleting review from database.", error);
    }

});


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


//Listening Port.
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
