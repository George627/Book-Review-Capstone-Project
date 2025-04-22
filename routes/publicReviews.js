import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

//Reviews Route.
router.route("/")
//Get method to get all reviews for the user.
.get(async (req, res) => {

    //Try to get the reviews from the database, Catch any errors.
    try {

        //This query gets the results of all reviews from the selected user.
        const { data, error } = await supabase
            .from('reviews')
            .select()
            

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


export default router;