import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, Heart, MapPin, Filter, ArrowLeft, X, CheckCircle, ShieldCheck } from 'lucide-react';
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
    const [searchTerm, setSearchTerm] = useState("");

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
    const profilePicFile = Array.isArray(user?.profilePic)
        ? user.profilePic.find(Boolean)
        : user?.profilePic;
    const profilePicSrc = profilePicFile ? `http://localhost:5000/uploads/${profilePicFile}` : null;

    const normalizeText = (value) =>
        String(value || "")
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

    const fetchPets = useCallback(async () => {
        try {
            const petsRes = await fetch("http://localhost:5000/api/pets", {
                cache: "no-store",
                headers: {
                    "Cache-Control": "no-cache"
                }
            });
            const petsData = await petsRes.json();

            if (petsData.success) {
                setPets(petsData.pets);
            }
        } catch (error) {
            console.error("Error loading pet list:", error);
        }
    }, []);

    const fetchUserData = useCallback(async () => {
        const token = user?.token;
        if (!token) return;

        try {
            const [appsResult, favoritesResult] = await Promise.allSettled([
                fetch(`http://localhost:5000/api/adopter/my-inquiries`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`http://localhost:5000/api/adopter/favorites`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (appsResult.status === "fulfilled") {
                const appsData = await appsResult.value.json();
                if (appsData.success) {
                    const appliedIds = appsData.inquiries.map((inq) =>
                        String(inq.petId?._id || inq.petId)
                    );
                    setUserApplications(appliedIds);
                }
            }

            if (favoritesResult.status === "fulfilled") {
                const favoritesData = await favoritesResult.value.json();
                if (favoritesData.success) {
                    setFavorites(favoritesData.favorites || []);
                }
            }
        } catch (error) {
            console.error("Error loading adopter-side pet metadata:", error);
        }
    }, [user?.token]);

    const loadPageData = useCallback(async () => {
        setLoading(true);
        try {
            await Promise.all([fetchPets(), fetchUserData()]);
        } finally {
            setLoading(false);
        }
    }, [fetchPets, fetchUserData]);

    useEffect(() => {
        loadPageData();
    }, [loadPageData]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchPets();
        }, 10000);

        return () => clearInterval(interval);
    }, [fetchPets]);

    useEffect(() => {
        const refreshOnFocus = () => {
            if (document.visibilityState === "hidden") return;
            loadPageData();
        };

        window.addEventListener("focus", refreshOnFocus);
        document.addEventListener("visibilitychange", refreshOnFocus);

        return () => {
            window.removeEventListener("focus", refreshOnFocus);
            document.removeEventListener("visibilitychange", refreshOnFocus);
        };
    }, [loadPageData]);

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

    const toggleNotifDropdown = () => {
        setShowNotifDropdown((prev) => !prev);
    };

    const handleMarkAsRead = async (notificationId) => {
        const token = user?.token;
        if (!token) return;

        const targetNotification = notifications.find((notification) => notification._id === notificationId);
        if (!targetNotification || targetNotification.read) return;

        try {
            const response = await fetch(`http://localhost:5000/api/notifications/read/${notificationId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (data.success) {
                setNotifications((prev) =>
                    prev.map((notification) =>
                        notification._id === notificationId
                            ? { ...notification, read: true }
                            : notification
                    )
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Failed to mark notification as read", error);
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

    const filteredPets = useMemo(() => {
        const normalizedSearchTerm = normalizeText(searchTerm);
        const normalizedLocationQuery = normalizeText(filterCriteria.location);
        const normalizedTypeQuery = normalizeText(filterCriteria.type);
        const normalizedVaccinationQuery = normalizeText(filterCriteria.vaccinationStatus);
        const hasActiveFilters =
            normalizedSearchTerm !== "" ||
            filterCriteria.location.trim() !== "" ||
            filterCriteria.type !== "" ||
            filterCriteria.vaccinationStatus !== "" ||
            filterCriteria.minAge !== 0 ||
            filterCriteria.maxAge !== 25;

        if (!hasActiveFilters) {
            return pets;
        }

        return pets.filter(pet => {
            const ageValueMatch = String(pet.age ?? "").match(/\d+(\.\d+)?/);
            const numericAge = ageValueMatch ? Number(ageValueMatch[0]) : null;
            const ageFilterIsDefault = filterCriteria.minAge === 0 && filterCriteria.maxAge === 25;
            const petName = normalizeText(pet.name);
            const petLocation = normalizeText(pet.location);
            const petType = normalizeText(pet.type);
            const petBreed = normalizeText(pet.breed);
            const matchesSearchBar =
                normalizedSearchTerm === "" ||
                petName.includes(normalizedSearchTerm) ||
                petType.includes(normalizedSearchTerm) ||
                petBreed.includes(normalizedSearchTerm) ||
                petLocation.includes(normalizedSearchTerm);
            const matchesLocation = petLocation.includes(normalizedLocationQuery);
            const matchesType = filterCriteria.type === "" || petType === normalizedTypeQuery;
            const matchesVaccination =
                filterCriteria.vaccinationStatus === "" ||
                normalizeText(pet.vaccinationStatus) === normalizedVaccinationQuery;
            const matchesAge = numericAge === null
                ? ageFilterIsDefault
                : numericAge >= filterCriteria.minAge && numericAge <= filterCriteria.maxAge;

            return (
                matchesSearchBar &&
                matchesLocation &&
                matchesType &&
                matchesVaccination &&
                matchesAge
            );
        });
    }, [pets, filterCriteria, searchTerm]);

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
                                placeholder="Search by pet name, type, breed..." 
                                value={searchTerm}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setSearchTerm(value);
                                    setFilterCriteria((prev) => ({ ...prev, name: value }));
                                }}
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
                                                    <div className="notif-action-buttons">
                                                        {n.type === 'approval' && (
                                                            <button className="chat-now-btn" onClick={() => navigate('/messages')}>
                                                                Chat Now
                                                            </button>
                                                        )}
                                                        {!n.read && (
                                                            <button className="mark-read-btn" onClick={() => handleMarkAsRead(n._id)}>
                                                                Mark as read
                                                            </button>
                                                        )}
                                                    </div>
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
                            <div className="profile-initials">
                                {profilePicSrc ? (
                                    <img src={profilePicSrc} alt={adopterName} />
                                ) : (
                                    adopterName.charAt(0)
                                )}
                            </div>
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
                                <input
                                    type="text"
                                    id="name"
                                    placeholder="Search by pet name, type, or breed"
                                    className="filter-input"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setSearchTerm(value);
                                        setFilterCriteria((prev) => ({ ...prev, name: value }));
                                    }}
                                />
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
                            <button
                                className="filter-clear-btn"
                                onClick={() => {
                                    setSearchTerm("");
                                    setFilterCriteria({name: "", location: "", type: "", vaccinationStatus: "", minAge: 0, maxAge: 25});
                                }}
                            >
                                Clear Filters
                            </button>
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
                                const isReserved = pet.status === 'reserved';
                                const isAdopted = pet.status === 'adopted';
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
                                            <div className="pet-title-row">
                                                <h3>{pet.name}</h3>
                                                {isReserved && <span className="pet-availability-badge reserved">Reserved</span>}
                                                {isAdopted && <span className="pet-availability-badge adopted">Adopted</span>}
                                                {pet.isClinicallyApproved && (
                                                    <span className="clinical-approved-badge">
                                                        <ShieldCheck size={14} />
                                                        Clinically Approved
                                                    </span>
                                                )}
                                            </div>
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
