import React from 'react'
import './edit_device_form.css'

function edit_device_form() {
  return (
    <div>
      <h1>Edit Existing Device</h1>
      <form>
        <div>
          <label for="itemID">Item ID:</label>
          <input type="text" id="itemID" name="itemID"></input>
        </div>
        <div>
          <label for="mTitle">Model:</label>
          <input type="text" id="mTitle" name="mTitle" required></input>
        </div>
        <div>
          <label for="studio">Manufactorer:</label>
          <input type="text" id="studio" name="studio" required></input>
        </div>
        <div>Device Type:</div>
        <div>
          <label for="laptop">Laptop</label>
          <input type="radio" name="dType" value="laptop" id="laptop"></input>
          <label for="musPlayer">Music Player</label>
          <input type="radio" name="dType" value="musPlayer" id="musPlayer"></input>
        </div>
        <div>
          <label for="amount">Quantity</label>
          <input type="text" name="amount" id="amount"></input>
        </div>
                
        <div>
          <input type="submit" id="submit" value="updateDevice"></input>
        </div>
      </form>
    </div>
  )
}


export default edit_device_form