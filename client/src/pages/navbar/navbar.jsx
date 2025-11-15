import './navbar.css'
import { IoSearch, IoPersonCircleOutline } from "react-icons/io5"
import { FaBell } from "react-icons/fa6"
import sampleData from '../../assets/sample_data.json'
import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import Logo from "../../assets/logo-light.webp"

const Navbar = ({
    isStaff = false, 
    setIsStaff = () => {}, 
    isLoggedIn = false, 
    setIsLoggedIn = () => {},
    onNavigateDashboard = () => {},
    unreadCount = 0
  }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState('Title');
    const userFirstName = localStorage.getItem('userFirstName') || '';
    const filters = sampleData.item_filters;

    const handleSearch = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default form submission
            const term = searchTerm.trim();
            if (term) {
                // If there is a term, search with it and the type
                navigate(`/search?q=${encodeURIComponent(term)}&searchType=${searchType}`);
            } else {
                // If the bar is blank, just go to the search page
                navigate(`/search`);
            }
        }
    };

    const renderSearchDropdown = () => {
        return (
            <li className="dropdown">
                <button className="nav-icon"><IoSearch /></button>
                <div className="dropdown-menu">
                        <div className="dropdown-menu-contents">
                            <div className="category-column">
                                <div className="nav-search-container">
                                    <select
                                        className="nav-search-type-dropdown"
                                        value={searchType}
                                        onChange={(e) => setSearchType(e.target.value)}
                                    >
                                        <option value="Title">Title</option>
                                        <option value="Description">By All</option>
                                        <option value="Manufacturer">Manufacturer</option>
                                        <option value="Author">Author</option>
                                        <option value="Director">Director</option>
                                        <option value="Tag">Tag</option>
                                    </select>
                                    <input
                                        type="text"
                                        className="nav-search-input" 
                                        placeholder="Search the entire library..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={handleSearch}
                                    />
                                </div>

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

    // GUEST NAVBAR (NOT LOGGED IN)
    const guestNavbar = () => {
        return (
            <nav className="nav">
                <ul className="nav-links">
                    <li><a href="/" className="logo"><img className="logo-image logo-image-small" src={Logo} alt="" />LBRY</a></li>
                    <li><a href="/search" className="logo">Browse</a></li>
                    <li><a href="/pricing" className="logo">Pricing</a></li>
                    {filters.map(filter => (
                    <li key={filter.category} className="dropdown">
                        <a href={`/search?category=${encodeURIComponent(filter.raw_category)}`}>{filter.category}</a>
                        <div className="dropdown-menu">
                        <div className="dropdown-menu-contents">
                            {filter.topics.map(topic => (
                            <div key={topic.name} className="category-column">
                                <p>{topic.name}</p>
                                {topic.options.map(option => (
                                <a key={option} href={`/search?tag=${encodeURIComponent(option)}`}>{option}</a>
                                ))}
                            </div>
                            ))}
                        </div>
                        </div>
                    </li>
                    ))}
                    {renderSearchDropdown()}
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

    // USER NAVBAR (LOGGED IN AS REGULAR USER)
    const userNavbar = () => {
        const handleNavToSection = (sectionKey) => {
            if (window.location.pathname === '/account') {
                // If already on the account page, change the internal state
                onNavigateDashboard(sectionKey);
            } else {
                // If on another page, navigate to the account page first
                navigate(`/account?section=${sectionKey}`); 
            }
        };
        return (
            <nav className="nav">
                <ul className="nav-links">
                <li><a href="/" className="logo"><img className="logo-image logo-image-small" src={Logo} alt="" />LBRY</a></li>
                <li><a href="/search" className="logo">Browse</a></li>
                {filters.map(filter => (
                <li key={filter.category} className="dropdown">
                    <a href={`/search?category=${encodeURIComponent(filter.raw_category)}`}>{filter.category}</a>
                    <div className="dropdown-menu">
                    <div className="dropdown-menu-contents">
                        {filter.topics.map(topic => (
                        <div key={topic.name} className="category-column">
                            <p>{topic.name}</p>
                            {topic.options.map(option => (
                            <a key={option} href={`/search?tag=${encodeURIComponent(option)}`}>{option}</a>
                            ))}
                        </div>
                        ))}
                    </div>
                    </div>
                </li>
                ))}
                <li className="notification-icon">
                    <Link to="/account/?section=notifications">
                        <FaBell />
                        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                    </Link>
                </li>
                {renderSearchDropdown()}
                <li className="dropdown">
                <button 
                    className="nav-icon profile-container"
                    onClick={() => navigate('/account')}
                >
                    <IoPersonCircleOutline />
                    {userFirstName && <span className="profile-name">{userFirstName}</span>}
                </button>
                <div className="dropdown-menu">
                        <div className="dropdown-menu-contents">
                            <div className="category-column">
                            <p>Profile</p>
                            {isLoggedIn && (
                                <a
                                    href="#"
                                        onClick={(e) => {
                                        e.preventDefault(); 
                                        localStorage.removeItem('authToken');
                                        localStorage.removeItem('userRole');
                                        localStorage.removeItem('staffRole');
                                        localStorage.removeItem('userFirstName');
                                        localStorage.removeItem('userId');
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
                                    handleNavToSection('loans'); 
                                }}
                            >
                            Your Loans
                            </a>
                            <a 
                                href="/account"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleNavToSection('holds'); 
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
        const staffRole = localStorage.getItem('staffRole');
        
        const isLibrarianRole = staffRole === 'Librarian' || staffRole === 'Assistant Librarian';

        return (
            <nav className="nav">
                <ul className="nav-links">
                <li><a href="/" className="logo"><img className="logo-image logo-image-small" src={Logo} alt="LBRY Logo" />LBRY</a></li>
                
                {/* these links are hidden from clerks */}
                {isLibrarianRole && <li><a href="/manage-users">Users</a></li>}
                {isLibrarianRole && <li><a href="/search">Items</a></li>}
                
                {/* visible to all staff */}
                <li><a href="/manage-borrows">Borrows</a></li>
                <li><a href="/manage-holds">Holds</a></li>
                
                {/* This link is hidden from clerks */}
                {isLibrarianRole && <li><a href="/manage-fines">Fines</a></li>}

                {renderSearchDropdown()}
                <li className="notification-icon">
                    <Link to="/notifications">
                        <FaBell />
                        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                    </Link>
                </li>
                <li className="dropdown">
                <button 
                    className="nav-icon profile-container"
                    onClick={() => navigate('/account')}
                >
                    <IoPersonCircleOutline />
                    {userFirstName && <span className="profile-name">{userFirstName}</span>}
                </button>
                <div className="dropdown-menu">
                        <div className="dropdown-menu-contents">
                            <div className="category-column">
                                <p>Profile</p>
                                {isLoggedIn && (
                                    <a
                                        href="#"
                                            onClick={(e) => {
                                            e.preventDefault(); 
                                            localStorage.removeItem('authToken');
                                            localStorage.removeItem('userRole');
                                            localStorage.removeItem('staffRole');
                                            localStorage.removeItem('userFirstName');
                                            localStorage.removeItem('userId');
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