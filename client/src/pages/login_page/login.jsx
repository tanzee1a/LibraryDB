import React from 'react'
import './login.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import Navbar from '../navbar/navbar';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function Login({ setIsStaff, setIsLoggedIn }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
  
      const data = await response.json();
  
      if (response.ok) {
       // 1. Persist the data
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userRole', data.user.role); 

    // 2. Update React state immediately (optional, but good practice)
    const isStaffUser = data.user.role === 'Staff';
    setIsStaff(isStaffUser);
    setIsLoggedIn(true);

    // 3. Navigate the users
    if (isStaffUser) {
        // Staff can use soft navigation
        navigate('/staff_page', { replace: true });
    } else {
        // 🚨 FIX: Force a hard reload for patron users
        navigate('/account', { replace: true });
      }
    }else {
        alert(data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    }
  };

  return (
    <div className= "Login_Page_Wrapper">
    <div className = "Login_Page">
      <h1 className='welcome'> Welcome To The Login Page</h1>
      <div className = "Login_Container">
        <form id = "Login_Form" className = 'login-form' onSubmit={handleSubmit}>
          <div className='Form_Entries'>
            <label className='Form_Entry'>Email </label>
              <input 
                id="email"
                type="text"
                value = {email} 
                className="form-input"
                placeholder="Enter Your Email"
                minLength={7}
                maxLength={255}

                onChange={(e) => setEmail(e.target.value)}
              />

          </div>

          <div className='Form_Entries'>
            <label className='Form_Entry'>Password </label>
              <input 
                id="password"
                type="password"
                value = {password}
                className="form-input"
                placeholder="Enter Your Password"
                minLength={7}
                maxLength={20}

                onChange={(e) => setPassword(e.target.value)}
              />
          </div>
          <div className = 'LoginPage_Button'>
            <button type = "submit" className= 'login_button'>Login</button>
            <button 
              type="button" 
              className='login_button' 
              onClick={() => navigate('/register')}
            >
              Register
            </button>
          </div>
  

        </form>

      </div>
    </div>
    </div>
  )
}

export default Login