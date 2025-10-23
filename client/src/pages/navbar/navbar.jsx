
import { IoSearch, IoPersonCircleOutline } from "react-icons/io5";
import './navbar.css'

const Navbar = () => {

    return (
        <div className="nav-container">
            <nav className="nav">
                <ul className="nav-links">
                <li><a href="/" className="logo">LBRY
                {/* <img className="navbar-logo" src={Logo} alt="" /> */}
                </a></li>
                <li><a href="book-details">BookDetails</a></li>
                <li><a href="media-details">MediaDetails</a></li>
                <li><a href="device-details">DeviceDetails</a></li>
                <li><a href="search-results">SearchResults</a></li>
                <li class="dropdown">
                <a href="#">Books</a>
                <div class="dropdown-menu">
                    <div class="dropdown-menu-contents">
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
                </div>
                </li>
                <li class="dropdown">
                    <a href="#">Media</a>
                    <div class="dropdown-menu">
                        <div class="dropdown-menu-contents">
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
                    </div>
                </li>
                <li class="dropdown">
                    <a href="#">Devices</a>
                    <div class="dropdown-menu">
                        <div class="dropdown-menu-contents">
                            <div class="category-column">
                                <p>Device Types</p>
                                <a href="#">Laptops</a>
                                <a href="#">Tablets</a>
                                <a href="#">Cameras</a>
                                <a href="#">Headphones</a>
                            </div>

                            <div class="category-column">
                                <p>Operating Systems</p>
                                <a href="#">macOS</a>
                                <a href="#">Windows</a>
                                <a href="#">Linux</a>
                                <a href="#">ChromeOS</a>
                            </div>
                        </div>
                    </div>
                </li>
                <li className="dropdown">
                  <button className="nav-icon">
                    <IoSearch />
                  </button>
                  <div class="dropdown-menu">
                        <div class="dropdown-menu-contents">
                            <div class="category-column">
                                    <IoSearch />
                                <input type="text" class="search-input" placeholder="Search the entire library..." />
                                <p>Quick Links</p>
                                <a href="#">Books</a>
                                <a href="#">Movies</a>
                                <a href="#">Devices</a>
                            </div>
                        </div>
                    </div>
                </li>
                <li className="dropdown">
                  <button className="nav-icon">
                    <IoPersonCircleOutline />
                  </button>
                  <div class="dropdown-menu">
                        <div class="dropdown-menu-contents">
                            <div class="category-column">
                                <p>Profile</p>
                                <a href="login">Log in</a>
                                <a href="#">Your Borrows</a>
                                <a href="#">Your Holds</a>
                                <a href="#">Account</a>
                            </div>
                        </div>
                    </div>
                </li>
                </ul>
            </nav>
        </div>
    );
};

export default Navbar