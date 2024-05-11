//Gets all edit buttons in the document. 
const editButtons = document.querySelectorAll('.edit');

//For loop that loops through each button in the array.
for (let i = 0; i < editButtons.length; i++) {
    
    //The edit button that has been clicked.
    editButtons[i].addEventListener("click", function() {
        
        //The edit button clicked, cancel button, delete button, of the review. 
        const editButton = this;
        const cancelButton = this.parentNode.querySelector('.cancel');
        const deleteButton = this.parentNode.querySelector('.delete');
        const review = this.parentNode.parentNode.querySelector('.review');

        //If the edit button innerHTML equal Edit....
        if(editButton.innerHTML === "Edit"){
            
            //Remove the readonly attribute of the review so it can be edited.
            review.removeAttribute("readonly");

            //Change the edit button's innerHTML to Submit.
            editButton.innerHTML = "Submit";

            //Unhide the cancel button.
            cancelButton.classList.remove("hidden");

            //Hide the delete button.
            deleteButton.classList.add("hidden");

        }

        //Else, submit the button.
        else{
            editButton.type = "submit";
        }

        //The cancel button has been clicked.
        cancelButton.addEventListener("click", function(){

            //Add the readonly attribute to the review.
            review.setAttribute("readonly", true);

            //Change the innerHTML of the edit button back to Edit.
            editButton.innerHTML = "Edit";

            //Change the edit button's type to button
            editButton.type = "button";

            //Change the cancel's buttons type to reset, resetting any data that may have been type for the review.
            cancelButton.type = "reset";
            
            //Hide the cancel button.
            cancelButton.classList.add("hidden");

            //Unhide the delete button.
            deleteButton.classList.remove("hidden");
            
        });

            
    });

}
