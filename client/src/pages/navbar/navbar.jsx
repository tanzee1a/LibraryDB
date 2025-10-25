import './navbar.css'
import { IoSearch, IoPersonCircleOutline } from "react-icons/io5"
import sampleData from '../../assets/sample_data.json'
import { Link } from 'react-router-dom';

const Navbar = ({ isStaff, setIsStaff }) => {
    const filters = sampleData.item_filters;

    const userNavbar = () => {
        return (
            <nav className="nav">
                <ul className="nav-links">
                <li><a href="/" className="logo">LBRY
                {/* <img className="navbar-logo" src={Logo} alt="" /> */}
                </a></li>
                <li><a href="/item">ItemDetails</a></li>
                <li><a href="/search">SearchResults</a></li>
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
                                <a href="/login">Log in</a>
                                <a href="#">Your Borrows</a>
                                <a href="#">Your Holds</a>
                                <a href="/account">Account</a>
                            </div>
                        </div>
                    </div>
                </li>
                </ul>
            </nav>
        )
    }

    const staffNavbar = () => {
        return (
            <nav className="nav">
                <ul className="nav-links">
                <li><a href="/" className="logo">LBRY
                {/* <img className="navbar-logo" src={Logo} alt="" /> */}
                </a></li>
                <li><a href="/manage-users">Users</a></li>
                <li><a href="/search">Items</a></li>
                <li><a href="/manage-holds">Holds</a></li>
                <li><a href="/manage-fines">Fines</a></li>
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
                                <a href="/login">Log in</a>
                                <a href="#">Your Borrows</a>
                                <a href="#">Your Holds</a>
                                <a href="#">Account</a>
                            </div>
                        </div>
                    </div>
                </li>
                </ul>
            </nav>
        )
    }

    return (
      <div className="nav-container">
        <button
            className="toggle-role-btn"
            onClick={() => setIsStaff(prev => !prev)}
            >
            Switch to {isStaff ? 'User' : 'Staff'} Mode
        </button>
        {isStaff ? staffNavbar() : userNavbar()}
      </div>
    );
};

export default Navbar