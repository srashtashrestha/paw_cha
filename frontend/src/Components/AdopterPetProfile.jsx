import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { ChevronLeft, MapPin, Heart, Share2, CheckCircle2, Bell } from 'lucide-react';
import './AdopterPetProfile.css';
import logo from '../Assets/Logo/Logo.png';
import AdoptionForm from './AdoptionForm';

const AdopterPetProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); 
    
    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    
    const [showModal, setShowModal] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [motivation, setMotivation] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [hasApplied, setHasApplied] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const adopterName = user?.name || 'User';
    const isReservedForAnotherAdopter =
        pet?.status === 'reserved' &&
        String(pet?.reservedFor || '') !== String(user?.id || user?._id || '');
    const isAlreadyAdopted =
        pet?.status === 'adopted' &&
        String(pet?.adoptedBy || '') !== String(user?.id || user?._id || '');

    // useEffect(() => {
    //     const fetchPetDetails = async () => {
    //         try {
    //             const response = await fetch(`http://localhost:5000/api/pets/${id}`);
    //             const result = await response.json();
    //             if (result.success) {
    //                 setPet(result.pet);
    //             }
    //         } catch (error) {
    //             console.error("Fetch error:", error);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };
    //     fetchPetDetails();
    // }, [id]);

    useEffect(() => {
    const fetchPetAndStatus = async () => {
        try {
            // Fetch Pet Details
            const petRes = await fetch(`http://localhost:5000/api/pets/${id}`);
            const petData = await petRes.json();
            if (petData.success) {
                setPet(petData.pet);
                setSelectedImageIndex(0);
            }

            // CHECK: Has the user already applied?
            if (user?.id && user?.token) {
                const [appRes, favoritesRes] = await Promise.all([
                    fetch(`http://localhost:5000/api/adopter/my-inquiries`, {
                        headers: {
                            'Authorization': `Bearer ${user.token}`
                        }
                    }),
                    fetch(`http://localhost:5000/api/adopter/favorites`, {
                        headers: {
                            'Authorization': `Bearer ${user.token}`
                        }
                    })
                ]);
                const appData = await appRes.json();
                const favoritesData = await favoritesRes.json();
                if (appData.success) {
                    const applied = (appData.inquiries || []).some(app => 
                        String(app.petId?._id || app.petId) === String(id)
                    );
                    setHasApplied(applied);
                }
                if (favoritesData.success) {
                    setIsFavorited((favoritesData.favorites || []).includes(String(id)));
                }
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchPetAndStatus();
}, [id, user?.id, user?.token]);

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
                    const unread = data.notifications.filter((n) => !n.read).length;
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

    const toggleFavorite = async () => {
        if (!user?.token || !pet?._id) return;

        try {
            const response = await fetch(
                isFavorited
                    ? `http://localhost:5000/api/adopter/favorites/${pet._id}`
                    : `http://localhost:5000/api/adopter/favorites`,
                {
                    method: isFavorited ? 'DELETE' : 'POST',
                    headers: {
                        'Authorization': `Bearer ${user.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: isFavorited ? undefined : JSON.stringify({ petId: pet._id })
                }
            );

            const data = await response.json();
            if (data.success) {
                setIsFavorited((data.favorites || []).includes(String(pet._id)));
            }
        } catch (error) {
            console.error("Favorite update error:", error);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `Meet ${pet.name} on PawCha`,
            text: `Check out this adorable ${pet.type} ready for a home!`,
            url: window.location.href,
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch (err) { console.log("Share cancelled"); }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    const openInMaps = () => {
        const locationQuery = encodeURIComponent(pet.location || 'Nepal');
        window.open(`https://www.google.com/maps/search/?api=1&query=${locationQuery}`, '_blank');
    };

    const handleApplyToAdopt = () => {
        if (!user?.token) {
            alert("Please login to apply.");
            navigate('/login');
            return;
        }
        
        if (hasApplied) {
        alert("You have already submitted an application for this pet. Please check your dashboard for updates.");
        return;
    }


        setShowModal(true); 
    };

    const submitFinalApplication = async (formData) => {
    setApplying(true);
    try {
        const donorId = pet.donorId?._id || pet.donorId;

        // FIXED URL: Changed from /api/donor/inquiries to /api/inquiries/apply
        const response = await fetch(`http://localhost:5000/api/inquiries/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}` 
            },
            body: JSON.stringify({
                petId: pet._id,
                donorId: donorId,
                adopterName: adopterName, 
                adopterEmail: user.email, 
                phone: formData.phone, 
                motivation: motivation,
                additionalInfo: additionalInfo
            })
        });

        const result = await response.json();
        if (result.success) {
            alert(`Success! Your application for ${pet.name} has been sent.`);
            setShowModal(false);
            navigate('/adopter-dashboard');
        } else {
            alert(result.message || "Submission failed.");
        }
    } catch (error) {
        alert("Connection error.");
    } finally {
        setApplying(false);
    }
};

    if (loading) return <div className="loader">Loading Profile...</div>;
    if (!pet) return <div className="error-msg">Pet not found.</div>;

    const petImages = pet.images?.length ? pet.images : [];
    const selectedImage = petImages[selectedImageIndex] || petImages[0] || null;

    return (
        <div className="pawcha-profile-container">
            <header className="profile-top-nav">
                <img src={logo} alt="PawCha" className="nav-logo" onClick={() => navigate('/adopter-dashboard')} />
                <div className="nav-actions">
                    <div className="notification-wrapper">
                        <button
                            className={`nav-icon-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
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
                                    notifications.map((n) => (
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
                    <div className="nav-user-profile">
                        <div className="avatar-circle">{adopterName.charAt(0)}</div>
                        <span>{adopterName}</span>
                    </div>
                </div>
            </header>

            <main className="profile-content">
                <button className="back-link" onClick={() => navigate('/adopter-dashboard')}>
                    <ChevronLeft size={18} /> Back
                </button>

                <div className="profile-main-grid">
                    <div className="details-panel bento-card">
                        <div className="title-section">
                            <div>
                                <h1>Meet {pet.name}</h1>
                                {pet.status === 'reserved' && <span className="pet-availability-badge reserved">Reserved</span>}
                                {pet.status === 'adopted' && <span className="pet-availability-badge adopted">Adopted</span>}
                            </div>
                            <div className="utility-btns">
                                <button className="circ-action" onClick={handleShare}><Share2 size={18} /></button>
                                <button className={`circ-action ${isFavorited ? 'is-fav' : ''}`} onClick={toggleFavorite}>
                                    <Heart size={18} fill={isFavorited ? "#7c4dff" : "none"} />
                                </button>
                            </div>
                        </div>

                        <div className="quick-specs">
                            <span>{pet.type === 'Dog' ? '🐕' : '🐈'} {pet.type}</span> 
                            <span> • {pet.age} yrs</span> 
                            <span> • {pet.breed || 'Mixed'}</span>
                        </div>

                        <section className="health-card">
                            <h3>Health Status</h3>
                            <div className="health-tags">
                                <div className="h-tag"><CheckCircle2 size={16} /> {pet.vaccinationStatus || 'Vaccinated'}</div>
                                <div className="h-tag"><CheckCircle2 size={16} /> {pet.neuteredStatus || 'Neutered'}</div>
                            </div>
                            {pet.vetFollowUp && (
                                <div className="vet-note">
                                    Next follow-up: {new Date(pet.vetFollowUp).toLocaleDateString()}
                                </div>
                            )}
                        </section>

                        <div className="profile-facts-grid">
                            <div className="fact-card">
                                <span className="fact-label">Breed</span>
                                <strong>{pet.breed || 'Mixed'}</strong>
                            </div>
                            <div className="fact-card">
                                <span className="fact-label">Age</span>
                                <strong>{pet.age || 'Unknown'}</strong>
                            </div>
                            <div className="fact-card">
                                <span className="fact-label">Weight</span>
                                <strong>{pet.weight || 'Not shared'}</strong>
                            </div>
                            <div className="fact-card">
                                <span className="fact-label">Location</span>
                                <strong>{pet.location || 'Nepal'}</strong>
                            </div>
                        </div>

                        <div className="description-box">
                            <h4>Adoption Story</h4>
                            <p>{pet.reasonForAdoption || pet.description || "Looking for a forever home."}</p>
                        </div>

                        {pet.personality && (
                            <section className="personality-section">
                                <h3>Personality</h3>
                                <div className="detail-text-block">
                                    <p>{pet.personality}</p>
                                </div>
                            </section>
                        )}

                        {pet.lovesLikes && (
                            <section className="loves-section">
                                <h3>Loves & Likes</h3>
                                <div className="detail-text-block">
                                    <p>{pet.lovesLikes}</p>
                                </div>
                            </section>
                        )}

<button 
    className={`apply-primary-btn ${hasApplied ? 'btn-disabled' : ''}`} 
    onClick={handleApplyToAdopt}
    disabled={hasApplied || applying || isReservedForAnotherAdopter || isAlreadyAdopted}
>
    {hasApplied
        ? 'Application Submitted'
        : isReservedForAnotherAdopter
            ? 'Currently Reserved'
            : isAlreadyAdopted
                ? 'Already Adopted'
                : applying
                    ? 'Sending...'
                    : 'Apply to Adopt'}
</button>
                    </div>

                    <div className="visuals-panel">
                        <div className="image-gallery">
                            <div className="main-img-wrap bento-card">
                                <img
                                    src={selectedImage ? `http://localhost:5000/uploads/${selectedImage}` : '/placeholder-pet.png'}
                                    alt={pet.name}
                                />
                            </div>

                            {petImages.length > 1 && (
                                <div className="thumb-strip">
                                    {petImages.map((image, index) => (
                                        <button
                                            key={`${image}-${index}`}
                                            type="button"
                                            className={`thumb-btn ${selectedImageIndex === index ? 'active' : ''}`}
                                            onClick={() => setSelectedImageIndex(index)}
                                        >
                                            <img
                                                src={`http://localhost:5000/uploads/${image}`}
                                                alt={`${pet.name} ${index + 1}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="care-card bento-card">
                            <p className="cared-label">CARED BY:</p>
                            <div className="shelter-flex">
                                <div className="shelter-text">
                                    <h5>{pet.donorId?.fullName || pet.donorId?.name || 'Partner Shelter'}</h5>
                                    <p><MapPin size={14} /> {pet.location || 'Kathmandu, Nepal'}</p>
                                    <button className="loc-btn" onClick={openInMaps}>View on Maps</button>
                                </div>
                                <div className="map-container">
                                    <iframe
                                        title="Pet Location"
                                        src={`https://maps.google.com/maps?q=${encodeURIComponent(pet.location || 'Nepal')}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                        frameBorder="0"
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {showModal && (
                <AdoptionForm 
                    pet={pet}
                    onClose={() => setShowModal(false)}
                    onSubmit={submitFinalApplication}
                    motivation={motivation}
                    setMotivation={setMotivation}
                    additionalInfo={additionalInfo}
                    setAdditionalInfo={setAdditionalInfo}
                    applying={applying}
                />
            )}
        </div>
    );
};

export default AdopterPetProfile;
