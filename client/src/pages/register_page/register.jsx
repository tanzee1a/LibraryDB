import React from 'react'
import './register.css'
import { useState } from "react";
import Navbar from '../navbar/navbar';


export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  // validate input
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMsg("");

    if (!validate()) return;

    // simulation
    setSuccessMsg("Registration successful!");
    setEmail("");
    setPassword("");
  };

  return (
    <div>
    <Navbar/>
   // 1. Full-page Centering Wrapper
   <div className="register-page-container">
   {/* 2. Main Dark Box Wrapper */}
   <form className="auth-wrapper" onSubmit={handleSubmit} noValidate>
     <h1>User Registration</h1>

     {successMsg && <div className="notice ok">{successMsg}</div>}

     {/* 3. The inner white form container (className="card" matches the padding/shadow) */}
     <div className="card">

         {/* Input Wrapper 1: Email (Using Form_Entries for the flex/border styling) */}
         <div className="Form_Entries">
             <label htmlFor="email">Email </label>
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

         {/* Input Wrapper 2: Password (Using Form_Entries for the flex/border styling) */}
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

         <button type="submit">Register</button>
     </div>
     <p className="muted">
       Already have an account? <a href="/login"> Log in</a>
     </p>
   </form>
 </div>
 </div>
);
}