import { useState } from "react";
import { IoSearch, IoPersonCircleOutline } from "react-icons/io5";
import './navbar.css'

const Navbar = () => {
    const [showSearch, setShowSearch] = useState(false);
    const toggleSearch = () => setShowSearch(!showSearch);

    return (
        <div className="nav-container">
            <nav className="nav">
                <ul className="nav-links">
                <li><a href="/" className="logo">LBRY
                {/* <img className="navbar-logo" src={Logo} alt="" /> */}
                </a></li>
                <li><a href="item-details">Item Details (2BR)</a></li>
                <li class="dropdown">
                <a href="#">Books</a>
                <div class="dropdown-menu">
                    <div class="category-column">
                        <p>Popular & Trending</p>
                        <a href="#">Romance</a>
                        <a href="#">Mystery, Thriller & Suspense</a>
                        <a href="#">Science Fiction & Fantasy</a>
                        <a href="#">Teen & Young Adult</a>
                    </div>

                    <div class="category-column">
                        <p>Literature & Culture</p>
                        <a href="#">Fiction</a>
                        <a href="#">Diversity & Inclusion</a>
                        <a href="#">History</a>
                        <a href="#">Nonfiction</a>
                    </div>

                    <div class="category-column">
                        <p>Learning & Growth</p>
                        <a href="#">Self-Help</a>
                        <a href="#">Education & Teaching</a>
                        <a href="#">Reference</a>
                        <a href="#">Test Preparation</a>
                    </div>

                    <div class="category-column">
                        <p>Lifestyle & Creativity</p>
                        <a href="#">Arts & Photography</a>
                        <a href="#">Cookbooks, Food & Wine</a>
                        <a href="#">Crafts, Hobbies & Home</a>
                        <a href="#">Health, Fitness & Dieting</a>
                    </div>
                </div>
                </li>
                <li class="dropdown">
                    <a href="#">Media</a>
                    <div class="dropdown-menu">
                    <div class="category-column">
                        <p>Genres</p>
                        <a href="#">Action & Adventure</a>
                        <a href="#">Comedy</a>
                        <a href="#">Drama</a>
                        <a href="#">Horror</a>
                    </div>

                    <div class="category-column">
                        <p>Collections</p>
                        <a href="#">New Releases</a>
                        <a href="#">Award Winners</a>
                        <a href="#">Classics</a>
                        <a href="#">Box Sets</a>
                    </div>

                    <div class="category-column">
                        <p>Formats</p>
                        <a href="#">DVD</a>
                        <a href="#">Blu-ray</a>
                        <a href="#">4K Ultra HD</a>
                        <a href="#">Digital</a>
                    </div>
                    </div>
                </li>
                <li class="dropdown">
                    <a href="#">Devices</a>
                    <div class="dropdown-menu">
                    <div class="category-column">
                        <p>Device Types</p>
                        <a href="#">Tablets</a>
                        <a href="#">Phones</a>
                        <a href="#">Laptops</a>
                        <a href="#">Desktops</a>
                    </div>

                    <div class="category-column">
                        <p>Operating Systems</p>
                        <a href="#">macOS</a>
                        <a href="#">Windows</a>
                        <a href="#">Linux</a>
                        <a href="#">ChromeOS</a>
                    </div>

                    <div class="category-column">
                    <p>Form Factor</p>
                    <a href="#">Compact</a>
                    <a href="#">Portable</a>
                    <a href="#">Desktop</a>
                    <a href="#">Workstation</a>
                    </div>
                    </div>
                </li>
                <li className="dropdown search-dropdown">
                    <button className="nav-icon" onClick={toggleSearch}>
                    <IoSearch />
                    </button>
                    {showSearch && (
                    <div className="dropdown-menu search-menu">
                        <input type="text" placeholder="Search..." className="search-input" />
                        <div className="quick-links">
                        <a href="#">Books</a>
                        <a href="#">Media</a>
                        <a href="#">Devices</a>
                        </div>
                    </div>
                    )}
                </li>
                <li>
                    <button className="nav-icon">
                        <IoPersonCircleOutline />
                    </button>
                </li>
                </ul>
            </nav>
        </div>
    );
};

export default Navbar