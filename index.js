import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "bookreview",
    password: "Omniverse",
    port: 5432
});

db.connect();

const app = express();
const port = 3000;

let reviewer = '';

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


app.get("/", (req, res) => {
    res.render("start.ejs");
});

app.get("/homepage", (req, res) => {
    res.render("homepage.ejs", {
        username: reviewer
    });
});

app.get("/reviews", async (req, res) => {
    
    try {
        const results = await db.query("SELECT * FROM reviews WHERE username = $1", [reviewer]);

        const reviews = [];
        
        results.rows.forEach((ele) => {
            reviews.push(ele);
        })

        res.render("reviews.ejs", {
            username: reviewer,
            reviews: reviews 
        });
        
    } catch (error) {
        res.send("Error in accessing database.", error);
    }
});

app.post("/start", (req, res) => {
    
    if(req.body["signin"]){
        res.render("signin.ejs");
    }
    
    else{
        res.render("create.ejs");
    }
 
});

app.post("/signin", async(req, res) => {
    
    const username = req.body.username;
    const password = req.body.password;  

    try {
        
        const result = await db.query("SELECT * FROM users WHERE username = $1", [username.trim()]);

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
  