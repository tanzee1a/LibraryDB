import React from 'react'
import './item_end_hold.css'

function item_end_hold() {
  return (
    <div>
        <h1>Take Item(s) Off Hold</h1>
        <div>
            <div>
                <label for="itemID">Item's ID: </label>
                <input type="text" id="itemID" name="itemID" required></input>
            </div>
            <div>
                <label for="amount">Quantity To Remove From Hold: </label> 
                /* If you need to put multiple on, it'd be a waste to fill the form repeatedly */
                <input type="text" id="amount" name="amount" required></input>
            </div>

            <div>
                <input type="submit" id="submit" value="newFine"></input>
            </div>
            /* Note: error handling should check if there are fewer copies on hold than we are trying to take off hold */
        </div>
    </div>
  )
}


export default item_end_hold