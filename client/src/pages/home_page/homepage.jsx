import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './homepage.css'
import Logo from "../../assets/logo-dark.webp"

function Homepage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('Title'); 
  const [userFirstName, setUserFirstName] = useState(null);
  const navigate = useNavigate();

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

  useEffect(() => {
    setUserFirstName(localStorage.getItem('userFirstName'));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const renderWelcomeMessage = () => {
    if (userFirstName) {
      return (
        <div className="home-title fade-in-text-from-bottom">
          <h1>{getGreeting()}, {userFirstName}!</h1>
          <p>Let’s uncover stories and knowledge worth exploring.</p>
        </div>
    );
    }
    return (
        <div className="home-title fade-in-text-from-bottom">
          <h1>Search the world's knowledge</h1>
          <p>Access a world of stories, ideas, and innovation — all in one place.</p>
        </div>
    );
  }

  return (
    <div>
      <div className="page-container homepage-container">
        <div className="homepage-content">
          <div className="logo-container">
            <img className="logo-image-large fade-in" src={Logo} alt="LBRY Logo" />
          </div>
          {renderWelcomeMessage()}
          <div className="home-search-container fade-in-text-from-top">
            <select 
              className="home-search-type-dropdown" 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="Title">Title</option>
              <option value="Description">Description</option>
              <option value="Manufacturer">Manufacturer</option>
              <option value="Author">Author</option>
              <option value="Director">Director</option>
              <option value="Tag">Tag</option>
            </select>
            <input
              type="text"
              placeholder="Curiosity starts here..."
              className="home-search-bar" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
          {/* --- END MODIFIED --- */}
          
        </div>
      </div>
    </div>
  );
}

export default Homepage;