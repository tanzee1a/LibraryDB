import React from 'react'
import '../../styles/device.css'
import Navbar from '../navbar_component/navbar.jsx'


function device() {

  return (
    <div>
      <Navbar/>
      <main className='main-content'>
        <h1> This is our devices page </h1>
      </main>
    </div>
  )
}

export default device