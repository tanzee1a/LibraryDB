import './navbar.css'
import { IoSearch, IoPersonCircleOutline } from "react-icons/io5"
import sampleData from '../../assets/sample_data.json'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Logo from "../../assets/logo-light.webp"

const Navbar = ({
    isStaff = false, 
    setIsStaff = () => {}, 
    isLoggedIn = false, 
    setIsLoggedIn = () => {},
    onNavigateDashboard = () => {}
  }) => {
    const navigate = useNavigate();
    const filters = sampleData.item_filters;
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (event) => {
        if (event.key === 'Enter' && searchTerm.trim()) {
        event.preventDefault();
        navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    const renderSearchDropdown = () => {
        return (
            <li className="dropdown">
                <button className="nav-icon"><IoSearch /></button>
                <div className="dropdown-menu">
                        <div className="dropdown-menu-contents">
                            <div className="category-column">
                                    <IoSearch />
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="Search the entire library..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={handleSearch}
                                />
                                <p>Quick Links</p>
                                <Link to="/search?category=BOOK">Books</Link>
                                <Link to="/search?category=MOVIE">Movies</Link>
                                <Link to="/search?category=DEVICE">Devices</Link>
                            </div>
                        </div>
                    </div>
            </li>
        );
    }

    // --- 1. GUEST NAVBAR (NOT LOGGED IN) ---
    const guestNavbar = () => {
        return (
            <nav className="nav">
                <ul className="nav-links">
                    <li><a href="/" className="logo"><img className="logo-image logo-image-small" src={Logo} alt="" />LBRY</a></li>
                    {/* Minimal Category Dropdowns */}
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
                    {/* Search Dropdown */}
                    {renderSearchDropdown()}
                    {/* Login/Register Links */}
                    <li className="dropdown">
                        <button className="nav-icon"><IoPersonCircleOutline /></button>
                        <div className="dropdown-menu">
                            <div className="dropdown-menu-contents">
                                <div className="category-column">
                                    <p>Access</p>
                                    <Link to="/login">Login</Link>
                                    <Link to="/register">Register</Link>
                                </div>
                            </div>
                        </div>
                    </li>
                </ul>
            </nav>
        );
    }


    const userNavbar = () => {
        const handleNavToSection = (sectionKey) => {
            if (window.location.pathname === '/account') {
                // If already on the account page, change the internal state
                onNavigateDashboard(sectionKey);
            } else {
                // If on another page, navigate to the account page first
                navigate(`/account?section=${sectionKey}`); // Optional: use query param for clean redirect
            }
        };
        return (
            <nav className="nav">
                <ul className="nav-links">
                <li><a href="/" className="logo"><img className="logo-image logo-image-small" src={Logo} alt="" />LBRY</a></li>
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
                {renderSearchDropdown()}
                <li className="dropdown">
                <button className="nav-icon">
                    <IoPersonCircleOutline />
                </button>
                <div className="dropdown-menu">
                        <div className="dropdown-menu-contents">
                            <div className="category-column">
                            <p>Profile</p>
                            {/* FIX APPLIED HERE: Using && for conditional rendering */}
                            {isLoggedIn && (
                                <a
                                    href="#"
                                        onClick={(e) => {
                                        e.preventDefault(); // 🛑 Critical Fix: Prevents browser race condition
                                        localStorage.removeItem('authToken');
                                        localStorage.removeItem('userRole');
                                        setIsStaff(false);
                                        setIsLoggedIn(false); 
                                        navigate('/login');                                    
                                    }}
                                >
                                Log out
                                </a>
                            )}
                            <a 
                                href="/account"
                                onClick={(e) => {
                                    e.preventDefault(); 
                                    handleNavToSection('loans'); // Navigate to the 'loans' section
                                }}
                            >
                            Your Loans
                            </a>
                            <a 
                                href="/account"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleNavToSection('wishlist'); // Navigate to the 'wishlist' section
                                }}
                            >
                            Your Holds
                            </a>
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
            <li><a href="/" className="logo"><img className="logo-image logo-image-small" src={Logo} alt="" />LBRY</a></li>
            <li><a href="/manage-users">Users</a></li>
            <li><a href="/search">Items</a></li>
            <li><a href="/manage-borrows">Borrows</a></li>
            <li><a href="/manage-holds">Holds</a></li>
            <li><a href="/manage-fines">Fines</a></li>
            {renderSearchDropdown()}
            <li className="dropdown">
            <button className="nav-icon">
                <IoPersonCircleOutline />
            </button>
            <div className="dropdown-menu">
                    <div className="dropdown-menu-contents">
                        <div className="category-column">
                            <p>Profile</p>
                            {/* FIX APPLIED HERE: Using && for conditional rendering */}
                            {isLoggedIn && (
                                <a
                                    href="#"
                                        onClick={(e) => {
                                        e.preventDefault(); // 🛑 Critical Fix: Prevents browser race condition
                                        localStorage.removeItem('authToken');
                                        localStorage.removeItem('userRole');
                                        localStorage.removeItem('userFirstName');
                                        setIsStaff(false);
                                        setIsLoggedIn(false); 
                                        navigate('/login');; 
                                    }}
                                >
                                Log out
                                </a>
                            )}
                            <a href="/staff_page">Dashboard</a>
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
        {
          isLoggedIn
            ? (isStaff ? staffNavbar() : userNavbar())
            : guestNavbar()
        }
      </div>
    );
};

export default Navbar