import express from 'express';
import axios from "axios";

const router = express.Router();

//Homepage Route.
router.route("/")
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

export default router;