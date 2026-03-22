import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 1. Professional Import
import { ChevronLeft, MapPin, Heart, Share2, CheckCircle2, Bell } from 'lucide-react';
import './AdopterPetProfile.css';
import logo from '../Assets/Logo/Logo.png';
import AdoptionForm from './AdoptionForm';

const AdopterPetProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // 2. Get user from Context
    
    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [isFavorited, setIsFavorited] = useState(false);
    
    const [showModal, setShowModal] = useState(false);
    const [motivation, setMotivation] = useState('');
    const [additionalInfo, setAdditionalInfo] = useState('');

    // 3. Security Check: Use Context name instead of localStorage
    const adopterName = user?.name || 'User';

    useEffect(() => {
        const fetchPetDetails = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/pets/${id}`);
                const result = await response.json();
                if (result.success) {
                    setPet(result.pet);
                }
            } catch (error) {
                console.error("Fetch error:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPetDetails();
    }, [id]);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Meet ${pet.name} on PawCha`,
                    text: `Check out this adorable ${pet.type} ready for a home!`,
                    url: window.location.href,
                });
            } catch (err) { console.log("Share failed"); }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    const toggleFavorite = () => setIsFavorited(!isFavorited);

    const openInMaps = () => {
        const locationQuery = encodeURIComponent(`${pet.location || 'Nepal'}`);
        window.open(`https://www.google.com/maps/search/?api=1&query=${locationQuery}`, '_blank');
    };

    const handleApplyToAdopt = () => {
        // 4. Use Context check for token
        if (!user?.token) {
            alert("Please login to apply.");
            navigate('/login');
            return;
        }
        setShowModal(true); 
    };

    const submitFinalApplication = async (formData) => {
        // formData now contains { phone, motivation, additionalInfo } from the Modal
        setApplying(true);
        try {
            const response = await fetch(`http://localhost:5000/api/donor/inquiries`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}` // 5. Use token from Context
                },
                body: JSON.stringify({
                    petId: pet._id,
                    donorId: pet.donorId._id,
                    adopterName: adopterName, 
                    motivation: motivation,
                    additionalInfo: additionalInfo,
                    phone: formData.phone, // Include the phone number from the form
                    message: `I am interested in adopting ${pet.name}!`
                })
            });

            const result = await response.json();
            if (result.success) {
                alert(`Success! Your application for ${pet.name} has been sent.`);
                setShowModal(false);
                navigate('/adopter-dashboard');
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
                <img src={logo} alt="PawCha" className="nav-logo" onClick={() => navigate('/adopter-dashboard')} style={{cursor: 'pointer'}} />
                <div className="nav-actions">
                    <button className="nav-icon-btn"><Bell size={20} /></button>
                    <div className="nav-user-profile">
                        <div className="avatar-circle">{adopterName.charAt(0)}</div>
                        <span>{adopterName} ▾</span>
                    </div>
                </div>
            </header>

            <main className="profile-content">
                <button className="back-link" onClick={() => navigate('/adopter-dashboard')}>
                    <ChevronLeft size={18} /> Back to Dashboard
                </button>

                <div className="profile-main-grid">
                    <div className="details-panel">
                        <div className="title-section">
                            <h1>Meet {pet.name}</h1>
                            <div className="utility-btns">
                                <button className="circ-action" onClick={handleShare}><Share2 size={18} /></button>
                                <button className={`circ-action ${isFavorited ? 'is-fav' : ''}`} onClick={toggleFavorite}>
                                    <Heart size={18} fill={isFavorited ? "#7c4dff" : "none"} color={isFavorited ? "#7c4dff" : "currentColor"} />
                                </button>
                            </div>
                        </div>

                        <div className="quick-specs">
                            <span>{pet.type === 'Dog' ? '🐕' : '🐈'} {pet.type}</span> 
                            {pet.age && <span> • {pet.age} yrs</span>} 
                            {pet.weight && <span> • {pet.weight} kg</span>}
                        </div>

                        <section className="health-card">
                            <h3>Basic Health</h3>
                            <div className="health-tags">
                                <div className="h-tag"><CheckCircle2 size={16} color="#4caf50" /> {pet.vaccinationStatus || 'Partial'}</div>
                                <div className="h-tag"><CheckCircle2 size={16} color="#4caf50" /> {pet.neuteredStatus || 'Yes'}</div>
                            </div>
                        </section>

                        <div className="description-box">
                            <h4>Why {pet.name} needs adoption?</h4>
                            <p>{pet.reasonForAdoption || "Lost & Found"}</p>
                        </div>

                        <button className="apply-primary-btn" onClick={handleApplyToAdopt}>Apply to Adopt</button>
                    </div>

                    <div className="visuals-panel">
                        <div className="image-gallery">
                            <div className="main-img-wrap">
                                <img src={pet.images?.[0] ? `http://localhost:5000/uploads/${pet.images[0]}` : '/placeholder-pet.png'} alt={pet.name} />
                            </div>
                        </div>

                        <div className="care-card">
                            <p className="cared-label">I AM BEING CARED BY:</p>
                            <div className="shelter-flex">
                                <div className="shelter-text">
                                    <h5>{pet.donorId?.fullName || 'Shelter Partner'}</h5>
                                    <p><MapPin size={14} /> {pet.location || 'Nepal'}</p>
                                    <button className="loc-btn" onClick={openInMaps}>View Location</button>
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