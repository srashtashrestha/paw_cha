import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './LoginForm.css';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || sessionStorage.getItem('resetEmail');
  const resetToken = location.state?.resetToken || sessionStorage.getItem('resetToken');

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!email) {
      alert("Please start the reset process again.");
      navigate('/forgot-password');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, resetToken })
      });

      const data = await response.json();

      if (data.success) {
        sessionStorage.removeItem('resetEmail');
        sessionStorage.removeItem('resetToken');
        alert("Password updated successfully! Please login with your new password.");
        navigate('/login');
      } else {
        alert(data.message || "Failed to reset password.");
      }
    } catch (err) {
      alert("Cannot connect to server.");
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-header">
          <h2>Reset Password</h2>
          <p>Create a new password for <strong>{email}</strong></p>
        </div>

        <form onSubmit={handleReset} className="login-form">
          <div className="field-group">
            <label>New Password</label>
            <input
              type="password"
              placeholder="********"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="field-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              placeholder="********"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
