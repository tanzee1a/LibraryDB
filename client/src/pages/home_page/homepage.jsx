import React from 'react'
import './homepage.css'
import Navbar from '../../navbar_component/navbar.jsx'

function homepage() {

  return (
    <div className="home-container">
      <Navbar/>
      <img src="/assets/library_image.jpg" alt="Library" className="library-image" />
      <p className="home-text">This is the home page</p>
    </div>
  );
}

export default homepage