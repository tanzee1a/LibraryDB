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

  const handleFocus = () => {
    setTimeout(() => {
      setShowPrimary(false);
      setShowSecondary(true);
    }, 2000);
  };

  const handleBlur = () => {
    setShowSecondary(false);
    setShowPrimary(true);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const renderWelcomeMessage = () => {
    if (userProfile.firstName) {
      return (
        <div className="home-title fade-in-text-from-bottom">
          <h1>{getGreeting()}, {userProfile.firstName}!</h1>
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

  const renderActionButton = () => {
    console.log("User Profile:", userProfile);
    if (userProfile.is_suspended) {
      return (
        <div className="home-action-section fade-in">
          <button className="red-button" onClick={() => navigate('/account?section=fines')}>Go to Fines</button>
          <p>Your account is suspended due to too many outstanding fines. Please pay off your fines to regain access.</p>
        </div>
      );
    }

    if (!userProfile.firstName) {
      return (
        <div className="home-action-section fade-in">
          <button className="primary-button" onClick={() => navigate('/pricing')}>Get Started</button>
          <p>Ready to explore? Let's begin.</p>
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
                onFocus={handleFocus}
                onBlur={handleBlur}
                className="home-search-bar"
              />

              <span className={`fake-placeholder1 ${(showPrimary && searchTerm === '') ? 'show' : ''}`}>
                Curiosity starts here...
              </span>

              <span className={`fake-placeholder2 ${(showSecondary && searchTerm === '') ? 'show' : ''}`}>
                Don’t know where to start? Press Enter to browse everything.
              </span>
            </div>
          </div>
          <div>
          {renderActionButton()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Homepage;