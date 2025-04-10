import express from 'express';

const router = express.Router();

//Starting screen's post request.
router.post("/", (req, res) => {

    //If the user clicks the signin button, have them sign in.
    if(req.body["signin"]){
        res.render("signin.ejs");
    }

    //Else, take them to create a new account.
    else{
        res.render("create.ejs");
    }
 
});

export default router;