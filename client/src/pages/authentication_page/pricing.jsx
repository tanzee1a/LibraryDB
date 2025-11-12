import { Link } from 'react-router-dom'
import './pricing.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
import Logo from "../../assets/logo-dark.webp"
import { BsPeopleFill } from "react-icons/bs";
import { FaTicket } from "react-icons/fa6";
import { FaGraduationCap, FaSchool } from "react-icons/fa";

function Pricing({ setIsStaff, setIsLoggedIn }) {
    const tiers = [
        { icon: <BsPeopleFill />, name: 'Guest', price: 'Free', borrowLimits: 0 },
        { icon: <FaTicket />, name: 'Patron', price: '$10', borrowLimits: 5, monthly: true },
        { icon: <FaGraduationCap />, name: 'Student', price: 'Free*', borrowLimits: 10, },
        { icon: <FaSchool />, name: 'Faculty', price: 'Free*', borrowLimits: 25, },
    ]

    const renderTierFooter = (tier) => {
        switch (tier.name) {
            case 'Guest':
                return (
                    <Link to="/search">
                        <button className="tier-button">Browse</button>
                    </Link>
                );
            case 'Patron':
                return (
                    <Link to="/register">
                        <button className="tier-button">Get Started</button>
                    </Link>
                );
            case 'Student':
            case 'Faculty':
                return (
                    <p className="tier-note">*See our staff for details.</p>
                );
            default:
                return null;
        }
    }



    return (
        <div className='page-container login-page-container'>
        <div className = "login-page-content">
            <div className='login-side-text'>
            <div className="pricing-table">
                {tiers.map((tier) => (
                    <div key={tier.name} className="tier-card">
                        <div className="tier-icon">
                            {tier.icon}
                        </div>
                        <div className="tier-name">{tier.name}</div>
                        <div className="tier-price">
                            {tier.price}{tier.monthly ? '/month' : ''}
                        </div>
                        <div className="tier-limit">
                            {tier.borrowLimits === 0 ? '-' : `Borrow up to ${tier.borrowLimits} items`}
                        </div>
                        {renderTierFooter(tier)}
                    </div>
                ))}
            </div>
            </div>
        </div>
        </div>
    );
}

export default Pricing;