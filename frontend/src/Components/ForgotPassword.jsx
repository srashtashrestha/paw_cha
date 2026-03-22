import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css'; 
import logo from '../Assets/Logo/Logo.png'; 

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSendCode = async (e) => {
        e.preventDefault();
        setLoading(true); // Disable button while sending
        
        try {
            const response = await fetch('http://localhost:5000/api/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.success) {
                alert(`Verification code sent to ${email}. Please check your inbox or spam folder.`);
                // Navigate and pass email to the next screen via state
                navigate('/verify-code', { state: { email } });
            } else {
                alert(data.message || "Email not found in our records.");
            }
        } catch (error) {
            console.error("Frontend Error:", error);
            alert("Failed to connect to the server. Is your backend running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-screen">
            <div className="login-card">
                <div className="login-header">
                    <img src={logo} alt="PawCha Logo" className="login-logo" />
                    <h2 style={{ fontSize: '22px', margin: '10px 0' }}>Forgot your Password?</h2>
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
                        Enter your email address to receive a verification code
                    </p>
                </div>

                <form className="login-form" onSubmit={handleSendCode}>
                    <div className="field-group">
                        <label>Email Address:</label>
                        <input 
                            type="email" 
                            placeholder="Enter your email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="submit-btn" 
                        disabled={loading}
                        style={{ 
                            backgroundColor: loading ? '#ccc' : '#9e9e9e', 
                            cursor: loading ? 'not-allowed' : 'pointer' 
                        }}
                    >
                        {loading ? 'Sending...' : 'Send Verification code'}
                    </button>
                </form>

                <div className="divider"></div>

                <p className="footer-msg" style={{ marginBottom: '20px' }}>
                    Remember your password? <span className="signup-link" style={{cursor: 'pointer', color: '#ff9800'}} onClick={() => navigate('/login')}>Login here</span>
                </p>
            </div>
        </div>
    );
};

export default ForgotPassword;