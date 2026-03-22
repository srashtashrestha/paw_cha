import React from 'react';

const GoogleLoginBtn = () => {
  const handleGoogleLogin = () => {
    // In a real app, this redirects to your backend API route
    // Example: window.location.href = "http://localhost:5000/auth/google";
    alert("Redirecting to Google Secure Sign-in...");
  };

  return (
    <button onClick={handleGoogleLogin} className="google-btn">
      <img 
        src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_Logo.svg" 
        alt="Google" 
        width="20" 
      />
      Continue with Google
    </button>
  );
};

export default GoogleLoginBtn;