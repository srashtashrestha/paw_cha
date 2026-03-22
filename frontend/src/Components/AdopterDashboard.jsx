import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 1. Professional Import
import { Search, Bell, Heart, Layout, MessageSquare, ClipboardList, Settings, LogOut, MapPin } from 'lucide-react';
import './AdopterDashboard.css';
import logo from '../Assets/Logo/Logo.png';

const AdopterDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth(); // 2. Get user and logout from context
    const [pets, setPets] = useState([]);
    const [favorites, setFavorites] = useState([]); 
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    
    // 3. Security Check: Only use the name if the role is actually 'adopter'
    const adopterName = user?.role === 'adopter' ? user.name : 'User';

    useEffect(() => {
        fetchPets();
    }, []);

    const fetchPets = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/admin/all-pets");
            const result = await response.json();
            if (result.success) setPets(result.pets);
        } catch (error) {
            console.error("Error fetching pets:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = (e, petId) => {
        e.stopPropagation();
        setFavorites(prev => 
            prev.includes(petId) 
                ? prev.filter(id => id !== petId) 
                : [...prev, petId]
        );
    };

    const filteredPets = useMemo(() => {
        return pets.filter(pet => 
            pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pet.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, pets]);

    return (
        <div className="adopter-container">
            <aside className="adopter-sidebar">
                <div className="logo-area">
                    <img src={logo} alt="PawCha" className="nav-logo" />
                </div>
                <nav className="adopter-nav">
                    <button className="active"><Layout size={20} /> Dashboard</button>
                    <button><MessageSquare size={20} /> Messages</button>
                    <button><ClipboardList size={20} /> Pet Listings</button>
                    <button><ClipboardList size={20} /> My Applications</button>
                    <button><Heart size={20} /> Favourites</button>
                </nav>
                <div className="sidebar-footer">
                    <button className="footer-link"><Settings size={18} /> Settings</button>
                    {/* 4. Use the professional logout function */}
                    <button className="footer-link logout" onClick={logout}><LogOut size={18} /> Log Out</button>
                </div>
            </aside>

            <main className="adopter-main">
                <header className="adopter-header">
                    <div className="welcome-section">
                        <h1>Welcome, <span className="highlight">{adopterName}!</span></h1>
                    </div>
                    <div className="header-controls">
                        <div className="search-bar">
                            <Search size={18} />
                            <input 
                                type="text" 
                                placeholder="Search by name, type, or city..." 
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="icon-btn"><Bell size={20} /></button>
                        <div className="user-profile">
                            <div className="profile-initials">{adopterName.charAt(0)}</div>
                            <span>{adopterName}</span>
                        </div>
                    </div>
                </header>

                <section className="listings-section">
                    <div className="section-header">
                        <h2>Meet Pets Ready for Adoption</h2>
                        <button className="explore-all-btn" onClick={() => navigate('/explore-pets')}>
                            Explore All
                        </button>
                    </div>

                    <div className="pets-scroll-grid">
                        {loading ? (
                            <div className="status-msg">Loading pets...</div>
                        ) : filteredPets.length > 0 ? (
                            filteredPets.map(pet => (
                                <div key={pet._id} className="pet-item-card">
                                    <div className="pet-thumb">
                                        <img src={pet.images?.[0] ? `http://localhost:5000/uploads/${pet.images[0]}` : '/placeholder.png'} alt={pet.name} />
                                        <button 
                                            className={`fav-overlay ${favorites.includes(pet._id) ? 'is-fav' : ''}`}
                                            onClick={(e) => toggleFavorite(e, pet._id)}
                                        >
                                            <Heart size={18} fill={favorites.includes(pet._id) ? "#7c4dff" : "none"} />
                                        </button>
                                    </div>
                                    <div className="pet-info">
                                        <h3>{pet.name}</h3>
                                        <span className="pet-specs">{pet.age} yrs • {pet.type}</span>
                                        <p className="pet-loc"><MapPin size={14} /> {pet.location}</p>
                                        <button className="view-profile-btn" onClick={() => navigate(`/pet-profile/${pet._id}`)}>
                                            View Profile
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="status-msg">No pets found matching your search.</div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AdopterDashboard;