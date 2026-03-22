import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Professional Context Hook
import './LoginForm.css';

// Importing assets
import logo from '../Assets/Logo/Logo.png'; 
import googleIcon from '../Assets/Logo/Google.png';

const LoginForm = () => {
  const [isDonor, setIsDonor] = useState(false); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  
  // Accessing the central Auth function
  const { login } = useAuth(); 

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        /**
         * PROFESSIONAL UPDATE:
         * We pass the user data to the AuthContext. 
         * The context handles clearing the old session and setting the new one.
         */
        login({
          token: data.token,
          role: data.role,
          name: data.fullName,
          email: data.email
        });

        alert(`Welcome back, ${data.fullName}!`); 

        // Role-based routing
        if (data.role === 'donor') {
          navigate('/donor-dashboard');
        } else if (data.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/adopter-dashboard');
        }
      } else {
        alert("Login failed: " + data.message);
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("Cannot connect to server. Check if your backend is running.");
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <img src={logo} alt="PawCha Logo" className="login-logo" />
          <h2>Welcome Back!</h2>
          <p>Log in to your account</p>
        </div>

        <div className="role-toggle">
          <button 
            type="button"
            className={`tab ${!isDonor ? 'active-role' : 'inactive-role'}`}
            onClick={() => setIsDonor(false)}
          >Adopter</button>
          <button 
            type="button"
            className={`tab ${isDonor ? 'active-role' : 'inactive-role'}`}
            onClick={() => setIsDonor(true)}
          >Donor</button>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="field-group">
            <label>Email Address or Phone Number:</label>
            <input 
              type="text" 
              placeholder="Enter Email or Phone number"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="field-group">
            <label>Password:</label>
            <input 
              type="password" 
              placeholder="••••••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            <div className="forgot-password-container">
              <span className="forgot-link" onClick={() => navigate('/forgot-password')}>
                Forgot Password?
              </span>
            </div>
          </div>

          <button type="submit" className="submit-btn">
            Login
          </button>
        </form>

        <div className="divider"><span>or login with</span></div>

        <button type="button" className="google-btn-custom">
          <img src={googleIcon} alt="Google" className="google-icon-img" />
          Continue with Google
        </button>

        <p className="footer-msg">
          Don't have an account? 
          <span className="signup-link" onClick={() => navigate(isDonor ? '/register-donor' : '/register-adopter')}>
            Signup here
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;