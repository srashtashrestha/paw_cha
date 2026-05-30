import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { Search, Bell, Heart, MapPin, ChevronLeft, ChevronRight, ShieldCheck, Activity, Clock, CheckCircle2 } from 'lucide-react';
import './AdopterDashboard.css';
import AdopterSideBar from './AdopterSideBar';

const AdopterDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); 
    const [pets, setPets] = useState([]);
    const [myInquiries, setMyInquiries] = useState([]); 
    const [myAdoptedPets, setMyAdoptedPets] = useState([]); // New state for adopted pets
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
    const profilePicFile = Array.isArray(user?.profilePic)
        ? user.profilePic.find(Boolean)
        : user?.profilePic;
    const profilePicSrc = profilePicFile ? `http://localhost:5000/uploads/${profilePicFile}` : null;

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 10);
            setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
        }
    };

    const fetchData = useCallback(async () => {
        if (!user?.token) return;

        setLoading(true);
        try {
            const petResponse = await fetch("http://localhost:5000/api/pets", {
                cache: "no-store"
            });
            const petResult = await petResponse.json();

            // Fetch inquiries, favorites, AND adopted pets simultaneously
            const [inqResponse, favoritesResponse, adoptedResponse] = await Promise.all([
                fetch(`http://localhost:5000/api/adopter/my-inquiries`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                }),
                fetch(`http://localhost:5000/api/adopter/favorites`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                }),
                fetch(`http://localhost:5000/api/pets/my-adoptions`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                })
            ]);
            
            const inqResult = await inqResponse.json();
            const favoritesResult = await favoritesResponse.json();
            const adoptedResult = await adoptedResponse.json();

            if (petResult.success) setPets(petResult.pets);
            if (inqResult.success) setMyInquiries(inqResult.inquiries);
            if (favoritesResult.success) setFavorites(favoritesResult.favorites || []);
            if (adoptedResult.success) setMyAdoptedPets(adoptedResult.pets || []);

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }, [user?.token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const refreshOnFocus = () => {
            if (document.visibilityState === "hidden") return;
            fetchData();
        };

        window.addEventListener("focus", refreshOnFocus);
        document.addEventListener("visibilitychange", refreshOnFocus);

        return () => {
            window.removeEventListener("focus", refreshOnFocus);
            document.removeEventListener("visibilitychange", refreshOnFocus);
        };
    }, [fetchData]);

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

    const toggleNotifDropdown = () => {
        setShowNotifDropdown((prev) => !prev);
    };

    const handleMarkAsRead = async (notificationId) => {
        if (!user?.token) return;

        const targetNotification = notifications.find((notification) => notification._id === notificationId);
        if (!targetNotification || targetNotification.read) return;

        try {
            const response = await fetch(`http://localhost:5000/api/notifications/read/${notificationId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${user.token}`
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

    // --- State Checkers ---
    const isPetParent = myAdoptedPets.length > 0;
    const isInProcess = myInquiries.length > 0 && !isPetParent;
    const isExploring = !isPetParent && !isInProcess;

    return (
        <div className="adopter-container">
            <AdopterSideBar />

            <main className="adopter-main">
                <header className="adopter-header">
                    <div className="welcome-section">
                        <h1>
                            Welcome{isPetParent ? ' back' : ''}, <span className="highlight">{adopterName}!</span>
                        </h1>
                        {isPetParent && myAdoptedPets[0] && (
                            <p className="welcome-subtext">How is {myAdoptedPets[0].name} doing today?</p>
                        )}
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

                {!loading && !searchTerm && (
                    <section className="dashboard-widgets">
                        {/* EXPLORING STATE WIDGET */}
                        {isExploring && (
                        <div className="alert-banner exploring-banner">
                            <Heart size={20} />
                            <div>
                                <strong>Ready to find your best friend?</strong>
                                <p>Start exploring our available pets. When you find the perfect match, you can submit an inquiry to let the donor know why you'd be a great fit!</p>
                            </div>
                            <button className="banner-btn" onClick={() => navigate('/explore-pets')}>
                                Browse Pets
                            </button>
                        </div>
                    )}
                        {/* IN-PROCESS STATE WIDGET */}
                        {isInProcess && (
                            <div className="bento-widget process-widget">
                                <div className="widget-header">
                                    <h3>Application Tracker</h3>
                                    <span className="widget-kicker">You have {myInquiries.length} active application(s)</span>
                                </div>
                                <div className="pipeline-tracker">
                                    <div className="pipeline-step completed">
                                        <div className="step-icon"><CheckCircle2 size={16} /></div>
                                        <span>Submitted</span>
                                    </div>
                                    <div className="pipeline-line active"></div>
                                    <div className="pipeline-step active">
                                        <div className="step-icon"><Clock size={16} /></div>
                                        <span>Under Review</span>
                                    </div>
                                    <div className="pipeline-line"></div>
                                    <div className="pipeline-step pending">
                                        <div className="step-icon"></div>
                                        <span>Final Decision</span>
                                    </div>
                                </div>
                                <button className="widget-action-btn" onClick={() => navigate('/my-inquiries')}>
                                    Manage Applications
                                </button>
                            </div>
                        )}

                        {/* ACTIVE PET PARENT STATE WIDGET */}
                        {isPetParent && (
                            <div className="bento-widget care-widget">
                                <div className="widget-header">
                                    <h3>Care Snapshot</h3>
                                    <span className="widget-kicker">{myAdoptedPets[0].name}'s Daily Overview</span>
                                </div>
                                <div className="care-snapshot-content">
                                    <div className="care-avatar">
                                        {myAdoptedPets[0].images?.[0] ? (
                                            <img src={`http://localhost:5000/uploads/${myAdoptedPets[0].images[0]}`} alt="Pet" />
                                        ) : (
                                            <Activity size={24} color="var(--primary-gold)" />
                                        )}
                                    </div>
                                    <div className="care-details">
                                        <p><strong>Vaccination Status:</strong> Up to Date</p>
                                        <p><strong>Next Reminder:</strong> No upcoming tasks</p>
                                    </div>
                                </div>
                                <button className="widget-action-btn" onClick={() => navigate('/pet-care')}>
                                    Open Pet Care Portal
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {/* THE ORIGINAL CAROUSEL (Always visible, pushes down naturally) */}
                <section className="listings-section" style={{ position: 'relative', marginTop: (!loading && !searchTerm && !isExploring) ? '3rem' : '0' }}>
                    <div className="section-header">
                        <h2>{searchTerm ? "Search Results" : (isPetParent ? "Looking for a sibling?" : "Recently Added Pets")}</h2>
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
                                        <div className="pet-title-row">
                                            <h3>{pet.name}</h3>
                                            {pet.status === 'reserved' && (
                                                <span className="pet-availability-badge reserved">Reserved</span>
                                            )}
                                            {pet.status === 'adopted' && (
                                                <span className="pet-availability-badge adopted">Adopted</span>
                                            )}
                                            {pet.isClinicallyApproved && (
                                                <span className="clinical-approved-badge">
                                                    <ShieldCheck size={14} />
                                                    Clinically Approved
                                                </span>
                                            )}
                                        </div>
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
