import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './homepage.css'
import Logo from "../../assets/logo-dark.webp"
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function Homepage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('Title');
  const [userProfile, setUserProfile] = useState({});
  const [showPrimary, setShowPrimary] = useState(true);   // fake-placeholder1
  const [showSecondary, setShowSecondary] = useState(false); // fake-placeholder2
  const [isFocused, setIsFocused] = useState(false);
  const [popularItems, setPopularItems] = useState([]);
  const [popularGenres, setPopularGenres] = useState([]);
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE_URL}/api/recommendations/popular-items`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        if (res.ok) {
          const data = await res.json();
          console.log("Fetched popular items:", data);
          setPopularItems(data);
        }
      } catch (err) {
        console.error("Error fetching popular items:", err);
      }
    };
    fetchPopular();

    const fetchPopularGenres = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/recommendations/popular-genres`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (res.ok) {
          const data = await res.json();
          console.log("Fetched popular genres:", data);
          setPopularGenres(data);
        }
      } catch (err) {
        console.error("Error fetching popular genres:", err);
      }
    };
    fetchPopularGenres();
  }, []);
  const navigate = useNavigate();

  const handleSearch = (event) => {
     if (event.key === 'Enter') {
            event.preventDefault();
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
    setUserProfile({firstName: localStorage.getItem('userFirstName') || null});
    const token = localStorage.getItem('authToken');
        if (token) {
            const fetchUserProfile = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/my-profile`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
    
                    if (response.ok) {
                        const data = await response.json();
                        setUserProfile({
                            firstName: data.firstName,
                            is_suspended: data.is_suspended,
                            requires_membership: data.requires_membership_fee,
                            membership_status: data.membership_status
                        });
                    } else {
                        setUserProfile({ is_suspended: false, total_fines: 0.00 });
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                }
            };
    
            fetchUserProfile();
        } 
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const offset = -window.scrollY * 0.3;
      document.documentElement.style.setProperty('--parallax-offset', `${offset}px`);
    };

    window.addEventListener("scroll", handleScroll);

    const timer = setTimeout(() => {
      if (!isFocused && searchTerm === '') {
        setShowPrimary(false);
        setShowSecondary(true);
      }
    }, 10 * 1000);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timer);
    };
  }, [isFocused, searchTerm]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const renderWelcomeMessage = () => {
    if (userProfile.firstName) {
      return (
        <div className="home-title fade-in">
          <h1>{getGreeting()}, {userProfile.firstName}!</h1>
          <p>Let’s uncover stories and knowledge worth exploring.</p>
        </div>
    );
    }

    return (
        <div className="home-title fade-in">
          <h1>Search the world's knowledge</h1>
          <p>Access a world of stories, ideas, and innovation - all in one place.</p>
        </div>
    );
  }

  const renderActionButton = () => {
    if (!userProfile.firstName) {
      return (
        <div className="home-action-section fade-in">
          <button className="primary-button" onClick={() => navigate('/pricing')}>Get Started</button>
          <p>Ready to explore? Let's begin.</p>
        </div>
      );
    }
    if (userProfile.is_suspended) {
      return (
        <div className="home-action-section fade-in">
          <button className="red-button" onClick={() => navigate('/account?section=fines')}>Go to Fines</button>
          <p>Your account is suspended due to too many outstanding fines. Please pay off your fines to regain access.</p>
        </div>
      );
    }

    switch(userProfile.membership_status) {
      case 'new':
        return (
          <div className="home-action-section fade-in">
            <button className="primary-button" onClick={() => navigate('/account?section=profile')}>Complete Registration</button>
            <p>We’re excited to have you on board. Let's get your account ready to go.</p>
          </div>
        );
      case 'expired':
        return (
          <div className="home-action-section fade-in">
            <button className="primary-button" onClick={() => navigate('/pricing')}>Reactivate Membership</button>
            <p>Bring your membership back and continue exploring.</p>
          </div>
        );
      case 'canceled':
        return (
          <div className="home-action-section fade-in">
            <button className="secondary-button" onClick={() => navigate('/pricing')}>Reactivate Membership</button>
            <p>Keep your access uninterrupted—reactivate today.</p>
          </div>
        );
      default:
        break;
    }
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
              <option value="Description">By All</option>
              <option value="Manufacturer">Manufacturer</option>
              <option value="Author">Author</option>
              <option value="Director">Director</option>
              <option value="Tag">Tag</option>
            </select>
            <div className="search-wrapper">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearch}
                className="home-search-bar"
              />

              <span className={`fake-placeholder1 ${(showPrimary && searchTerm === '') ? 'show' : ''}`}>
                Curiosity starts here...
              </span>

              <span className={`fake-placeholder2 ${(showSecondary && searchTerm === '') ? 'show' : ''}`}>
                Don’t know where to start? Click here & press Enter to browse everything.
              </span>
            </div>
          </div>
          <div>
          <div className="home-action-wrapper">
            {renderActionButton()}
          </div>
          </div>
          <div className="popular-section">
          <h2 className="popular-title fade-in-delay">Popular & Trending</h2>
          <div className="popular-wrapper fade-in-text-from-bottom-far">
            <div className="popular-grid">
              {popularItems.slice(0, 5).map((item) => (
                <a
                  key={item.item_id}
                  className="popular-card"
                  href={`/item/${item.item_id}`}
                >
                  <img src={item.thumbnail_url} alt={item.item_name} className="popular-thumb" />
                  <div className="popular-item-title">{item.item_name}</div>
                  <p className="popular-item-creator">{item.item_creator}</p>
                </a>
              ))}
            </div>

            <div className="popular-genre-section">
              <div className="genre-scroller">
                <div className="genre-track">
                  {popularGenres.map((g, idx) => (
                    <a
                      key={idx}
                      className="genre-pill"
                      href={`/search?tag=${encodeURIComponent(g.genre_name)}`}
                    >
                      {g.genre_name}
                    </a>
                  ))}
                  {popularGenres.map((g, idx) => (
                    <a
                      key={`dup-${idx}`}
                      className="genre-pill"
                      href={`/search?tag=${encodeURIComponent(g.genre_name)}`}
                    >
                      {g.genre_name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

export default Homepage;