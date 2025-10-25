import React from 'react'
import './pay_fine_staff.css'

function StaffFineForm() {
  return (
    <div>
        <h1>Pay User's Fine</h1>
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
                <label for="date">Date Payed Off: </label>
            </div><div>
                <input type="date" id="date" name="date" required></input>
            </div>
            */
            <div>
                <p>Theoretical cerdit card info entry or something</p> 
                <input type="text" id="payAmount" name="payAmount" required></input>
            </div>

            <div>
                <input type="submit" id="submit" value="payFine"></input>
            </div>
        </div>
    </div>
  )
}


export default StaffFineForm