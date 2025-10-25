import React from 'react'
import './edit_item_form.css'

function ItemEditStart() {
  return (
    <div>
        <h1>Edit Existing Item</h1>
        <form>
            <div>
                <label for="borrowID">Item's ID: </label>
                <input type="text" id="borrowID" name="borrowID" required></input>
            </div>

            <div>
                <input type="submit" id="submit" value="itemEdit"></input>
            </div>
            /* This form will redirect to the more specific form based on what type of thing it is
            ideally it would also poulate all the fields with the existing info too */
        </form>
    </div>
  )
}


export default ItemEditStart