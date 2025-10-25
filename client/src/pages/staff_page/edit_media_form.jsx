import React from 'react'
import './edit_media_form.css'

function edit_media_form() {
  return (
  <div>
    <h1>Edit Existing Media</h1>
    <form>
      <div>
        <label for="itemID">Item ID:</label>
        <input type="text" id="itemID" name="itemID"></input>
      </div>
      <div>
        <label for="mTitle">Title:</label>
        <input type="text" id="mTitle" name="mTitle" required></input>
      </div>
      <div>
        <label for="studio">Studio:</label>
        <input type="text" id="studio" name="studio" required></input>
      </div>
      <div>
        <label for="tags">Tags:</label>
        <div>
        <label for="sciFi">Science Fiction</label>
        <input type="checkbox" name="sciFi" id="sciFi"></input>
        </div>
        <div>
        <label for="action">Action</label>
        <input type="checkbox" name="action" id="action"></input>
        </div>
        <div>
        <label for="thrill">Thriller</label>
        <input type="checkbox" name="thrill" id="thrill"></input>
        </div>
        <div>
        <label for="drama">Drama</label>
        <input type="checkbox" name="drama" id="drama"></input>
        </div>
        <div>
        <label for="adventure">Adventure</label>
        <input type="checkbox" name="adventure" id="adventure"></input>
        </div>
        <div>
        <label for="crime">Crime</label>
        <input type="checkbox" name="crime" id="crime"></input>
        </div>
        <div>
        <label for="mafia">Mafia</label>
        <input type="checkbox" name="mafia" id="mafia"></input>
        </div>
        <div>
        <label for="super">Superhero</label>
        <input type="checkbox" name="super" id="super"></input>
        </div>
        <div>
        <label for="comedy">Comedy</label>
        <input type="checkbox" name="comedy" id="comedy"></input>
        </div>
        <div>
        <label for="romance">Romance</label>
        <input type="checkbox" name="romance" id="romance"></input>
        </div>
        <div>
        <label for="romance">Romance</label>
        <input type="checkbox" name="romance" id="romance"></input>
        </div>
        <div>
        <label for="animation">Animation</label>
        <input type="checkbox" name="animation" id="animation"></input>
        </div>
        <div>
        <label for="anime">Anime</label>
        <input type="checkbox" name="anime" id="anime"></input>
        </div>
        <div>
        <label for="war">War</label>
        <input type="checkbox" name="war" id="war"></input>
        </div>
        <div>
        <label for="kids">Kids</label>
        <input type="checkbox" name="kids" id="kids"></input>
        </div>
        <div>
        <label for="biography">Biography</label>
        <input type="checkbox" name="biography" id="biography"></input>
        </div>
      </div>
      <div>
        <label for="description">Description:</label></div><div>
        <textarea id="description" name="description" placeholder="Enter full book description" rows="7" cols="50" required></textarea>
      </div><div>
        <label for="pubYear">Published Year:</label>
        <input type="text" id="pubYear" name="pubYear" required></input>
      </div>
      <div>
        <label for="amount">Quantity</label>
        <input type="text" name="amount" id="amount"></input>
      </div>

      <div>
        <input type="submit" id="submit" value="updateMedia"></input>
      </div>
    </form>
  </div>
  )
}


export default edit_media_form