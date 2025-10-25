import React from 'react'
import './new_fine_form.css'

function NewFineForm() {
  return (
    <div>
        <h1>Issue Fine</h1>
        <div>
            <div>
                <label for="userID">User's ID: </label>
                <input type="text" id="userID" name="userID" required></input>
            </div>
            <div>
                <label for="borrowID">Borrowed Item's ID: </label>
                <input type="text" id="borrowID" name="borrowID" required></input>
            </div>
            /* May want to use current date instead 
            <div>
                <label for="date">Date of Fine: </label>
            </div><div>
                <input type="date" id="date" name="date" required></input>
            </div>
            */
            <div>
                <label for="amount">Fined Amount: </label>
                <input type="text" id="amount" name="amount" required></input>
            </div>

            <div>
                <input type="submit" id="submit" value="newFine"></input>
            </div>
        </div>
    </div>
  )
}


export default NewFineForm