import express from 'express';
import supabase from '../supabaseClient.js';

const router = express.Router();

//Sort post request.
router.post("/", async(req, res) => {

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

export default router;