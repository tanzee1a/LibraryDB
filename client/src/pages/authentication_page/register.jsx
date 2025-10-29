import React, { useState } from "react";
import { Link } from 'react-router-dom'
import "./register.css";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

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

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrors({});

    if (!validate()) return;

    try {
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

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg("Registration successful! You can now log in.");
        setEmail("");
        setPassword("");
        setFirstName("");
        setLastName("");
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to server");
    }
  };

  return (
    <div className='page-container login-page-container'>
      <div className = "login-page-content">
        <div className='login-form-container fade-in'>
          <h2 className='login-form-title'>LBRY</h2>
          {successMsg && <div className="notice ok">{successMsg}</div>}
          <div className = "login-form">
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  maxLength={50}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <label htmlFor="firstName">First Name</label>
                {errors.firstName && <div className="error">{errors.firstName}</div>}
              </div>
              <div className="form-group">
                <input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  maxLength={50}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <label htmlFor="lastName">Last Name</label>
                {errors.lastName && <div className="error">{errors.lastName}</div>}
              </div>
              <div className="form-group">
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  maxLength={100}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label htmlFor="email">Email</label>
                {errors.email && <div className="error">{errors.email}</div>}
              </div>
              <div className="form-group">
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  minLength={8}
                  maxLength={12}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <label htmlFor="password">Password</label>
                {errors.password && <div className="error">{errors.password}</div>}
              </div>
              <div className="form-group">
                <p>Already have an account? <a className='result-link' href="/login">Log in</a></p>
              </div>
              <div className="form-group">
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
        <div className='login-side-text fade-in-text-from-bottom'>
          <h1>Your Journey Starts Here.</h1>
          <p>Unlock endless knowledge and discover new ideas.</p>
        </div>
      </div>
    </div>
  );
}
