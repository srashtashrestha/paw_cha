    import React, { useState } from 'react';
    import { X, MapPin } from 'lucide-react';
    import { useAuth } from '../context/AuthContext'; 
    import './AdoptionForm.css';

    const AdoptionForm = ({ 
        pet, 
        onClose, 
        onSubmit, 
        motivation, 
        setMotivation, 
        additionalInfo, 
        setAdditionalInfo, 
        applying 
    }) => {
        const { user } = useAuth();
        
        const adopterName = user?.role === 'adopter' ? user.name : 'Unauthorized User';
        const adopterEmail = user?.role === 'adopter' ? user.email : 'No Adopter Email Found';

        const [phone, setPhone] = useState('');

        // --- FUNCTIONAL SUBMIT HANDLER ---
        const handleFormSubmit = (e) => {
            e.preventDefault(); // Prevent page refresh

            // 1. Validation
            if (!motivation.trim()) {
                alert("Please provide your motivation. This field is mandatory.");
                return;
            }

            if (user?.role !== 'adopter') {
                alert("Only logged-in adopters can submit applications.");
                return;
            }

            // 2. Construct the full data object for the backend
            const submissionPayload = {
                petId: pet._id || pet.id,      // Ensure we get the DB ID
                petName: pet.name,
                donorId: pet.ownerId || pet.userId, // This is Barsha (the donor)
                adopterId: user.id,            // This is Anushree (the adopter)
                adopterName: adopterName,
                adopterEmail: adopterEmail,
                phone: phone,
                motivation: motivation,
                additionalInfo: additionalInfo,
                status: 'pending',
                submittedAt: new Date().toISOString()
            };

            // 3. Trigger the parent's onSubmit function
            // This will now carry the full payload to your API call in the parent component
            onSubmit(submissionPayload);
        };

        return (
            <div className="modal-overlay">
                <div className="apply-modal-card">
                    <button className="close-modal" onClick={onClose} aria-label="Close">
                        <X size={24} />
                    </button>
                    
                    <h2 className="modal-header-title">Apply to Adopt - {pet.name}</h2>

                    <div className="pet-summary-card">
                        <img 
                            src={pet.images?.[0] ? `http://localhost:5000/uploads/${pet.images[0]}` : '/placeholder-pet.png'} 
                            alt={pet.name} 
                            className="summary-img"
                        />
                        <div className="summary-details">
                            <h3>{pet.name}</h3>
                            <p className="pet-meta">{pet.age} yrs | {pet.breed || pet.type}</p>
                            <p className="pet-loc"><MapPin size={14} /> {pet.location || 'Location not specified'}</p>
                        </div>
                    </div>

                    <div className="reg-notice-banner">
                        <p>We'll use your <span className="text-purple">registration details</span> to apply. You can review them below.</p>
                    </div>

                    <div className="info-card">
                        <div className="info-card-header">Personal Information</div>
                        <div className="info-card-content">
                            <div className="fixed-field">
                                <span className="field-label">Name:</span>
                                <span className="field-value">{adopterName}</span>
                            </div>
                            <div className="fixed-field">
                                <span className="field-label">Email:</span>
                                <span className="field-value">{adopterEmail}</span>
                            </div>
                            
                            <div className="optional-phone-section">
                                <label>Phone (Optional)</label>
                                <input 
                                    type="text" 
                                    className="bento-input-field"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+977 98XXXXXXXX"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-input-section">
                        <div className="input-block">
                            <label>
                                Why do you think {pet.name} is good for you? <span className="mandatory-star">*</span>
                            </label>
                            <textarea 
                                className="bento-textarea"
                                value={motivation}
                                onChange={(e) => setMotivation(e.target.value)}
                                placeholder="Write your motivation here..."
                            />
                        </div>

                        <div className="input-block">
                            <label>Anything else you'd like the shelter to know? (Optional)</label>
                            <textarea 
                                className="bento-textarea"
                                value={additionalInfo}
                                onChange={(e) => setAdditionalInfo(e.target.value)}
                                placeholder="Write a few sentences..."
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button 
                            className="submit-app-btn" 
                            onClick={handleFormSubmit} 
                            disabled={applying}
                            style={{ cursor: applying ? 'not-allowed' : 'pointer' }}
                        >
                            {applying ? 'Submitting...' : 'Submit Application'}
                        </button>
                        <button className="save-later-btn" onClick={onClose}>Save & Finish Later</button>
                    </div>
                </div>
            </div>
        );
    };

    export default AdoptionForm;