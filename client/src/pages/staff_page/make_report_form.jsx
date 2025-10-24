import React from 'react'
import './make_report_form.css'

function make_report_form() {
  return (
    <div>
      <p>This is our staff page</p>
      <div>
        /* May not be necessary if the ID is auto-generated
        <div>
          <label for="reportID">Report ID: </label>
          <input type="text" id="reportID" name="reportID" required></input>
        </div>
        */

        /* May want to use current date instead 
        <div>
          <label for="date">Date Payed Off: </label>
        </div><div>
          <input type="date" id="date" name="date" required></input>
        </div>
        */
        
        /* The staff would be logged in so this whouldn't be necessary but you know just in case here you go 
        <div>
          <label for="userID">User's ID: </label>
          <input type="text" id="userID" name="userID" required></input>
        </div>
        */

        /* I don't know what else the report making page would need,
        the schema doesn't store any other info besides these 3 things */
      </div>
    </div>
  )
}


export default make_report_form