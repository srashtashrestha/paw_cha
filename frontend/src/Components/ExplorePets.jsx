import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, Heart, MapPin, Filter, ArrowLeft, X, CheckCircle } from 'lucide-react';
import './ExplorePets.css';
import AdopterSideBar from './AdopterSideBar';

const ExplorePets = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [userApplications, setUserApplications] = useState([]);
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const [showFilters, setShowFilters] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState({
        name: "",
        location: "",
        type: "",
        vaccinationStatus: "",
        minAge: 0,
        maxAge: 25
    });

    const adopterName = user?.fullName || user?.name || 'User';

    useEffect(() => {
        const loadPageData = async () => {
            if (!user?._id && !user?.id) return;
            const token = user?.token;
            if (!token) return;
            setLoading(true);
            
            try {
                const [petsRes, appsRes, favoritesRes] = await Promise.all([
                    fetch("http://localhost:5000/api/admin/all-pets"),
                    fetch(`http://localhost:5000/api/adopter/my-inquiries`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`http://localhost:5000/api/adopter/favorites`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                ]);

                const petsData = await petsRes.json();
                const appsData = await appsRes.json();
                const favoritesData = await favoritesRes.json();

                if (petsData.success) {
                    setPets([...petsData.pets].reverse());
                }

                if (appsData.success) {
                    const appliedIds = appsData.inquiries.map(inq => 
                        String(inq.petId?._id || inq.petId)
                    );
                    setUserApplications(appliedIds);
                }

                if (favoritesData.success) {
                    setFavorites(favoritesData.favorites || []);
                }
            } catch (error) {
                console.error("Error loading explore data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadPageData();
    }, [user?._id, user?.id, user?.token]);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user?._id && !user?.id) return;
            const token = user?.token;
            if (!token) return;

            try {
                const response = await fetch(`http://localhost:5000/api/notifications`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                const data = await response.json();
                if (data.success) {
                    setNotifications(data.notifications);
                    const unread = data.notifications.filter(n => !n.read).length;
                    setUnreadCount(unread);
                }
            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000); 
        return () => clearInterval(interval);
    }, [user?._id, user?.id, user?.token]);

    const toggleNotifDropdown = async () => {
        const nextState = !showNotifDropdown;
        setShowNotifDropdown(nextState);

        if (nextState && unreadCount > 0) {
            const token = user?.token;
            if (!token) return;

            try {
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));

                await fetch(`http://localhost:5000/api/notifications/mark-all-read`, {
                    method: 'PUT',
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json' 
                    }
                });
            } catch (err) {
                console.error("Failed to sync notification status", err);
            }
        }
    };

    const toggleFavorite = async (e, petId) => {
        e.stopPropagation();
        if (!user?.token) return;

        const isFavorite = favorites.includes(petId);

        try {
            const response = await fetch(
                isFavorite
                    ? `http://localhost:5000/api/adopter/favorites/${petId}`
                    : `http://localhost:5000/api/adopter/favorites`,
                {
                    method: isFavorite ? 'DELETE' : 'POST',
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: isFavorite ? undefined : JSON.stringify({ petId })
                }
            );

            const data = await response.json();
            if (data.success) {
                setFavorites(data.favorites || []);
            }
        } catch (error) {
            console.error("Error updating favorites:", error);
        }
    };

    const filteredPets = pets.filter(pet => {
        const matchesName = pet.name.toLowerCase().includes(filterCriteria.name.toLowerCase());
        const matchesLocation = pet.location.toLowerCase().includes(filterCriteria.location.toLowerCase());
        const matchesType = filterCriteria.type === "" || pet.type.toLowerCase() === filterCriteria.type.toLowerCase();
        const matchesVaccination =
            filterCriteria.vaccinationStatus === "" ||
            (pet.vaccinationStatus || "").toLowerCase() === filterCriteria.vaccinationStatus.toLowerCase();
        const matchesAge = pet.age >= filterCriteria.minAge && pet.age <= filterCriteria.maxAge;

        return matchesName && matchesLocation && matchesType && matchesVaccination && matchesAge;
    });

    const handleFilterChange = (e) => {
        const { id, value } = e.target;
        setFilterCriteria(prev => ({ ...prev, [id]: value }));
    };

    return (
        <div className="adopter-container">
            <AdopterSideBar />

            <main className="adopter-main">
                <header className="adopter-header">
                    <div className="welcome-section">
                        <button className="back-btn" onClick={() => navigate(-1)}>
                            <ArrowLeft size={20} />
                        </button>
                        <h1>Explore <span className="highlight">All Pets</span></h1>
                    </div>
                    <div className="header-controls">
                        <div className="search-bar">
                            <Search size={18} />
                            <input 
                                type="text" 
                                placeholder="Quick search..." 
                                value={filterCriteria.name}
                                onChange={(e) => setFilterCriteria({...filterCriteria, name: e.target.value})}
                            />
                        </div>
                        <button className={`icon-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
                            <Filter size={20}/>
                        </button>
                        
                        <div className="notification-wrapper">
                            <button className={`icon-btn ${unreadCount > 0 ? 'has-unread' : ''}`} onClick={toggleNotifDropdown}>
                                <Bell size={20} />
                                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                            </button>

                            {showNotifDropdown && (
                                <div className="notif-dropdown">
                                    <div className="notif-header">
                                        <h4>Notifications</h4>
                                        {unreadCount > 0 && <span className="unread-dot"></span>}
                                    </div>
                                    {notifications.length > 0 ? (
                                        notifications.map(n => (
                                            <div key={n._id} className={`notif-item ${n.read ? 'read' : 'unread'}`}>
                                                <p>{n.message}</p>
                                                <div className="notif-actions">
                                                     {n.type === 'approval' && (
                                                         <button className="chat-now-btn" onClick={() => navigate('/messages')}>
                                                            Chat Now
                                                         </button>
                                                     )}
                                                     <span className="notif-time">{new Date(n.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-notif">
                                            <Bell size={30} opacity={0.3} />
                                            <p>No new updates</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        <div className="user-profile">
                            <div className="profile-initials">{adopterName.charAt(0)}</div>
                            <span>{adopterName}</span>
                        </div>
                    </div>
                </header>

                {showFilters && (
                    <section className="filter-container animate-slide-down">
                        <div className="filter-header">
                            <h3>Filter Pets</h3>
                            <button className="close-filter" onClick={() => setShowFilters(false)}><X size={24}/></button>
                        </div>
                        
                        <div className="filter-row">
                            <div className="filter-group">
                                <input type="text" id="name" placeholder="Search By Pet Name" className="filter-input" value={filterCriteria.name} onChange={handleFilterChange} />
                            </div>
                            <div className="filter-group">
                                <input type="text" id="location" placeholder="Search Pets By Location" className="filter-input" value={filterCriteria.location} onChange={handleFilterChange}/>
                            </div>
                        </div>

                        <div className="filter-row">
                            <div className="filter-group">
                                <select id="type" className="filter-input select-custom" value={filterCriteria.type} onChange={handleFilterChange}>
                                    <option value="">All Pet Types</option>
                                    <option value="dog">Dog</option>
                                    <option value="cat">Cat</option>
                                    <option value="rabbit">Rabbit</option>
                                    <option value="bird">Bird</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <select
                                    id="vaccinationStatus"
                                    className="filter-input select-custom"
                                    value={filterCriteria.vaccinationStatus}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Any Vaccination Status</option>
                                    <option value="full">Fully Vaccinated</option>
                                    <option value="partial">Partially Vaccinated</option>
                                    <option value="none">Not Vaccinated</option>
                                </select>
                            </div>
                        </div>

                        <div className="filter-row">
                            <div className="filter-group age-slider-container">
                                <div className="age-labels">
                                    <span>Age Range: <b>{filterCriteria.minAge} - {filterCriteria.maxAge} yrs</b></span>
                                </div>
                                <div className="range-slider">
                                    <input type="range" min="0" max="25" value={filterCriteria.minAge} onChange={(e) => setFilterCriteria({...filterCriteria, minAge: parseInt(e.target.value)})} />
                                    <input type="range" min="0" max="25" value={filterCriteria.maxAge} onChange={(e) => setFilterCriteria({...filterCriteria, maxAge: parseInt(e.target.value)})} />
                                </div>
                            </div>
                        </div>

                        <div className="filter-actions">
                            <button className="filter-clear-btn" onClick={() => setFilterCriteria({name: "", location: "", type: "", vaccinationStatus: "", minAge: 0, maxAge: 25})}>Clear Filters</button>
                            <button className="filter-search-btn" onClick={() => setShowFilters(false)}>Apply Filters</button>
                        </div>
                    </section>
                )}

                <section className="explore-grid-section">
                    {loading ? (
                        <div className="status-msg">Loading all pets...</div>
                    ) : (
                        <div className="pets-static-grid">
                            {filteredPets.length > 0 ? filteredPets.map(pet => {
                                const isApplied = userApplications.includes(String(pet._id));
                                return (
                                    <div key={pet._id} className={`pet-item-card ${isApplied ? 'pet-applied' : ''}`}>
                                        <div className="pet-thumb">
                                            <img src={pet.images?.[0] ? `http://localhost:5000/uploads/${pet.images[0]}` : '/placeholder.png'} alt={pet.name} />
                                            {isApplied && (
                                                <div className="applied-tag">
                                                    <CheckCircle size={14} /> Applied
                                                </div>
                                            )}
                                            <button className={`fav-overlay ${favorites.includes(pet._id) ? 'is-fav' : ''}`} onClick={(e) => toggleFavorite(e, pet._id)}>
                                                <Heart size={18} fill={favorites.includes(pet._id) ? "#7c4dff" : "none"} color={favorites.includes(pet._id) ? "#7c4dff" : "currentColor"} />
                                            </button>
                                        </div>
                                        <div className="pet-info">
                                            <h3>{pet.name}</h3>
                                            <span className="pet-specs">{pet.age} yrs • {pet.type}</span>
                                            <p className="pet-loc"><MapPin size={14} /> {pet.location}</p>
                                            <button 
                                                className={`view-profile-btn ${isApplied ? 'btn-disabled' : ''}`} 
                                                onClick={() => !isApplied && navigate(`/pet-profile/${pet._id}`)}
                                                disabled={isApplied}
                                            >
                                                {isApplied ? 'Application Sent' : 'View Profile'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="status-msg">No pets found matching your filters.</div>
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default ExplorePets;
