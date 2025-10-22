import React from 'react'
import './catalog.css'
import Navbar from '../navbar/navbar.jsx'

function catalog() {

  return (
    <div>
      <Navbar/>
      <main className='main-content'>
        <h1>This is our catalog page</h1>

        <div className='cataegory-layer'>
          <a href="books">See More Books</a> <br></br>
        </div>

        <div className='category-layer'>
          <h2>See More Books</h2>
          <p>Content for books, like images or descriptions, would go here.</p>
          <a href="books">See More Books</a>
        </div>
         
        <a href="movies">See More Movies</a> <br></br>
        <a href="devices">See More Devices</a> <br></br>
        </main>

    </div>
  )
}

export default catalog