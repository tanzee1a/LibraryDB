import React from 'react'
import './movie.css'
import Navbar from '../navbar_component/navbar.jsx'


function movie() {

  return (
    <div>
      <Navbar/>
      <main className='main-content'>
        <h1> This is our movies page </h1>
      </main>
      
    </div>
  )
}

export default movie