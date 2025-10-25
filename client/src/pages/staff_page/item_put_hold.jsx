import React from 'react'
import './item_put_hold.css'

function ItemHoldForm() {
  return (
    <div>
        <h1>Put Item(s) on Hold</h1>
        <div>
            <div>
                <label for="itemID">Item's ID: </label>
                <input type="text" id="itemID" name="itemID" required></input>
            </div>
            /* I don't think we're tracking when the item will no longer be on hold,
            so no date field */
            <div>
                <label for="amount">Quantity To Place On Hold: </label> 
                /* If you need to put multiple on, it'd be a waste to fill the form repeatedly */
                <input type="text" id="amount" name="amount" required></input>
            </div>

            <div>
                <input type="submit" id="submit" value="holdItem"></input>
            </div>
            /* Note: error handling should check if there are fewer available copies than we are trying to put on hold */
        </div>
    </div>
  )
}


export default ItemHoldForm