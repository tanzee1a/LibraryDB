import React from 'react'
import '../../styles/book.css'
import Navbar from '../navbar_component/navbar.jsx'


function book() {

  return (
    <div>
      <Navbar/>
      <main className='main-content'>
        <h1> This is our book page </h1>
      </main>
    </div>
  )
}

export default book