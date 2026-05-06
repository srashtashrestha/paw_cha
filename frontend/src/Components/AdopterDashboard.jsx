import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { Search, Bell, Heart, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import './AdopterDashboard.css';
import AdopterSideBar from './AdopterSideBar';

const AdopterDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); 
    const [pets, setPets] = useState([]);
    const [myInquiries, setMyInquiries] = useState([]); 
    const scrollRef = useRef(null);
    
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const [favorites, setFavorites] = useState([]);
    
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    // --- Notification States ---
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    
    const adopterName = user?.role === 'adopter' ? user.name : 'User';

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 10);
            setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
        }
    };

    // Original Data Fetching
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const petResponse = await fetch("http://localhost:5000/api/admin/all-pets");
                const petResult = await petResponse.json();
                
                const [inqResponse, favoritesResponse] = await Promise.all([
                    fetch(`http://localhost:5000/api/adopter/my-inquiries`, {
                        headers: { 'Authorization': `Bearer ${user.token}` }
                    }),
                    fetch(`http://localhost:5000/api/adopter/favorites`, {
                        headers: { 'Authorization': `Bearer ${user.token}` }
                    })
                ]);
                const inqResult = await inqResponse.json();
                const favoritesResult = await favoritesResponse.json();

                if (petResult.success) setPets(petResult.pets);
                if (inqResult.success) setMyInquiries(inqResult.inquiries);
                if (favoritesResult.success) setFavorites(favoritesResult.favorites || []);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.token) fetchData();
    }, [user]);

    // --- Notification Logic ---
    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user?.token) return;

            try {
                const response = await fetch(`http://localhost:5000/api/notifications`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
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
    }, [user?.token]);

    const toggleNotifDropdown = async () => {
        const nextState = !showNotifDropdown;
        setShowNotifDropdown(nextState);

        if (nextState && unreadCount > 0) {
            if (!user?.token) return;

            try {
                setUnreadCount(0);
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));

                await fetch(`http://localhost:5000/api/notifications/mark-all-read`, {
                    method: 'PUT',
                    headers: { 
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json' 
                    }
                });
            } catch (err) {
                console.error("Failed to sync notification status", err);
            }
        }
    };

    useEffect(() => {
        handleScroll();
        window.addEventListener('resize', handleScroll);
        return () => window.removeEventListener('resize', handleScroll);
    }, [pets, loading]);

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
        return [...pets]
            .reverse() 
            .filter(pet => !myInquiries.some(inquiry => inquiry.petId?._id === pet._id))
            .filter(pet => 
                pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pet.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pet.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [searchTerm, pets, myInquiries]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="adopter-container">
            <AdopterSideBar />

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
                        
                        {/* Updated Notification Bell & Wrapper */}
                        <div className="notification-wrapper">
                            <button 
                                className={`icon-btn ${unreadCount > 0 ? 'has-unread' : ''}`} 
                                onClick={toggleNotifDropdown}
                            >
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

                <section className="listings-section" style={{ position: 'relative' }}>
                    <div className="section-header">
                        <h2>{searchTerm ? "Search Results" : "Recently Added Pets"}</h2>
                        <button className="explore-all-btn" onClick={() => navigate('/explore-pets')}>
                            Explore All
                        </button>
                    </div>

                    {!loading && filteredPets.length > 0 && (
                        <>
                            {showLeftArrow && (
                                <button className="scroll-arrow-btn left" onClick={() => scroll('left')}>
                                    <ChevronLeft size={24} />
                                </button>
                            )}
                            {showRightArrow && (
                                <button className="scroll-arrow-btn right" onClick={() => scroll('right')}>
                                    <ChevronRight size={24} />
                                </button>
                            )}
                        </>
                    )}

                    <div 
                        className="pets-scroll-grid" 
                        ref={scrollRef}
                        onScroll={handleScroll}
                    >
                        {loading ? (
                            <div className="status-msg">Loading pets...</div>
                        ) : filteredPets.length > 0 ? (
                            filteredPets.map(pet => (
                                <div key={pet._id} className="pet-item-card">
                                    <div className="pet-thumb">
                                        <img 
                                            src={pet.images?.[0] ? `http://localhost:5000/uploads/${pet.images[0]}` : '/placeholder.png'} 
                                            alt={pet.name} 
                                        />
                                        <button 
                                            className={`fav-overlay ${favorites.includes(pet._id) ? 'is-fav' : ''}`}
                                            onClick={(e) => toggleFavorite(e, pet._id)}
                                        >
                                            <Heart 
                                                size={18} 
                                                fill={favorites.includes(pet._id) ? "#7c4dff" : "none"} 
                                                color={favorites.includes(pet._id) ? "#7c4dff" : "currentColor"}
                                            />
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
                            <div className="status-msg">
                                {searchTerm ? "No pets found matching your search." : "You've applied for all available pets!"}
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AdopterDashboard;
