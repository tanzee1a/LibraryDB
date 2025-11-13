import { Link } from 'react-router-dom'
import './pricing.css'

import Logo from "../../assets/logo-dark.webp"
import { BsPeopleFill } from "react-icons/bs";
import { FaGraduationCap, FaSchool } from "react-icons/fa";
import { FaStar } from "react-icons/fa6";

function Pricing() {
    const tiers = [
        { icon: <BsPeopleFill />, name: 'Guest', price: 'Free', borrowLimits: 0 },
        { icon: <FaStar />, name: 'Patron', price: '$10', borrowLimits: 10, monthly: true },
        { icon: <FaGraduationCap />, name: 'Student', price: 'Free*', borrowLimits: 10, },
        { icon: <FaSchool />, name: 'Faculty', price: 'Free*', borrowLimits: 25, },
    ]

    const renderTierFooter = (tier) => {
        switch (tier.name) {
            case 'Guest':
                return (
                    <Link to="/search">
                        <button className="tier-button secondary-button">Browse</button>
                    </Link>
                );
            case 'Patron':
                return (
                    <Link to="/register">
                        <button className="tier-button primary-button">Get Started</button>
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
        <div>
            <div className="page-container pricing-page-container">
                <div className="pricing-content">
                    <div className="logo-container">
                    <img className="logo-image-large fade-in" src={Logo} alt="LBRY Logo" />
                    </div>

                    <div className="home-title fade-in-text-from-bottom">
                    <h1>Join us. Be you.</h1>
                    <p>Your membership. Your pace. Your possibilities.</p>
                    </div>
                    <div className="fade-in-text-from-top">
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
        </div>
    );
}

export default Pricing;