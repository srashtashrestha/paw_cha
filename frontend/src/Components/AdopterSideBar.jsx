import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout, MessageSquare, ClipboardList, Heart, Settings, LogOut } from 'lucide-react';
import logo from '../Assets/Logo/Logo.png';
import './AdopterSideBar.css'; 

const AdopterSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    // This ensures that if you are on /settings, the string 'active' is returned
    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <aside className="adopter-sidebar">
            <div className="logo-area">
                <img 
                    src={logo} 
                    alt="PawCha" 
                    className="nav-logo" 
                    onClick={() => navigate('/adopter-dashboard')} 
                    style={{ cursor: 'pointer' }}
                />
            </div>

            <nav className="adopter-nav">
                <button className={isActive('/adopter-dashboard')} onClick={() => navigate('/adopter-dashboard')}>
                    <Layout size={20} /> Dashboard
                </button>
                <button className={isActive('/messages')} onClick={() => navigate('/messages')}>
                    <MessageSquare size={20} /> Messages
                </button>
                <button className={isActive('/explore-pets')} onClick={() => navigate('/explore-pets')}>
                    <ClipboardList size={20} /> Pet Listings
                </button>
                <button className={isActive('/my-inquiries')} onClick={() => navigate('/my-inquiries')}>
                    <ClipboardList size={20} /> My Applications
                </button>
                <button className={isActive('/favourites')} onClick={() => navigate('/favourites')}>
                    <Heart size={20} /> Favourites
                </button>
            </nav>

            <div className="sidebar-footer">
                {/* Updated Settings button to include base class and active state */}
                <button 
                    className={`footer-link ${isActive('/settings')}`} 
                    onClick={() => navigate('/settings')}
                >
                    <Settings size={18} /> Settings
                </button>

                <button className="footer-link logout" onClick={logout}>
                    <LogOut size={18} /> Log Out
                </button>
            </div>
        </aside>
    );
};

export default AdopterSidebar;