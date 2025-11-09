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
  const validate = () => {
    const e = {};

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

    if (!signUpLater) {
      if (!membershipForm.name.trim()) e.name = "Name on card is required.";
      if (!membershipForm.cardNumber.trim()) e.cardNumber = "Card number is required.";
      if (!membershipForm.expDate.trim()) e.expDate = "Expiration date is required.";
      if (!membershipForm.cvv.trim()) e.cvv = "CVV is required.";
      if (!membershipForm.billingAddress.trim()) e.billingAddress = "Billing address is required.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrors({});

    if (!validate()) return;

    console.log("Submitting registration:", { email, password, firstName, lastName, membershipForm, signUpLater });

    try {
      // --- STEP 1: Register the user ---
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

      if (!response.ok) {
        const data = await response.json();
        alert(data.message);
        return;
      }

      // --- STEP 2: Auto-login to get the new token ---
      const loginResponse = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const loginData = await loginResponse.json();
      console.log('Login response data:', loginData);

      if (!loginResponse.ok) {
        const loginErrorMsg = loginData?.message || "Auto-login failed. Please log in manually.";
        console.error('Auto-login failed:', loginErrorMsg);
        alert(loginErrorMsg);
        return; // Stop if auto-login fails
      }

      // --- STEP 3: Store login data (token, role, etc.) ---
      localStorage.setItem('authToken', loginData.token);
      localStorage.setItem('userRole', loginData.user.role);
      localStorage.setItem('userFirstName', loginData.user.firstName);

      // --- **** NEW LOGIC **** ---
      // --- STEP 4: If they didn't skip, sign them up for membership ---
      if (!signUpLater) {
        console.log("Auto-login successful, now signing up for membership...");
        try {
          const token = loginData.token; // Use the token we just received
          
          const membershipResponse = await fetch(`${API_BASE_URL}/api/membership/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}` // Authorize with the new token
            },
            body: JSON.stringify(membershipForm) // Send the payment details
          });

          if (!membershipResponse.ok) {
            // Don't stop the whole login, just warn them
            const memError = await membershipResponse.json();
            alert(`Registration was successful, but membership signup failed: ${memError.message}. Please sign up from your profile.`);
          } else {
            console.log("Membership signup successful!");
          }
        } catch (memErr) {
          // Handle fetch error for membership
          console.error("Membership signup fetch error:", memErr);
          alert(`Registration was successful, but membership signup failed: ${memErr.message}. Please sign up from your profile.`);
        }
      }
      // --- **** END OF NEW LOGIC **** ---


      // --- STEP 5: Navigate to homepage (this now happens last) ---
      navigate('/', { replace: true });

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
              {errors.firstName && <div className="error">{errors.firstName}</div>}

              <input
                id="lastName"
                type="text"
                className="input-field"
                placeholder="Last Name"
                maxLength={50}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              {errors.lastName && <div className="error">{errors.lastName}</div>}

              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="Email"
                maxLength={100}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {errors.email && <div className="error">{errors.email}</div>}

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
              {errors.password && <div className="error">{errors.password}</div>}

              <div>
                <label className="login-header">Membership Payment Info</label>
                <p className="login-subheader">Eligible members can checkout items at no cost!</p>
              </div>
              <input
                type="text"
                className="input-field"
                placeholder="Name on Card"
                value={membershipForm.name}
                onChange={(e) => setMembershipForm({ ...membershipForm, name: e.target.value })}
                disabled={signUpLater}
              />
              {errors.name && <div className="error">{errors.name}</div>}
              <input
                type="text"
                className="input-field"
                placeholder="Card Number"
                value={membershipForm.cardNumber}
                onChange={(e) => setMembershipForm({ ...membershipForm, cardNumber: e.target.value })}
                disabled={signUpLater}
              />
              {errors.cardNumber && <div className="error">{errors.cardNumber}</div>}
              <div className="flex">
                <input
                  className="input-field input-field-small"
                  type="text"
                  placeholder="Exp Date (MM/YY)"
                  value={membershipForm.expDate}
                  onChange={(e) => setMembershipForm({ ...membershipForm, expDate: e.target.value })}
                  disabled={signUpLater}
                />
                {errors.expDate && <div className="error">{errors.expDate}</div>}
                <input
                  className="input-field input-field-small"
                  type="text"
                  placeholder="CVV"
                  value={membershipForm.cvv}
                  onChange={(e) => setMembershipForm({ ...membershipForm, cvv: e.target.value })}
                  disabled={signUpLater}
                />
                {errors.cvv && <div className="error">{errors.cvv}</div>}
              </div>
              <input
                type="text"
                className="input-field"
                placeholder="Billing Address"
                value={membershipForm.billingAddress}
                onChange={(e) => setMembershipForm({ ...membershipForm, billingAddress: e.target.value })}
                disabled={signUpLater}
              />
              {errors.billingAddress && <div className="error">{errors.billingAddress}</div>}
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