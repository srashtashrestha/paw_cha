import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, Heart, MapPin, Filter, ArrowLeft, X } from 'lucide-react'; // Added X icon
import './ExplorePets.css';
import AdopterSideBar from './AdopterSideBar';

const ExplorePets = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [userApplications, setUserApplications] = useState([]);
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('pawcha_favorites');
        return saved ? JSON.parse(saved) : [];
    });
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // --- NEW FILTER STATES ---
    const [showFilters, setShowFilters] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState({
        name: "",
        location: "",
        type: "",
        minAge: 0,
        maxAge: 25
    });

    const adopterName = user?.name || 'User';

    useEffect(() => {
    const loadPageData = async () => {
        if (!user?._id) return;
        setLoading(true);
        
        try {
            // Fetch both in parallel for speed
            const [petsRes, appsRes] = await Promise.all([
                fetch("http://localhost:5000/api/admin/all-pets"),
                fetch(`http://localhost:5000/api/applications/user/${user._id}`)
            ]);

            const petsData = await petsRes.json();
            const appsData = await appsRes.json();

            if (petsData.success) {
                setPets([...petsData.pets].reverse());
            }

            if (appsData.success) {
                // Ensure we store a clean array of ID strings
                const appliedIds = appsData.applications.map(app => 
                    String(app.petId._id || app.petId)
                );
                setUserApplications(appliedIds);
            }
        } catch (error) {
            console.error("Error loading explore data:", error);
        } finally {
            setLoading(false);
        }
    };

    loadPageData();
}, [user?._id]); 

    useEffect(() => {
    const fetchUserApplications = async () => {
        if (!user?._id) return;
        try {
            const response = await fetch(`http://localhost:5000/api/applications/user/${user._id}`);
            const result = await response.json();
            if (result.success) {
                // Extract only the pet IDs from the applications
                const appliedPetIds = result.applications.map(app => app.petId._id || app.petId);
                setUserApplications(appliedPetIds);
            }
        } catch (error) {
            console.error("Error fetching applications:", error);
        }
    };
    fetchUserApplications();
}, [user?._id]);

    useEffect(() => {
        const fetchAllPets = async () => {
            setLoading(true);
            try {
                const response = await fetch("http://localhost:5000/api/admin/all-pets");
                const result = await response.json();
                if (result.success) {
                    setPets([...result.pets].reverse());
                }
            } catch (error) {
                console.error("Error fetching pets:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllPets();
    }, []);

    const toggleFavorite = (e, petId) => {
        e.stopPropagation();
        setFavorites(prev => {
            const updated = prev.includes(petId) ? prev.filter(id => id !== petId) : [...prev, petId];
            localStorage.setItem('pawcha_favorites', JSON.stringify(updated));
            return updated;
        });
    };

   const filteredPets = pets.filter(pet => {
    // FIX: Force string conversion for reliable comparison
    const alreadyApplied = userApplications.some(
        appId => String(appId) === String(pet._id)
    );
    
    const matchesName = pet.name.toLowerCase().includes(filterCriteria.name.toLowerCase());
    const matchesLocation = pet.location.toLowerCase().includes(filterCriteria.location.toLowerCase());
    const matchesType = filterCriteria.type === "" || pet.type.toLowerCase() === filterCriteria.type.toLowerCase();
    const matchesAge = pet.age >= filterCriteria.minAge && pet.age <= filterCriteria.maxAge;

    // Return true ONLY if user HAS NOT applied and matches search filters
    return !alreadyApplied && matchesName && matchesLocation && matchesType && matchesAge;
});

    const handleFilterChange = (e) => {
        const { id, value } = e.target;
        setFilterCriteria(prev => ({ ...prev, [id]: value }));
    };

    useEffect(() => {
    const fetchNotifications = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/notifications/${user._id}`);
            const data = await response.json();
            if (data.success) {
                setNotifications(data.notifications);
                setUnreadCount(data.notifications.filter(n => !n.read).length);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };
    if (user?._id) fetchNotifications();
}, [user?._id]);

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
                        {/* Toggle Filter Button */}
                        <button className={`icon-btn ${showFilters ? 'active' : ''}`} onClick={() => setShowFilters(!showFilters)}>
                            <Filter size={20}/>
                        </button>
                        {/* <button className="icon-btn"><Bell size={20} /></button> */}
                        <div className="notification-wrapper">
                            <button 
                                className={`icon-btn ${unreadCount > 0 ? 'has-unread' : ''}`} 
                                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                            </button>

                            {showNotifDropdown && (
                                <div className="notif-dropdown">
                                    <h4>Notifications</h4>
                                    {notifications.length > 0 ? (
                                        notifications.map(n => (
                                            <div key={n._id} className={`notif-item ${n.read ? 'read' : 'unread'}`}>
                                                <p>{n.message}</p>
                                                <button onClick={() => navigate('/messages')}>Chat Now</button>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="no-notif">No new updates</p>
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
        
        {/* Row 1: Name and Location */}
        <div className="filter-row">
            <div className="filter-group">
                <input 
                    type="text" id="name" placeholder="Search By Pet Name" 
                    className="filter-input" value={filterCriteria.name} 
                    onChange={handleFilterChange} 
                />
            </div>
            <div className="filter-group">
                <input 
                    type="text" id="location" placeholder="Search Pets By Location" 
                    className="filter-input" value={filterCriteria.location} 
                    onChange={handleFilterChange}
                />
            </div>
        </div>

        {/* Row 2: Type and Age */}
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

            <div className="filter-group age-slider-container">
                <div className="age-labels">
                    <span>Age Range: <b>{filterCriteria.minAge} - {filterCriteria.maxAge} yrs</b></span>
                </div>
                <div className="range-slider">
                    <input 
                        type="range" min="0" max="25" value={filterCriteria.minAge} 
                        onChange={(e) => setFilterCriteria({...filterCriteria, minAge: parseInt(e.target.value)})} 
                    />
                    <input 
                        type="range" min="0" max="25" value={filterCriteria.maxAge} 
                        onChange={(e) => setFilterCriteria({...filterCriteria, maxAge: parseInt(e.target.value)})} 
                    />
                </div>
            </div>
        </div>

        <div className="filter-actions">
            <button className="filter-clear-btn" onClick={() => setFilterCriteria({
                name: "", location: "", type: "", minAge: 0, maxAge: 25
            })}>
                Clear Filters
            </button>
            <button className="filter-search-btn" onClick={() => setShowFilters(false)}>
                Apply Filters
            </button>
        </div>
    </section>
)}

                <section className="explore-grid-section">
                    {loading ? (
                        <div className="status-msg">Loading all pets...</div>
                    ) : (
                        <div className="pets-static-grid">
                            {filteredPets.length > 0 ? filteredPets.map(pet => (
                                <div key={pet._id} className="pet-item-card">
                                    {/* ... rest of your card code ... */}
                                    <div className="pet-thumb">
                                        <img src={pet.images?.[0] ? `http://localhost:5000/uploads/${pet.images[0]}` : '/placeholder.png'} alt={pet.name} />
                                        <button className={`fav-overlay ${favorites.includes(pet._id) ? 'is-fav' : ''}`} onClick={(e) => toggleFavorite(e, pet._id)}>
                                            <Heart size={18} fill={favorites.includes(pet._id) ? "#7c4dff" : "none"} color={favorites.includes(pet._id) ? "#7c4dff" : "currentColor"} />
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
                            )) : (
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