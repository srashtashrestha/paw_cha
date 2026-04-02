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
    const [motivation, setMotivation] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');
    const [hasApplied, setHasApplied] = useState(false);
    const adopterName = user?.name || 'User';

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
            }

            // CHECK: Has the user already applied?
            if (user?._id) {
                const appRes = await fetch(`http://localhost:5000/api/applications/user/${user._id}`);
                const appData = await appRes.json();
                if (appData.success) {
                    const applied = appData.applications.some(app => 
                        (app.petId._id || app.petId) === id
                    );
                    setHasApplied(applied);
                }
            }
        } catch (error) {
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchPetAndStatus();
}, [id, user?._id]);

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

    return (
        <div className="pawcha-profile-container">
            <header className="profile-top-nav">
                <img src={logo} alt="PawCha" className="nav-logo" onClick={() => navigate('/adopter-dashboard')} />
                <div className="nav-actions">
                    <button className="nav-icon-btn"><Bell size={20} /></button>
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
                            <h1>Meet {pet.name}</h1>
                            <div className="utility-btns">
                                <button className="circ-action" onClick={handleShare}><Share2 size={18} /></button>
                                <button className={`circ-action ${isFavorited ? 'is-fav' : ''}`} onClick={() => setIsFavorited(!isFavorited)}>
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
                        </section>

                        <div className="description-box">
                            <h4>Description</h4>
                            <p>{pet.reasonForAdoption || pet.description || "Looking for a forever home."}</p>
                        </div>

                        <button 
    className={`apply-primary-btn ${hasApplied ? 'btn-disabled' : ''}`} 
    onClick={handleApplyToAdopt}
    disabled={hasApplied || applying}
>
    {hasApplied ? 'Application Submitted' : applying ? 'Sending...' : 'Apply to Adopt'}
</button>
                    </div>

                    <div className="visuals-panel">
                        <div className="main-img-wrap bento-card">
                            <img src={pet.images?.[0] ? `http://localhost:5000/uploads/${pet.images[0]}` : '/placeholder-pet.png'} alt={pet.name} />
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