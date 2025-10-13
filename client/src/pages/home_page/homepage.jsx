import React from 'react'
import './homepage.css'

function homepage() {

  return (
    <body>
      <nav id="desktop-nav">
      <div class="logo">Welcome to our Library</div>
      <div>
          <ul class="nav-links">
              <li><a href="Catalog">Browse & Borrow</a></li>
              <li><a href="Login">Login</a></li>
              <li><a href="Profile">My Profile</a></li>
          </ul>
      </div>
      </nav>
      <nav id="hamburger-nav">
          <div class="logo">Our Library</div>
          <div class= "hamburger-menu">
              <div class = "hamburger-icon" onclick = "toggleMenu()">
                  <span></span>
                  <span></span>
                  <span></span>
              </div>
              <div class="menu-links">
                  <li><a href="Catalog" onclick = "toggleMenu()">Browse & Borrow</a></li>
                  <li><a href="Login" onclick = "toggleMenu()">Login</a></li>
                  <li><a href="Profile" onclick = "toggleMenu()">My Profile</a></li>
              </div>
          </div>
      </nav>
    </body>
  )
}

export default homepage