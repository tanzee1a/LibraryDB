import { Link } from "react-router-dom";
import "./footer.css";

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Contact Us</h4>
          <p><a href="tel:1-800-THE-LBRY">1-800-THE-LBRY</a></p>
          <p><a href="mailto:support@lbry.com">support@lbry.com</a></p>
        </div>

        <div className="footer-section">
          <h4>Operating Hours</h4>
          <p>Mon–Fri: 8:00 AM – 8:00 PM</p>
          <p>Sat–Sun: 10:00 AM – 6:00 PM</p>
        </div>

        <div className="footer-section">
          <h4>Our Location</h4>
          <p>1 Knowledge Pkwy</p>
          <p>Houston, TX 77001</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>Copyright &copy; {new Date().getFullYear()} LBRY Corp. All rights reserved.</p>
        <Link to="https://youtu.be/dQw4w9WgXcQ?si=TZ0DELUisIeT8mZc">Privacy Policy</Link>
        <Link to="https://youtu.be/dQw4w9WgXcQ?si=TZ0DELUisIeT8mZc">Terms of Service</Link>
        <Link to="https://youtu.be/dQw4w9WgXcQ?si=TZ0DELUisIeT8mZc">Legal</Link>
      </div>
    </footer>
  );
};

export default Footer;