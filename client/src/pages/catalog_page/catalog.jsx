import React from 'react'
import './catalog.css'
import Navbar from '../../navbar_component/navbar.jsx'


function catalog() {

  return (
    <div>
      <Navbar/>
     <h1>This is our catalog page</h1>
     <li><a href="books">See More Books</a></li>
     <li><a href="movies">See More Movies</a></li>
     <li><a href="devices">See More Devices</a></li>


    </div>
  )
}

export default catalog