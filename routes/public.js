import express from 'express';
import axios from "axios";
import supabase from '../supabaseClient.js';

const router = express.Router();

//Homepage Route.
router.route("/")
//Homepage get request.
.get(async(req, res) => {
    
    if(req.isAuthenticated()){

        //Try to get the reviews from the database, Catch any errors.
        try {

            //This query gets the results of all reviews from the selected user.
            const { data, error } = await supabase
                .from('reviews')
                .select('book_cover, title, author', 'title(count)')
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
//Homepage post request.
.post(async(req, res) => {

    //Grabs the author and title from the user.
    const author = req.body.author.trim();
    const title = req.body.title.trim();
    
    // Check if the title or author are empty or consist only of whitespace.
    if (!title || !author) { 
        res.send(`<script>alert('Please fill out all fields.'); window.location.href = "/homepage";</script>`);
        return;
    }

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
            res.render("newbook.ejs", {
                username: req.user,
                image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/No-Image-Placeholder.svg/1665px-No-Image-Placeholder.svg.png',
                author: author,
                title: title,
            }); 
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