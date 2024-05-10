const editButtons = document.querySelectorAll('.edit');


for (let i = 0; i < editButtons.length; i++) {
    
    editButtons[i].addEventListener("click", function() {
        const editButton = this;
        const cancelButton = this.parentNode.querySelector('.cancel');
        const deleteButton = this.parentNode.querySelector('.delete');
        const review = this.parentNode.parentNode.querySelector('.review');

        if(editButton.innerHTML === "Edit"){
            
            review.removeAttribute("readonly");

            editButton.innerHTML = "Submit";

            cancelButton.classList.remove("hidden");

            deleteButton.classList.add("hidden");

        }

        else{
            editButton.type = "submit";
        }

        cancelButton.addEventListener("click", function(){

            review.setAttribute("readonly", true);

            editButton.innerHTML = "Edit";

            editButton.type = "button";

            cancelButton.type = "reset";
            
            cancelButton.classList.add("hidden");

            deleteButton.classList.remove("hidden");
            
        });

            
    });

}

