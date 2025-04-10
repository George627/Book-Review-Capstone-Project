import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

//Edit post request.
router.post("/", async (req, res) => {
    
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

export default router;