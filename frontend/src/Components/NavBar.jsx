import React, { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './NavBar.css'; 
import logo from '../Assets/Logo/Logo.png'; 

const NavBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const isLoggedIn = Boolean(user?.token && user?.role);
    const displayName = user?.name || user?.fullName || 'User';
    const profilePicFile = Array.isArray(user?.profilePic)
        ? user.profilePic.find(Boolean)
        : user?.profilePic;
    const profilePicSrc = profilePicFile ? `http://localhost:5000/uploads/${profilePicFile}` : null;

    // Scroll to top whenever the path changes to ensure user sees the top of Home
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    const isActive = (path) => {
        if (path === "/") {
            return location.pathname === "/" || location.pathname === "/home";
        }
        return location.pathname === path;
    };

    // Improved redirection handler
    const handleHomeClick = (e) => {
        if (location.pathname === "/") {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getDashboardPath = () => {
        if (user?.role === 'donor') return '/donor-dashboard';
        if (user?.role === 'admin') return '/admin-dashboard';
        return '/adopter-dashboard';
    };

    return (
        <nav className="pawcha-navbar">
            <div className="nav-left">
                <Link 
                    to="/home" 
                    onClick={handleHomeClick}
                    className={`nav-item ${isActive('/home') ? 'active' : ''}`}
                >
                    Home
                </Link>
                <Link to="/services" className={`nav-item ${isActive('/services') ? 'active' : ''}`}>Services</Link>
                <Link to="/pet-listing" className={`nav-item ${isActive('/pet-listing') ? 'active' : ''}`}>Pet Listing</Link>
            </div>

            <div className="nav-logo-center">
                <img 
                    src={logo} 
                    alt="PawCha Logo" 
                    className="navbar-logo" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/')} 
                />
            </div>

            <div className="nav-right">
                <Link to="/contact-us" className={`nav-item ${isActive('/contact-us') ? 'active' : ''}`}>Contact Us</Link>
                {isLoggedIn ? (
                    <div className="nav-auth-user">
                        <button className="nav-user-pill" onClick={() => navigate(getDashboardPath())}>
                            <span className="nav-user-avatar">
                                {profilePicSrc ? (
                                    <img src={profilePicSrc} alt={displayName} />
                                ) : (
                                    displayName.charAt(0)
                                )}
                            </span>
                            <span className="nav-user-text">
                                <small>Logged in as</small>
                                <strong>{displayName}</strong>
                            </span>
                        </button>
                        <button className="nav-btn dashboard" onClick={() => navigate(getDashboardPath())}>
                            Dashboard
                        </button>
                        <button className="nav-btn logout" onClick={logout}>
                            Logout
                        </button>
                    </div>
                ) : (
                    <div className="nav-auth-btns">
                        <button className="nav-btn login" onClick={() => navigate('/login')}>Login</button>
                        <button className="nav-btn register" onClick={() => navigate('/register-adopter')}>Register</button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default NavBar;
