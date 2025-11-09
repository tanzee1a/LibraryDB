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
                    <li><a href="/search" className="logo">Browse</a></li>

                    <li><Link to="/search?category=BOOK">Books</Link></li>
                    <li><Link to="/search?category=MOVIE">Movies</Link></li>
                    <li><Link to="/search?category=DEVICE">Devices</Link></li>

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
                <li><a href="/search" className="logo">Browse</a></li>
                
                <li><Link to="/search?category=BOOK">Books</Link></li>
                <li><Link to="/search?category=MOVIE">Movies</Link></li>
                <li><Link to="/search?category=DEVICE">Devices</Link></li>

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
        // 1. Retrieve the role from localStorage
        const staffRole = localStorage.getItem('staffRole');
        
        // 2. Define visibility flag: TRUE for Librarian and Assistant Librarian
        // This variable controls the links that are NOT available to the Clerk.
        const isLibrarianRole = staffRole === 'Librarian' || staffRole === 'Assistant Librarian';

        return (
            <nav className="nav">
                <ul className="nav-links">
                <li><a href="/" className="logo"><img className="logo-image logo-image-small" src={Logo} alt="LBRY Logo" />LBRY</a></li>
                
                {/* These links are hidden from CLERKS by checking if the user
                  is a Librarian or Assistant Librarian. 
                */}
                {isLibrarianRole && <li><a href="/manage-users">Users</a></li>}
                {isLibrarianRole && <li><a href="/search">Items</a></li>}
                
                {/* These links are the CORE access points and are visible 
                  to ALL staff, including Clerks.
                */}
                <li><a href="/manage-borrows">Borrows</a></li>
                <li><a href="/manage-holds">Holds</a></li>
                
                {/* This link is hidden from CLERKS.
                */}
                {isLibrarianRole && <li><a href="/manage-fines">Fines</a></li>}

                {renderSearchDropdown()}
                <li className="dropdown">
                <button className="nav-icon">
                    <IoPersonCircleOutline />
                </button>
                <div className="dropdown-menu">
                        <div className="dropdown-menu-contents">
                            <div className="category-column">
                                <p>Profile</p>
                                {/* ... (Logout logic remains the same) ... */}
                                {isLoggedIn && (
                                    <a
                                        href="#"
                                            onClick={(e) => {
                                            e.preventDefault(); 
                                            localStorage.removeItem('authToken');
                                            localStorage.removeItem('userRole');
                                            localStorage.removeItem('userFirstName');
                                            setIsStaff(false);
                                            setIsLoggedIn(false); 
                                            navigate('/login');
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