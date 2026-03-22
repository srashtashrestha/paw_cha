import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginForm.css';

const DonorRegister = () => {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [idCard, setIdCard] = useState(null);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('fullName', fullName);
        formData.append('email', email);
        formData.append('password', password);
        formData.append('idCard', idCard);

        try {
           const response = await fetch('http://localhost:5000/api/register-donor', // Change localhost to 127.0.0.1
        {
            method: 'POST',
            body: formData,
        }
    );

            const data = await response.json();

            if (data.success) {
                alert("Success! Your ID is submitted. Please wait for Admin verification.");
                navigate('/login');
            } else {
                alert("Error: " + data.message);
            }

        } catch (error) {
            console.error(error);
            alert("Failed to connect to server.");
        }
    };

    return (
        <div className="login-screen">
            <div className="login-card">
                <h2>Donor Sign Up</h2>
                <form onSubmit={handleRegister} className="login-form">
                    <div className="field-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="field-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="field-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="field-group">
                        <label>Upload ID Card (Citizenship/ID)</label>
                        <input
                            type="file"
                            onChange={(e) => setIdCard(e.target.files[0])}
                            required
                        />
                    </div>

                    <button type="submit" className="submit-btn btn-donor">
                        Register
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DonorRegister;
