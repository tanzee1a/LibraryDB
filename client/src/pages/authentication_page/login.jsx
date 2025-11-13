import './login.css'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
import Logo from "../../assets/logo-dark.webp"

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
      localStorage.setItem('staffRole', data.user.staffRole); // Librarian / Assistant Librarian / null
      localStorage.setItem('userFirstName', data.user.firstName);
      localStorage.setItem('userId', data.user.user_id);

      // 2. Update React state immediately (optional, but good practice)
      const isStaffUser = data.user.role === 'Staff';
      setIsStaff(isStaffUser);
      setIsLoggedIn(true);

      const isLibrarian = data.user.staffRole === 'Librarian';
      const isAssistantLibrarian = data.user.staffRole === 'Assistant Librarian';

      // 3. Navigate the user
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
    <div className='page-container login-page-container'>
      <div className = "login-page-content">
        <div className='login-form-container fade-in'>
          <h2 className='login-form-title'><img className="logo-image-medium" src={Logo} alt="" /></h2>
          <div>
            <form className="info-form info-form-wide" onSubmit={handleSubmit}>
              <input 
                id="email"
                type="text"
                className="input-field"
                placeholder='Email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input 
                id="password"
                type="password"
                className="input-field"
                placeholder='Password'
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div>
                <p >New user? <a className='result-link' href="/register">Create an account</a></p>
                <button type="submit" className='action-button primary-button'>Login</button>
              </div>
      

            </form>

          </div>
        </div>
        <div className='login-side-text'>
          <h1 className='fade-in-text-from-bottom'>Knowledge is Power.</h1>
          <p className='fade-in-text-from-top'>Access the world of possibilities.</p>
        </div>
        
      </div>
    </div>
  )
}

export default Login