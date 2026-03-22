import React, { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './NavBar.css'; 
import logo from '../Assets/Logo/Logo.png'; 

const NavBar = () => {
    const navigate = useNavigate();
    const location = useLocation();

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

    return (
        <nav className="pawcha-navbar">
            <div className="nav-left">
                {/* Fixed: Added handleHomeClick to ensure smooth behavior if already on home */}
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
                <span className="nav-item contact-us">Contact Us</span>
                <div className="nav-auth-btns">
                    <button className="nav-btn login" onClick={() => navigate('/login')}>Login</button>
                    <button className="nav-btn register" onClick={() => navigate('/register-adopter')}>Register</button>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;