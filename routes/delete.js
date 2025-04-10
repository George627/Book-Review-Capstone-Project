import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

//Delete post request.
router.post("/", async(req, res) => {
    
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

export default router;