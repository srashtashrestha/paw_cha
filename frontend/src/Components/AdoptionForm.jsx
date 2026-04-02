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
    const { user, logout } = useAuth(); // Added logout for 401 handling
    const [phone, setPhone] = useState('');

    const adopterName = user?.fullName || user?.name || 'Unauthorized User';
    const adopterEmail = user?.email || 'No Email Found';

    const handleFormSubmit = async (e) => {
        e.preventDefault(); 

        // 1. Validation
        if (!motivation.trim()) {
            alert("Please provide your motivation. This field is mandatory.");
            return;
        }

        if (!user || user.role !== 'adopter') {
            alert("Only logged-in adopters can submit applications.");
            return;
        }

        // 2. Construct the payload
        // Ensure donorId is extracted correctly as a string ID
        const rawDonorId = pet.donorId?._id || pet.donorId || pet.ownerId || pet.userId;
        
        const submissionPayload = {
            petId: pet._id || pet.id,
            petName: pet.name,
            donorId: rawDonorId, 
            adopterId: user.id || user._id, 
            adopterName: adopterName,
            adopterEmail: adopterEmail,
            phone: phone,
            motivation: motivation,
            additionalInfo: additionalInfo,
            status: 'pending'
        };

        // 3. API Call
        try {
            // If the parent component handles the API via onSubmit, call it and return
            // Otherwise, proceed with the local fetch logic below
            if (onSubmit) {
                onSubmit(submissionPayload);
                return; 
            }

            const response = await fetch("http://localhost:5000/api/inquiries/apply", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user.token}` 
                },
                body: JSON.stringify(submissionPayload)
            });

            if (response.status === 401) {
                alert("Session expired. Please login again.");
                logout();
                return;
            }

            const result = await response.json();

            if (result.success) {
                alert("Application submitted successfully!");
                onClose();
            } else {
                alert("Error: " + (result.message || "Failed to send application"));
            }
        } catch (error) {
            console.error("Submission Error:", error);
            alert("Connection Error: Is the backend server running at localhost:5000?");
        }
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
                        <p className="pet-loc"><MapPin size={14} /> {pet.location || 'Kathmandu'}</p>
                    </div>
                </div>

                <div className="reg-notice-banner">
                    <p>Using your <span className="text-purple">adopter profile</span> for this application.</p>
                </div>

                <div className="info-card">
                    <div className="info-card-header">Your Contact Details</div>
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
                            <label>Contact Number (Required for follow-up)</label>
                            <input 
                                type="text" 
                                className="bento-input-field"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+977 98XXXXXXXX"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="form-input-section">
                    <div className="input-block">
                        <label>
                            Why do you want to adopt {pet.name}? <span className="mandatory-star">*</span>
                        </label>
                        <textarea 
                            className="bento-textarea"
                            value={motivation}
                            onChange={(e) => setMotivation(e.target.value)}
                            placeholder="Tell the donor about your home and experience with pets..."
                        />
                    </div>

                    <div className="input-block">
                        <label>Additional Notes (Optional)</label>
                        <textarea 
                            className="bento-textarea"
                            value={additionalInfo}
                            onChange={(e) => setAdditionalInfo(e.target.value)}
                            placeholder="Any specific questions for the donor?"
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button 
                        className="submit-app-btn" 
                        onClick={handleFormSubmit} 
                        disabled={applying}
                        style={{ opacity: applying ? 0.7 : 1 }}
                    >
                        {applying ? 'Submitting...' : 'Confirm Application'}
                    </button>
                    <button className="save-later-btn" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default AdoptionForm;