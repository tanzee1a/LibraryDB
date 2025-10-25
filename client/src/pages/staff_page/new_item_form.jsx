import React from 'react'
import './new_item_form.css'

function new_item_form() {
  return (
    <div>
        <h1>Add New Item</h1>
        <div>
            <div>Item Type:</div>
            <div>
                <label for="book">Book</label>
                <input type="radio" name="iType" value="Book" id="book"></input>
            </div><div>
                <label for="movie">Device</label>
                <input type="radio" name="iType" value="Movie" id="movie"></input>
            </div><div>
                <label for="device">Movie</label>
                <input type="radio" name="iType" value="Device" id="device"></input>
            </div>
        </div>

        <div id="fieldBook" hidden>
            <form>
                <div>
                    <label for="itemID">Item ID:</label>
                    <input type="text" id="itemID" name="itemID"></input>
                </div>
                <div>
                    <label for="bTitle">Title:</label>
                    <input type="text" id="bTitle" name="bTitle" required></input>
                </div>
                <div>
                    <label for="author">Author:</label>
                    <input type="text" id="author" name="author" required></input>
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
                    <label for="fanstasy">Fantasy</label>
                    <input type="checkbox" name="fanstasy" id="fanstasy"></input>
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
                </div>
                <div>
                    <label for="publisher">Publisher:</label>
                    <input type="text" id="publisher" name="publisher" required></input>
                </div>
                <div>
                    <label for="pubYear">Published Year::</label>
                    <input type="text" id="pubYear" name="pubYear" required></input>
                </div>
                <div>
                    <label for="shelf">Shelf Location:</label>
                    <input type="text" id="shelf" name="shelf" required></input>
                </div>
                
                <div>
                    <input type="submit" id="submit" value="registerBook"></input>
                </div>
            </form>
        </div>
            
        <div id="fieldMedia" hidden>
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
                    <label for="pubYear">Published Year::</label>
                    <input type="text" id="pubYear" name="pubYear" required></input>
                </div>
                <div>
                    <label for="amount">Quantity</label>
                    <input type="text" name="amount" id="amount"></input>
                </div>

                <div>
                    <input type="submit" id="submit" value="RegisterMedia"></input>
                </div>
            </form>
        </div>

        <div id="fieldDevice" hidden>
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
                    <input type="submit" id="submit" value="registerDevice"></input>
                </div>
            </form>
        </div>
   </div>
  )
}

export default new_item_form