import './navbar.css'
import { IoSearch, IoPersonCircleOutline } from "react-icons/io5"
import sampleData from '../../assets/sample_data.json'
const Navbar = () => {
    const filters = sampleData.filters;
    return (
        <div className="nav-container">
            <nav className="nav">
                <ul className="nav-links">
                <li><a href="/" className="logo">LBRY
                {/* <img className="navbar-logo" src={Logo} alt="" /> */}
                </a></li>
                <li><a href="item-details">ItemDetails</a></li>
                <li><a href="search-results">SearchResults</a></li>
                {filters.map(filter => (
                  <li key={filter.category} className="dropdown">
                    <a href="#">{filter.category}</a>
                    <div className="dropdown-menu">
                      <div className="dropdown-menu-contents">
                        {filter.topics.map(topic => (
                          <div key={topic.name} className="category-column">
                            <p>{topic.name}</p>
                            {topic.options.map(option => (
                              <a key={option} href="#">{option}</a>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
                <li className="dropdown">
                  <button className="nav-icon">
                    <IoSearch />
                  </button>
                  <div className="dropdown-menu">
                        <div className="dropdown-menu-contents">
                            <div className="category-column">
                                    <IoSearch />
                                <input type="text" className="search-input" placeholder="Search the entire library..." />
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
                  <div className="dropdown-menu">
                        <div className="dropdown-menu-contents">
                            <div className="category-column">
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