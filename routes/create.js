import express from 'express';
import supabase from '../supabaseClient.js';
import bcrypt from "bcrypt";
const router = express.Router();

//Salt Rounds.
const saltRounds = 10;

//Create Route.
router.route("/")
//Create get method.
.get((req, res) => {
    res.render("signin.ejs");
})
//Create post request.
.post(async(req, res) => {

    //Grabs the username and password from the user.
    const username = req.body.username.trim();
    const password = req.body.password.trim(); 


    //Check if the username and password are empty. 
    //If they are, send an alert to the user.
    if(username || password === "") {          
        res.send(`<script>alert('Please fill out all fields.'); window.location.href = "/create";</script>`);
        return;
    }

    //Try Catch checks if the user is in the database.
    try {

        //Check if the username already exists in the database.
        const {data, error} = await supabase
            .from('users')
            .select('username')
            .eq('username', username);

       
        //If there are no results, add the user and password to the users database.
        if(data.length === 0){
            
            bcrypt.hash(password, saltRounds, async(err, hash) => {
                
                if(err){
                    console.log("Error hashing password: ", err);
                }
                 
                else{
                    const {data, error} = await supabase
                        .from('users')
                        .insert({ username: username, password: hash })
                        .select();

                    if (error) {
                        console.error("Error inserting user: ", error);
                        return res.status(500).send("Error inserting user.");
                    } else if (data.length === 0) {
                        console.log('No results found for the query.');
                    } else {
                        const user = data[0].username;
                             
                        req.logIn(user, (err) => {
                            
                            res.render("public.ejs", {     
                                username: req.user
                            }); 
                        }); 
                    }
                }
                 
            });
            
        }

        //Else, the user already exist in the database.
        else {
            res.send("User already exist.");
        }
        
    } catch (error) {
        res.status(404).send(error);
    }

});

export default router;