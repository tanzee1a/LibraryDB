import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './homepage.css';

function Homepage() {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (event) => {
    if (event.key === 'Enter' && searchTerm.trim()) {
      event.preventDefault();
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <div>
      <div className="page-container homepage-container">
        <div className="homepage-content">
          <div className="home-title">
            <h1>Search the world's knowledge</h1>
            <p>Access a world of stories, ideas, and innovation — all in one place.</p>
          </div>
          <input
            type="text"
            placeholder="Curiosity starts here..."
            className="search-bar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>
    </div>
  );
}

export default Homepage;