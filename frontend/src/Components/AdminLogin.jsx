import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 1. Import Auth Context
import './LoginForm.css'; 

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth(); // 2. Get login function from context
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();

    try {
      // Consistent API endpoint
      const response = await fetch('http://localhost:5000/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const contentType = response.headers.get("content-type");
      
      // Safety check for non-JSON responses (prevents the 404/Not Found crash)
      if (!response.ok || !contentType || !contentType.includes("application/json")) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        alert("Server Error: Login route not found or server is down.");
        return;
      }

      const data = await response.json();

      if (data.success) {
        // 3. Use the context login function to save token and user info
        login({
          token: data.token,
          role: 'admin',
          name: 'Administrator',
          id: 'admin_root'
        });

        alert("Welcome, Admin!");
        navigate('/admin-dashboard'); 
      } else {
        alert("Access Denied: " + data.message);
      }
    } catch (error) {
      console.error("Technical Error Details:", error);
      alert("Cannot connect to server. Check if backend is running on port 5000.");
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <span className="gear-icon" style={{ fontSize: '2rem' }}>⚙️</span>
          <h2>Admin Portal</h2>
          <p>Sign in to manage the portal</p>
        </div>

        <form className="login-form" onSubmit={handleAdminLogin}>
          <div className="field-group">
            <label>Admin Email</label>
            <input 
              type="email" 
              placeholder="admin@petportal.com"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="field-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="submit-btn" style={{ backgroundColor: '#333', color: 'white' }}>
            Admin Log In
          </button>
        </form>

        <p className="footer-msg" style={{ marginTop: '20px' }}>
          <span 
            className="signup-link" 
            onClick={() => navigate('/login')}
            style={{ cursor: 'pointer', textDecoration: 'underline', color: '#666' }}
          >
            Back to User Login
          </span>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;