import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

//Add post request.
router.post("/", async(req, res) => {

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

export default router;