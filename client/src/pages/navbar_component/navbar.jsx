import './navbar.css'

const Navbar = () => {
    return (
        <div className="nav-container">
            <nav className="nav">
                <ul className="nav-links">
                <li><a href="/" className="logo">LBRY
                {/* <img className="navbar-logo" src={Logo} alt="" /> */}
                </a></li>
                <li><a href="item-details">Item Details (2BR)</a></li>
                <li><a href="catalog">Catalog</a></li>
                <li><a href="login">Login</a></li>
                <li><a href="account">Profile</a></li>
                </ul>
            </nav>
        </div>
    );
};

export default Navbar