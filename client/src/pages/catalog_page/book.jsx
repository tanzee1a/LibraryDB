import React from 'react'
import './book.css'
import Navbar from '../navbar_component/navbar.jsx'


function book() {

  return (
    <div>
      <Navbar/>
      <div className='page-container'>
        <main className='main-content'>
          <h1> This is our book page </h1>
        </main>
      </div>
    </div>
  )
}

export default book