import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import AdopterSideBar from './AdopterSideBar';
import { User, Shield, Camera, Lock, Mail, UserCircle, CheckCircle, AlertCircle } from 'lucide-react';
import './Settings.css';

const Settings = () => {
    // 1. Context & Refs
    const { user, token, logout, updateUser } = useAuth();
    const fileInputRef = useRef(null); 
    
    // 2. Form States
    const [profile, setProfile] = useState({ 
        name: '', 
        email: '' 
    });
    
    const [password, setPassword] = useState({ 
        current: '', 
        new: '', 
        confirm: '' 
    });

    // 3. Feedback States
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Sync form with user data
    useEffect(() => {
        if (user) {
            setProfile({
                name: user.fullName || user.name || '',
                email: user.email || ''
            });
        }
    }, [user]);

    const showToast = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

    // --- Profile Picture Upload Logic ---
    const handlePfpClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("profilePic", file);

        setLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/user/update-pfp", {
                method: "PUT",
                headers: { 
                    "Authorization": `Bearer ${token}` 
                },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                showToast("Profile picture updated!", "success");
                
                // NECESSARY UPDATE: Safely merge the new PFP into existing user state
                if (updateUser) {
                    const updatedUserObj = {
                        ...user, // Keep token, role, id
                        profilePic: data.user.profilePic || data.profilePic 
                    };
                    updateUser(updatedUserObj);
                }
            } else {
                showToast(data.message || "Upload failed", "error");
            }
        } catch (err) {
            showToast("Error uploading image", "error");
        } finally {
            setLoading(false);
        }
    };

    // Update Profile Info
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        if (!token) return showToast("Session expired. Please login again.", "error");
        
        setLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/user/update-profile", {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify(profile)
            });
            
            const data = await res.json();
            
            if (data.success) {
                showToast("Profile updated successfully!", "success");
                
                // NECESSARY UPDATE: Ensure all fields (name/fullName) stay synced
                if (updateUser) {
                    const updatedUserObj = {
                        ...user, 
                        name: profile.name,
                        fullName: profile.name,
                        email: profile.email
                    };
                    updateUser(updatedUserObj);
                }
            } else {
                showToast(data.message || "Failed to update profile", "error");
            }
        } catch (err) {
            showToast("Server error. Check if backend is running.", "error");
        } finally {
            setLoading(false);
        }
    };

    // Change Password
    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        if (password.new.length < 6) return showToast("New password must be at least 6 characters", "error");
        if (password.new !== password.confirm) return showToast("New passwords do not match!", "error");
        
        setLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/user/change-password", {
                method: "PUT",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    currentPassword: password.current, 
                    newPassword: password.new 
                })
            });
            
            const data = await res.json();
            
            if (data.success) {
                showToast("Password updated successfully!", "success");
                setPassword({ current: '', new: '', confirm: '' });
            } else {
                showToast(data.message || "Incorrect current password", "error");
            }
        } catch (err) {
            showToast("Error updating password", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="adopter-container">
            <AdopterSideBar logout={logout} />
            
            {message.text && (
                <div className={`toast-notification ${message.type}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span>{message.text}</span>
                </div>
            )}

            <main className="adopter-main">
                <header className="adopter-header">
                    <div className="welcome-section">
                        <h1>Account <span className="highlight">Settings</span></h1>
                    </div>
                </header>

                <div className="settings-scroll-container">
                    <div className="settings-wide-card">
                        
                        {/* PROFILE SECTION */}
                        <section className="settings-section">
                            <div className="section-title">
                                <User size={22} color="#7c4dff" />
                                <h2>Profile Information</h2>
                            </div>
                            
                            <div className="pfp-edit-section">
                                <div className="pfp-wrapper">
                                    <img 
                                        src={user?.profilePic ? `http://localhost:5000/uploads/${user.profilePic}` : `https://ui-avatars.com/api/?name=${profile.name || 'User'}&background=random`} 
                                        alt="Profile" 
                                        className="pfp-preview" 
                                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${profile.name || 'User'}`; }}
                                    />
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange} 
                                        accept="image/*" 
                                        style={{ display: 'none' }} 
                                    />
                                    <button 
                                        type="button"
                                        className="pfp-overlay-btn" 
                                        onClick={handlePfpClick}
                                    >
                                        <Camera size={20}/>
                                    </button>
                                </div>
                                <div className="pfp-info">
                                    <h4>{profile.name || "User"}</h4>
                                    <p className="pet-specs">Manage your public identity on PawCha.</p>
                                </div>
                            </div>

                            <form className="settings-form-layout" onSubmit={handleProfileUpdate}>
                                <div className="input-grid">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <div className="input-with-icon">
                                            <UserCircle size={18} />
                                            <input 
                                                type="text" 
                                                required
                                                value={profile.name} 
                                                onChange={(e) => setProfile({...profile, name: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <div className="input-with-icon">
                                            <Mail size={18} />
                                            <input 
                                                type="email" 
                                                required
                                                value={profile.email} 
                                                onChange={(e) => setProfile({...profile, email: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" className="save-btn" disabled={loading}>
                                    {loading ? "Updating..." : "Update Profile"}
                                </button>
                            </form>
                        </section>

                        <div className="section-divider"></div>

                        {/* SECURITY SECTION */}
                        <section className="settings-section">
                            <div className="section-title">
                                <Shield size={22} color="#7c4dff" />
                                <h2>Safety & Password</h2>
                            </div>
                            
                            <form className="settings-form-layout" onSubmit={handlePasswordUpdate}>
                                <div className="form-group full-width">
                                    <label>Current Password</label>
                                    <div className="input-with-icon">
                                        <Lock size={18} />
                                        <input 
                                            type="password" 
                                            required
                                            value={password.current}
                                            onChange={(e) => setPassword({...password, current: e.target.value})}
                                            placeholder="Enter current password" 
                                        />
                                    </div>
                                </div>
                                <div className="input-grid">
                                    <div className="form-group">
                                        <label>New Password</label>
                                        <input 
                                            type="password" 
                                            required
                                            value={password.new}
                                            onChange={(e) => setPassword({...password, new: e.target.value})}
                                            placeholder="Min. 6 characters" 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Confirm Password</label>
                                        <input 
                                            type="password" 
                                            required
                                            value={password.confirm}
                                            onChange={(e) => setPassword({...password, confirm: e.target.value})}
                                            placeholder="Repeat new password" 
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="save-btn" disabled={loading}>
                                    {loading ? "Processing..." : "Update Password"}
                                </button>
                            </form>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Settings;