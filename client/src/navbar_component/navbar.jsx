import React from 'react';
import './navbar.css';

const navbar = () => {
    return (
        <nav id="desktop-nav">
            <div className="navbar-left">
            <a href="/" className="logo"> Our Library</a>
            </div>
            <div className="navbar-center">
            <ul className="nav-links">
                <li><a href="Catalog">Browse & Borrow</a></li>
                <li><a href="Login">Login</a></li>
                <li><a href="Profile">My Profile</a></li>
            </ul>
            </div>
        </nav>
    );
};

export default navbar;