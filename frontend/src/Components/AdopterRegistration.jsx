import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import './LoginForm.css';
import logo from '../Assets/Logo/Logo.png';  

const AdopterRegister = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 1. Validate Passwords
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            // 2. Fetch call (Ensure port 5000 matches your backend)
            const response = await fetch('http://127.0.0.1:5000/api/register-adopter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();
            
            if (data.success) {
                alert("Account created successfully! You can now log in.");
                navigate('/login');
            } else {
                alert(data.message || "Registration failed");
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            alert("Cannot connect to server. Is your backend running?");
        }
    };

   return (
        <div className="login-screen register-screen"> {/* Added register-screen for extra padding */}
            <div className="login-card">
                <div className="login-header">
                    <img src={logo} alt="PawCha Logo" className="login-logo" /> 
                    <h2>Create Account</h2>
                    <p>Find your new best friend today</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="field-group">
                        <label>Full Name</label>
                        <input 
                            type="text" 
                            required 
                            placeholder="Enter your name"
                            value={formData.fullName}
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})} 
                        />
                    </div>
                    <div className="field-group">
                        <label>Email Address</label>
                        <input 
                            type="email" 
                            required 
                            placeholder="example@email.com"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        />
                    </div>
                    <div className="field-group">
                        <label>Password</label>
                        <div className="password-input-wrap">
                            <input 
                                type={showPassword ? "text" : "password"}
                                required 
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})} 
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <div className="field-group">
                        <label>Confirm Password</label>
                        <div className="password-input-wrap">
                            <input 
                                type={showConfirmPassword ? "text" : "password"}
                                required 
                                placeholder="Repeat password"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} 
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    
                    <button type="submit" className="submit-btn">Sign Up</button>
                </form>

                <div className="footer-msg">
                    <span>Already have an account? </span>
                    <Link to="/login" className="signup-link">Log In</Link>
                </div>
            </div>
        </div>
    );
}

export default AdopterRegister;
