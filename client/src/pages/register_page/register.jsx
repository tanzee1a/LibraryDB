import React, { useState } from "react";
import Navbar from "../navbar/navbar";
import "./register.css";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; 
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
      const response = await fetch("${API_BASE_URL}/api/register", {
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
    <div>
      <div className="register-page-container">
        <form className="auth-wrapper" onSubmit={handleSubmit} noValidate>
          <h1>User Registration</h1>

          {successMsg && <div className="notice ok">{successMsg}</div>}

          <div className="card">
            {/* Email */}
            <div className="Form_Entries">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                maxLength={100}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {errors.email && <div className="error">{errors.email}</div>}

            {/* Password */}
            <div className="Form_Entries">
              <label htmlFor="password">Password</label>
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
            </div>
            {errors.password && <div className="error">{errors.password}</div>}

            {/* First Name */}
            <div className="Form_Entries">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                placeholder="John"
                maxLength={50}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            {/* Last Name */}
            <div className="Form_Entries">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                placeholder="Doe"
                maxLength={50}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <button type="submit">Register</button>
          </div>

          <p className="muted">
            Already have an account? <a href="/login">Log in</a>
          </p>
        </form>
      </div>
    </div>
  );
}
