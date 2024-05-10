import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

//Establishing the database.
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "bookreview",
    password: "Omniverse",
    port: 5432
});

//Connecting to the database.
db.connect();

//Setting up the app and the port number.
const app = express();
const port = 3000;

//Placeholder for the username.
let reviewer = '';

//Body-Parser as well as setting up the static route to public.
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//Get method for the starting page of the app.
app.get("/", (req, res) => {
    res.render("start.ejs");
});

//Get method for the homepage.
app.get("/homepage", (req, res) => {
    
    //Render the homepage.ejs with the user. The user is created from the signin or create post request.
    res.render("homepage.ejs", {     
        username: reviewer
    });
});

//Get method to get all reviews for the user.
app.get("/reviews", async (req, res) => {

    //Try to get the reviews from the database, Catch any errors.
    try {

        //This query gets the results of all reviews from the selected user.
        const results = await db.query("SELECT * FROM reviews WHERE username = $1", [reviewer]);

        //Empty reviews array that will hold all the results.
        const reviews = [];

        //ForEach method that pushes all data from the results into the reviews array.
        results.rows.forEach((ele) => {
            reviews.push(ele);
        })

        //Render the reviews.ejs page with the username and the reviews.
        res.render("reviews.ejs", {
            username: reviewer,
            reviews: reviews 
        });
        
    } catch (error) {
        res.send("Error in accessing database.", error);
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

//Sign-in post request.
app.post("/signin", async(req, res) => {

    //Grabs the username and password from the user.
    const username = req.body.username;
    const password = req.body.password;  

    //Try to find the user, Catch if the user is not in the database.
    try {
        
        const result = await db.query("SELECT * FROM users WHERE username = $1", [username.trim()]);

        //Try to find the correct password for the user, Catch if the password is incorrect.
        try { 
            
            if(result.rows.length > 0){
                const user = result.rows[0];

                const databasePassword = user.password;

                if(password.trim() === databasePassword){
                    
                    reviewer = user.username;
                    
                    res.render("homepage.ejs", {
                        username: reviewer
                    });
                }

                else {
                    res.send("Wrong password.")
                }
            }

            else{
                res.send("Can't find that User.");
            }

        } catch (error) {
            res.send("Error on getting password.", error)
        }

    } catch (error) {
        res.send("Error finding user.", error);
    }
 
});

app.post("/create", async(req, res) => {

    const username = req.body.username.trim();
    const password = req.body.password.trim();  

    try {

        const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);

        if(result.rows.length === 0){
            await db.query(
                "INSERT INTO users(username, password) VALUES ($1, $2)",
                [username, password]
            );

            reviewer = username;

            res.render("homepage.ejs", {
                username: reviewer
            });
        }

        else {
            res.send("User already exist.");
        }
        
    } catch (error) {
        res.send("Error adding credentials into database", error);
    }

});

app.post("/homepage", async(req, res) => {
    
    const author = req.body.author.trim();

    const title = req.body.title.trim();

    try {
        const results = await axios.get(`https://openlibrary.org/search.json?title=${title}&author=${author}`);

        let cover = '';

        let resultAuthor = '';

        let resultTitle = '';

        try {
            if(results.data.numFound === 0){
                res.send("Book not found, please try another book.");
            }

            else{
                

                if(results.data.docs.length > 0){
                
                cover = results.data.docs[0].cover_edition_key;

                resultAuthor = results.data.docs[0].author_name;

                resultTitle = results.data.docs[0].title;
                
                }

                else{

                    cover = results.data.docs.cover_edition_key;

                    resultAuthor = results.data.docs.author_name;

                    resultTitle = results.data.docs.title;
                }

                
                cover = await axios.get("https://covers.openlibrary.org/b/olid/" + cover + "-M.jpg");

                res.render("homepage.ejs", {
                    username: reviewer,
                    image: cover.config.url,
                    author: resultAuthor,
                    title: resultTitle,
                });

            }
        } catch (error) {
            
        }

        
    } catch (error) {
        res.send("Error in homepage.", error);
    }

});

app.post("/add", async(req, res) => {

    console.log(req.body);

    const title = req.body.title;
    const author = req.body.author;
    const rating = req.body.rating;
    const review = req.body.review;
    const cover = req.body.cover;


    try {

        const result = await db.query("SELECT id FROM users WHERE username = $1", [reviewer]);

        const id = result.rows[0].id;
        
        try {
            await db.query("INSERT INTO reviews (user_id, username, book_cover, review, title, author, rating) VALUES ($1, $2, $3, $4, $5, $6, $7)", [id, reviewer, cover, review, title, author, rating]);

            res.render("homepage.ejs", {
                username: reviewer,
                author: author,
                title: title,
                cover: cover  
            });
        
        } catch (error) {
            res.send("Error in accessing database.", error);
        }
    } catch (error) {
        res.send("Error inserting into database.", error); 
    }

    

    
});

app.post("/reviews", async(req, res) => {

    try {
        const results = await db.query("SELECT * FROM reviews WHERE username = $1", [reviewer]);

        const reviews = [];
        
        results.rows.forEach((ele) => {
            reviews.push(ele);
        });

        res.render("reviews.ejs", {
            username: reviewer,
            reviews: reviews 
        });
        
    } catch (error) {
        res.send("Error in accessing database.", error);
    }

});

app.post("/edit", async (req, res) => {
    const item = req.body;

    try {
        const results = await db.query("UPDATE reviews SET review = $1 WHERE review_id = $2 AND username = $3", [item.review, item.edit, reviewer]);

        res.redirect("/reviews");
        
    } catch (error) {
        res.send("Error in accessing database.", error);
    }  
    
});

app.post("/delete", async(req, res) => {
    
    const reviewID = req.body.delete;

    try {
        const results = await db.query("DELETE FROM reviews WHERE username = $1 AND review_id = $2", [reviewer, reviewID]);

        res.redirect("/reviews");
        
    } catch (error) {
        res.send("Error in deleting review from database.", error);
    }

});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
  
