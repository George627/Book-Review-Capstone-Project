import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

//Reviews Route.
router.route("/")
.get(async(req, res) => {
    
    if(req.isAuthenticated()){

        //Try to get the reviews from the database, Catch any errors.
        try {

            //This query gets the results of all reviews from the selected user.
            const { data, error } = await supabase
                .from('reviews')
                .select('book_cover, title, author')
                .order('title', { ascending: false });             

            if (error) {
                return cb(error);
            }     

            //Empty reviews array that will hold all the results.
            const mostReviewed = mostFrequent(data, 'title');

            const firstMostReviewed = data.find((review) => review.title === mostReviewed[0][0]);
            const secondMostReviewed = data.find((review) => review.title === mostReviewed[1][0]);
            const thirdMostReviewed = data.find((review) => review.title === mostReviewed[2][0]); 
            
            const restOfReviews = data.filter((review) => review.title !== mostReviewed[0][0] && 
                                                           review.title !== mostReviewed[1][0] && 
                                                           review.title !== mostReviewed[2][0]);
                                                           

            const reviews = [firstMostReviewed, secondMostReviewed, thirdMostReviewed];
                


            //Render the reviews.ejs page with the username and the reviews.
            res.render("public.ejs", {
                username: req.user,
                reviews: reviews,
                restOfReviews: restOfReviews, 
            });
            
        } catch (error) {
            res.send("Error in accessing database.", error);
        }
        
   
    } else {
        res.redirect("/signin");
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
            .eq('title', req.body.title)
            .eq('author', req.body.author);

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
        res.render("publicReviews.ejs", {
            username: req.user,
            reviews: reviews 
        });
        
    } catch (error) {
        res.send("Error in accessing database."); 
    }

});

function mostFrequent(data, key) {
    const count = data.reduce((acc, obj) => {
        const value = obj[key];
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
    const sorted = Object.entries(count).sort(([, a], [, b]) => b - a);
    return sorted.slice(0, 3);
}

export default router;