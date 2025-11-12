import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom'

import "./register.css";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
import Logo from "../../assets/logo-dark.webp"


function Register({ setIsStaff, setIsLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [membershipForm, setMembershipForm] = useState({
    name: '',
    cardNumber: '',
    expDate: '',
    cvv: '',
    billingAddress: '',
  });
  const [signUpLater, setSignUpLater] = useState(false);

  const navigate = useNavigate();

  // Input validation
// Replace your existing 'validate' function with this one
  const validate = () => {
    const e = {};
    const { name, cardNumber, expDate, cvv, billingAddress } = membershipForm;

    // --- User field validation ---
    if (!email.trim()) {
      e.email = "Email is required.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        e.email = "Enter a valid email address.";
      }
    }

    if (!password.trim()) {
      e.password = "Password is required.";
    } else if (password.length < 8 || password.length > 12) {
      e.password = "Password must be 8–12 characters.";
    }

    if (!firstName.trim()) e.firstName = "First name is required.";
    if (!lastName.trim()) e.lastName = "Last name is required.";


    // --- Membership field validation (if not signing up later) ---
    if (!signUpLater) {
      if (!name.trim()) e.name = "Name on card is required.";
      if (!billingAddress.trim()) e.billingAddress = "Billing address is required.";

      // Card Number: 13-16 digits
      if (cardNumber.length < 13 || cardNumber.length > 16) {
        e.cardNumber = 'Card number must be 13-16 digits.';
      }

      // CVV: 3-4 digits
      if (cvv.length < 3 || cvv.length > 4) {
        e.cvv = 'CVV must be 3 or 4 digits.';
      }

      // Expiry Date: Check format and ensure it's not in the past
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expDate)) {
        e.expDate = 'Must be in MM/YY format (e.g., 05/26).';
      } else {
        const [month, year] = expDate.split('/');
        // Get the last day of the expiry month
        const lastDayOfExpiryMonth = new Date(Number(`20${year}`), Number(month), 0);
        const today = new Date();

        if (lastDayOfExpiryMonth < today) {
          e.expDate = 'Card is expired.';
        }
      }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Add this function inside your Register component
  const handleMembershipFormChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // 1. Card Number: Only allow digits, max 16
    if (name === 'cardNumber') {
      processedValue = value.replace(/\D/g, '').slice(0, 16);
    }

    // 2. CVV: Only allow digits, max 4 (for Amex)
    if (name === 'cvv') {
      processedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    // 3. Expiry Date: Format as MM/YY
    if (name === 'expDate') {
      processedValue = value
        .replace(/\D/g, '') // Remove non-digits
        .replace(/(\d{2})(\d)/, '$1/$2') // Add slash after first 2 digits
        .slice(0, 5); // Max 5 chars (MM/YY)
    }

    // Update the form state
    setMembershipForm(prevForm => ({
      ...prevForm,
      [name]: processedValue
    }));

    // Clear the error for this field as the user types
    if (errors[name]) {
      setErrors(prevErrors => ({
        ...prevErrors,
        [name]: null
      }));
    }
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrors({});

    if (!validate()) return;

    console.log("Submitting registration:", { email, password, firstName, lastName, membershipForm, signUpLater });

    try {
      // --- STEP 1: Register the user ---
      // This fetch will now return the token AND user object
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName
        })
      });

      const registerData = await response.json();

      if (!response.ok) {
        alert(registerData.message || 'Registration failed');
        return;
      }
      
      // --- STEP 2: Store login data (token, role, etc.) ---
      // We get this directly from the /api/register response now
      localStorage.setItem('authToken', registerData.token);
      localStorage.setItem('userRole', registerData.user.role);
      localStorage.setItem('userFirstName', registerData.user.firstName);

      // --- STEP 3: If they didn't skip, sign them up for membership ---
      if (!signUpLater) {
        console.log("Registration successful, now signing up for membership...");
        try {
          const token = registerData.token; // Use the token we just received
          
          const membershipResponse = await fetch(`${API_BASE_URL}/api/membership/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(membershipForm)
          });

          if (!membershipResponse.ok) {
            const memError = await membershipResponse.json();
            alert(`Registration was successful, but membership signup failed: ${memError.message}. Please sign up from your profile.`);
          } else {
            console.log("Membership signup successful!");
          }
        } catch (memErr) {
          console.error("Membership signup fetch error:", memErr);
          alert(`Registration was successful, but membership signup failed: ${memErr.message}. Please sign up from your profile.`);
        }
      }
      // --- **** END OF STEP 3 **** ---

      setIsLoggedIn(true);
      setIsStaff(registerData.user.role === 'Staff');

      setTimeout(() => navigate('/', { replace: true }), 0);

    } catch (err) {
      console.error(err);
      alert(err.message || "An error occurred. Please try again.");
    }
  };
  
  return (
    <div className='page-container login-page-container'>
      <div className = "login-page-content">
        <div className='login-form-container fade-in'>
          <h2 className='login-form-title'><img className="logo-image logo-image-medium" src={Logo} alt="" /></h2>
          {successMsg && <div className="notice ok">{successMsg}</div>}
          <div>
            <form className="info-form" onSubmit={handleSubmit} noValidate>
              <input
                id="firstName"
                type="text"
                className="input-field"
                placeholder="First Name"
                maxLength={50}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              {errors.firstName && <p className="error">{errors.firstName}</p>}

              <input
                id="lastName"
                type="text"
                className="input-field"
                placeholder="Last Name"
                maxLength={50}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              {errors.lastName && <p className="error">{errors.lastName}</p>}

              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="Email"
                maxLength={100}
                value={email}
                onChange={(e) => {
                  const val = e.target.value;
                  setEmail(val);
                  if (val.toLowerCase().includes("@lbry")) {
                    setErrors(prev => ({ ...prev, email: "Emails with @lbry domains are not allowed. Contact our support team." }));
                  } else {
                    setErrors(prev => ({ ...prev, email: null }));
                  }
                }}
                required
              />
              {errors.email && <p className="error">{errors.email}</p>}

              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="Password"
                minLength={8}
                maxLength={12}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {errors.password && <p className="error">{errors.password}</p>}

              <div>
                <label className="login-header">Membership Payment Info</label>
                <p className="login-subheader">Student or faculty? Ask our staff for exclusive benefits!</p>
              </div>
              <input
                type="text"
                className="input-field"
                placeholder="Name on Card"
                name="name" // <-- ADD NAME
                value={membershipForm.name}
                onChange={handleMembershipFormChange} // <-- USE NEW HANDLER
                disabled={signUpLater}
              />
              {errors.name && <p className="error">{errors.name}</p>}
              <input
                type="text" // <-- CHANGE TO "text"
                className="input-field"
                placeholder="Card Number"
                name="cardNumber" // <-- ADD NAME
                value={membershipForm.cardNumber}
                onChange={handleMembershipFormChange} // <-- USE NEW HANDLER
                disabled={signUpLater}
              />
              {errors.cardNumber && <p className="error">{errors.cardNumber}</p>}
              <div className="flex">
                <input
                  className="input-field input-field-small"
                  type="text" // <-- CHANGE TO "text"
                  placeholder="Exp Date (MM/YY)"
                  name="expDate" // <-- ADD NAME
                  value={membershipForm.expDate}
                  onChange={handleMembershipFormChange} // <-- USE NEW HANDLER
                  disabled={signUpLater}
                />
                {errors.expDate && <p className="error">{errors.expDate}</p>}
                <input
                  className="input-field input-field-small"
                  type="text" // <-- CHANGE TO "text"
                  placeholder="CVV"
                  name="cvv" // <-- ADD NAME
                  value={membershipForm.cvv}
                  onChange={handleMembershipFormChange} // <-- USE NEW HANDLER
                  disabled={signUpLater}
                />
                {errors.cvv && <p className="error">{errors.cvv}</p>}
              </div>
              <input
                type="text"
                className="input-field"
                placeholder="Billing Address"
                name="billingAddress" // <-- ADD NAME
                value={membershipForm.billingAddress}
                onChange={handleMembershipFormChange} // <-- USE NEW HANDLER
                disabled={signUpLater}
              />
              {errors.billingAddress && <p className="error">{errors.billingAddress}</p>}
              
              <div>
                  <input
                    type="checkbox"
                    id="signUpLater"
                    checked={signUpLater}
                    onChange={(e) => setSignUpLater(e.target.checked)}
                  />
                  <label className="login-subheader" htmlFor="signUpLater">Sign up membership later</label>
              </div>
              <div className="form-group">
                <p>Already have an account? <a className='result-link' href="/login">Log in</a></p>
                <p>
                  By signing up, you agree to our
                  <br />
                  <Link to="https://youtu.be/dQw4w9WgXcQ?si=TZ0DELUisIeT8mZc">
                    Terms of Service & Privacy Policy
                  </Link>
                </p>
              </div>
              <div className="form-group">
                <button type="submit" className='action-button primary-button'>Register</button>
              </div>
            </form>

          </div>
        </div>
        <div className='login-side-text'>
          <h1 className='fade-in-text-from-bottom'>Your Journey Starts Here.</h1>
          <p className='fade-in-text-from-top'>Unlock endless knowledge and discover new ideas.</p>
        </div>
      </div>
    </div>
  );
}

export default Register;