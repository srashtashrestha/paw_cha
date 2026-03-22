import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, MapPin, Plus, LogOut, Layout, MessageSquare, Camera, X, CheckCircle, RefreshCcw, Mail, Phone, Calendar, Check, Trash2 } from 'lucide-react';
import './DonorDashboard.css';
import logo from '../Assets/Logo/Logo.png'; 

const DonorDashboard = () => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('inventory');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formStep, setFormStep] = useState(1);
    const [inquiries, setInquiries] = useState([]); // Holds adoption requests
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [myPets, setMyPets] = useState([]);
    const [loading, setLoading] = useState(true); 
    const [selectedPetId, setSelectedPetId] = useState(null);

    const [petData, setPetData] = useState({
        name: '', type: 'Dog', breed: '', age: '', weight: '',
        location: 'Kathmandu', vaccinationStatus: 'Full',
        neuteredStatus: 'Yes', vetFollowUp: '', personality: '',
        lovesLikes: '', reasonForAdoption: ''
    });

    const donorName = user?.name || 'Donor';

    // --- FETCHING DATA ---

    const fetchMyPets = useCallback(async () => {
        if (!user?.token) return;
        setLoading(true);
        try {
            const response = await fetch("http://localhost:5000/api/donor/my-pets", {
                headers: { 
                    "Authorization": `Bearer ${user.token}`,
                    "Cache-Control": "no-cache" 
                }
            });
            if (response.status === 401) { logout(); return; }
            const result = await response.json();
            if (result.success) setMyPets(result.pets);
        } catch (error) {
            console.error("Connection error:", error);
        } finally {
            setLoading(false);
        }
    }, [user?.token, logout]);

    const fetchInquiries = useCallback(async () => {
        if (!user?.token) return;
        try {
            const response = await fetch("http://localhost:5000/api/donor/inquiries", {
                headers: { "Authorization": `Bearer ${user.token}` }
            });
            const result = await response.json();
            if (result.success) setInquiries(result.inquiries);
        } catch (error) {
            console.error("Error fetching inquiries:", error);
        }
    }, [user?.token]);

    useEffect(() => {
        if (user?.token) {
            fetchMyPets();
            fetchInquiries();
        }
    }, [fetchMyPets, fetchInquiries, user?.token]);

    // --- HANDLERS ---

    const handleStatusUpdate = async (inquiryId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:5000/api/inquiries/${inquiryId}/status`, {
                method: "PUT",
                headers: { 
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: newStatus })
            });
            const result = await response.json();
            if (result.success) {
                // Update local state so UI reflects the change immediately
                setInquiries(prev => prev.map(inv => inv._id === inquiryId ? { ...inv, status: newStatus } : inv));
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleDeletePet = async (petId) => {
        if (!window.confirm("Are you sure you want to delete this listing?")) return;
        try {
            const response = await fetch(`http://localhost:5000/api/pets/delete/${petId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${user.token}` }
            });
            if ((await response.json()).success) {
                setMyPets(prev => prev.filter(pet => pet._id !== petId));
            }
        } catch (error) { console.error(error); }
    };

    const handleInputChange = (e) => setPetData({ ...petData, [e.target.name]: e.target.value });
    const handleFileChange = (e) => setSelectedFiles(Array.from(e.target.files));

    const closeModal = () => {
        setIsModalOpen(false);
        setFormStep(1);
        setSelectedFiles([]);
        setSelectedPetId(null);
        setPetData({
            name: '', type: 'Dog', breed: '', age: '', weight: '',
            location: 'Kathmandu', vaccinationStatus: 'Full',
            neuteredStatus: 'Yes', vetFollowUp: '', personality: '',
            lovesLikes: '', reasonForAdoption: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const data = new FormData();
        Object.keys(petData).forEach(key => data.append(key, petData[key]));
        selectedFiles.forEach(file => data.append('petImages', file));

        const url = selectedPetId ? `http://localhost:5000/api/pets/update/${selectedPetId}` : "http://localhost:5000/api/pets/list";
        try {
            const response = await fetch(url, {
                method: selectedPetId ? "PUT" : "POST",
                headers: { "Authorization": `Bearer ${user.token}` },
                body: data
            });
            if ((await response.json()).success) {
                closeModal();
                fetchMyPets();
            }
        } catch (error) { console.error(error); }
    };

    const handleEditClick = (pet) => {
        setSelectedPetId(pet._id);
        setPetData({
            name: pet.name, type: pet.type, breed: pet.breed || '',
            age: pet.age, weight: pet.weight || '', location: pet.location,
            vaccinationStatus: pet.vaccinationStatus, neuteredStatus: pet.neuteredStatus,
            vetFollowUp: pet.vetFollowUp ? pet.vetFollowUp.split('T')[0] : '',
            personality: pet.personality || '', lovesLikes: pet.lovesLikes || '',
            reasonForAdoption: pet.reasonForAdoption || ''
        });
        setIsModalOpen(true);
    };

    const getPreviewImage = () => {
        if (selectedFiles.length > 0) return URL.createObjectURL(selectedFiles[0]);
        if (selectedPetId) {
            const pet = myPets.find(p => p._id === selectedPetId);
            return pet?.images?.[0] ? `http://localhost:5000/uploads/${pet.images[0]}` : null;
        }
        return null;
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="logo-section">
                     <img src={logo} alt="PawCha Logo" className="navbar-logo" style={{ marginBottom: '20px' }} />
                </div>
                <div className="donor-profile-card">
                    <div className="avatar">{donorName[0]}</div>
                    <div className="donor-meta">
                        <p className="welcome-text">Welcome back,</p>
                        <p className="donor-name">{donorName}</p>
                        <span className="status-badge verified">Verified Donor</span>
                    </div>
                </div>
                
                <nav className="nav-menu">
                    <button className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>
                        <Layout size={18} /> My Pets
                    </button>
                    <button className={activeTab === 'inquiries' ? 'active' : ''} onClick={() => setActiveTab('inquiries')}>
                        <MessageSquare size={18} /> Inquiries 
                        {inquiries.filter(i => i.status === 'pending').length > 0 && (
                            <span className="notif-dot">{inquiries.filter(i => i.status === 'pending').length}</span>
                        )}
                    </button>
                </nav>

                <button className="logout-btn" onClick={logout}>
                    <LogOut size={18} /> Logout
                </button>
            </aside>

            <main className="main-content">
                <header className="dashboard-header">
                    <div>
                        <h1>{activeTab === 'inventory' ? 'Manage Pet Listings' : 'Adoption Inquiries'}</h1>
                        <p className="subtitle">Track your listings and respond to potential adopters.</p>
                    </div>
                    <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                        <button className="refresh-btn" onClick={activeTab === 'inventory' ? fetchMyPets : fetchInquiries} title="Refresh">
                            <RefreshCcw size={18} color="#5d4037" />
                        </button>
                        <button className="add-pet-btn" onClick={() => { closeModal(); setIsModalOpen(true); }}>
                            <Plus size={20} /> List a New Pet
                        </button>
                    </div>
                </header>

                {activeTab === 'inventory' ? (
                    <div className="pet-grid">
                        {myPets.map((pet) => (
                            <div key={pet._id} className="pet-display-card">
                                <div className="pet-card-image-wrapper">
                                    {pet.images?.length > 0 ? (
                                        <img src={`http://localhost:5000/uploads/${pet.images[0]}`} alt={pet.name} />
                                    ) : ( <div className="placeholder-img"><Camera size={32} /></div> )}
                                </div>
                                <div className="pet-card-content">
                                    <h2 className="pet-card-title">{pet.name}</h2>
                                    <p className="pet-card-meta">{pet.age} • {pet.type}</p>
                                    <div className="pet-card-location"><MapPin size={14} /> <span>{pet.location}</span></div>
                                    <div className="pet-card-actions">
                                        <button className="edit-action-btn" onClick={() => handleEditClick(pet)}>Edit</button>
                                        <button className="delete-action-btn" onClick={() => handleDeletePet(pet._id)}>Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="inquiry-container">
                        {inquiries.length === 0 ? (
                            <div className="empty-state" style={{ textAlign: 'center', padding: '50px' }}>
                                <MessageSquare size={48} color="#d7ccc8" style={{ marginBottom: '10px' }} />
                                <p>No adoption inquiries yet.</p>
                            </div>
                        ) : (
                            inquiries.map((inq) => (
                                <div key={inq._id} className="inquiry-card">
                                    <div className="inquiry-header">
                                        <div className="adopter-profile">
                                            <div className="mini-avatar">{inq.adopterName?.[0] || 'A'}</div>
                                            <div>
                                                <h3>{inq.adopterName}</h3>
                                                <p className="app-for">Interested in <strong>{inq.petName}</strong></p>
                                            </div>
                                        </div>
                                        <span className={`status-pill ${inq.status}`}>{inq.status}</span>
                                    </div>
                                    
                                    <div className="inquiry-body">
                                        <div className="contact-info-row">
                                            <span><Mail size={14}/> {inq.adopterEmail}</span>
                                            <span><Calendar size={14}/> {new Date(inq.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="motivation-box">
                                            <p>"{inq.message}"</p>
                                        </div>
                                    </div>

                                    {inq.status === 'pending' && (
                                        <div className="inquiry-footer">
                                            <button className="btn-secondary" onClick={() => handleStatusUpdate(inq._id, 'rejected')}>Reject</button>
                                            <button className="btn-primary" onClick={() => handleStatusUpdate(inq._id, 'approved')}>Approve Adoption</button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* MODAL SECTION */}
                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <div>
                                    <h2>{selectedPetId ? 'Edit Pet Listing' : 'Register New Pet'}</h2>
                                    <p className="step-count">Step {formStep} of 4</p>
                                </div>
                                <button className="close-modal-x" onClick={closeModal}><X size={24} /></button>
                            </div>

                            <form className="multi-step-form" onSubmit={handleSubmit}>
                                {formStep === 1 && (
                                    <div className="form-step">
                                        <h3>Basic & Physical Info</h3>
                                        <div className="input-grid">
                                            <input type="text" name="name" value={petData.name} placeholder="Pet Name" onChange={handleInputChange} required />
                                            <select name="type" value={petData.type} onChange={handleInputChange}>
                                                <option value="Dog">Dog</option>
                                                <option value="Cat">Cat</option>
                                                <option value="Bird">Bird</option>
                                            </select>
                                            <input type="text" name="breed" value={petData.breed} placeholder="Breed" onChange={handleInputChange} />
                                            <input type="text" name="age" value={petData.age} placeholder="Age" onChange={handleInputChange} required />
                                            <input type="text" name="weight" value={petData.weight} placeholder="Weight (kg)" onChange={handleInputChange} />
                                            <input type="text" name="location" value={petData.location} placeholder="City" onChange={handleInputChange} required />
                                        </div>
                                        <div className="image-upload-zone">
                                            <Camera size={32} />
                                            <p>{selectedFiles.length > 0 ? `${selectedFiles.length} images selected` : "Upload 3-4 Photos"}</p>
                                            <input type="file" multiple accept="image/*" onChange={handleFileChange} />
                                        </div>
                                        <button type="button" className="next-btn" onClick={() => setFormStep(2)}>Next</button>
                                    </div>
                                )}
                                {/* Health, Personality, and Review steps simplified here for brevity - follow original logic */}
                                {formStep === 2 && (
                                    <div className="form-step">
                                        <h3>Medical Records</h3>
                                        <div className="input-grid">
                                            <select name="vaccinationStatus" value={petData.vaccinationStatus} onChange={handleInputChange}>
                                                <option value="Full">Vaccination: Full</option>
                                                <option value="Partial">Partial</option>
                                                <option value="None">None</option>
                                            </select>
                                            <select name="neuteredStatus" value={petData.neuteredStatus} onChange={handleInputChange}>
                                                <option value="Yes">Neutered: Yes</option>
                                                <option value="No">No</option>
                                            </select>
                                            <input type="date" name="vetFollowUp" value={petData.vetFollowUp} onChange={handleInputChange} />
                                        </div>
                                        <div className="btn-row">
                                            <button type="button" onClick={() => setFormStep(1)}>Back</button>
                                            <button type="button" className="next-btn" onClick={() => setFormStep(3)}>Next</button>
                                        </div>
                                    </div>
                                )}
                                {formStep === 3 && (
                                    <div className="form-step">
                                        <h3>About & Personality</h3>
                                        <textarea name="personality" value={petData.personality} placeholder="Personality..." onChange={handleInputChange}></textarea>
                                        <textarea name="lovesLikes" value={petData.lovesLikes} placeholder="Loves..." onChange={handleInputChange}></textarea>
                                        <textarea name="reasonForAdoption" value={petData.reasonForAdoption} placeholder="Why rehoming?" required onChange={handleInputChange}></textarea>
                                        <div className="btn-row">
                                            <button type="button" onClick={() => setFormStep(2)}>Back</button>
                                            <button type="button" className="next-btn" onClick={() => setFormStep(4)}>Review</button>
                                        </div>
                                    </div>
                                )}
                                {formStep === 4 && (
                                    <div className="form-step">
                                        <h3>Final Review</h3>
                                        <div className="review-grid">
                                            <p><strong>Name:</strong> {petData.name}</p>
                                            <p><strong>Age:</strong> {petData.age}</p>
                                            <p><strong>Location:</strong> {petData.location}</p>
                                        </div>
                                        <div className="btn-row">
                                            <button type="button" onClick={() => setFormStep(3)}>Back</button>
                                            <button type="submit" className="confirm-btn">{selectedPetId ? 'Update' : 'Publish'}</button>
                                        </div>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DonorDashboard;