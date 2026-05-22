import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './LoginForm.css';

const VerifyCode = () => {
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || sessionStorage.getItem('resetEmail');

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    const sanitizedCode = code.replace(/\D/g, '');

    if (!email) {
      alert("Please start the reset process again.");
      navigate('/forgot-password');
      return;
    }

    if (sanitizedCode.length !== 6) {
      alert("Please enter the 6-digit verification code.");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: sanitizedCode })
      });
      const data = await response.json();
      if (data.success) {
        if (data.resetToken) {
          sessionStorage.setItem('resetToken', data.resetToken);
        }
        // Pass email to ResetPassword page so we know whose password to change
        navigate('/reset-password', { state: { email, resetToken: data.resetToken } });
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("Verification failed. Try again.");
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h2>Enter Code</h2>
        <p>We sent a 6-digit code to {email}</p>
        <form onSubmit={handleVerify}>
          <div className="field-group">
            <input 
              type="text" 
              placeholder="000000" 
              maxLength="6"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
            />
          </div>
          <button type="submit" className="submit-btn">Verify Account</button>
        </form>
      </div>
    </div>
  );
};

export default VerifyCode;
