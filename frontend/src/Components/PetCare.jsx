import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AdopterSideBar from './AdopterSideBar';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock3,
    Mail,
    MapPin,
    Plus,
    ShieldCheck,
    User
} from 'lucide-react';
import './PetCare.css';

const STATUS_META = {
    upToDate: {
        label: 'Up to Date',
        className: 'up-to-date',
        icon: CheckCircle2
    },
    dueSoon: {
        label: 'Due Soon',
        className: 'due-soon',
        icon: Clock3
    },
    overdue: {
        label: 'Overdue',
        className: 'overdue',
        icon: AlertTriangle
    }
};

const getSortedVaccinationHistory = (history = []) =>
    [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

const getPetCareStatus = (history = []) => {
    const sortedHistory = getSortedVaccinationHistory(history);
    const latestRecord = sortedHistory[0];

    if (!latestRecord?.date) {
        return {
            key: 'overdue',
            latestRecord: null
        };
    }

    const lastVaccinatedAt = new Date(latestRecord.date);
    const now = new Date();
    const elevenMonthMark = new Date(lastVaccinatedAt);
    const twelveMonthMark = new Date(lastVaccinatedAt);

    elevenMonthMark.setMonth(elevenMonthMark.getMonth() + 11);
    twelveMonthMark.setMonth(twelveMonthMark.getMonth() + 12);

    if (now < elevenMonthMark) {
        return { key: 'upToDate', latestRecord };
    }

    if (now <= twelveMonthMark) {
        return { key: 'dueSoon', latestRecord };
    }

    return { key: 'overdue', latestRecord };
};

const formatDisplayDate = (value) => {
    if (!value) return 'No record yet';
    return new Date(value).toLocaleDateString();
};

const PetCare = () => {
    const { user } = useAuth();
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPetId, setSelectedPetId] = useState(null);
    const [formData, setFormData] = useState({
        vaccineName: '',
        date: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        const fetchAdoptedPets = async () => {
            if (!user?.token) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('http://localhost:5000/api/pets/my-adoptions', {
                    headers: {
                        Authorization: `Bearer ${user.token}`
                    }
                });
                const data = await response.json();

                if (data.success) {
                    setPets(data.pets || []);
                    setSelectedPetId((data.pets || [])[0]?._id || null);
                } else {
                    setFeedback(data.message || 'Unable to load pet care details right now.');
                }
            } catch (error) {
                console.error('Pet care fetch error:', error);
                setFeedback('Unable to load pet care details right now.');
            } finally {
                setLoading(false);
            }
        };

        fetchAdoptedPets();
    }, [user?.token]);

    const carePets = useMemo(
        () =>
            pets.map((pet) => {
                const status = getPetCareStatus(pet.vaccinationHistory);
                return {
                    ...pet,
                    careStatus: status.key,
                    latestVaccination: status.latestRecord,
                    sortedVaccinationHistory: getSortedVaccinationHistory(pet.vaccinationHistory)
                };
            }),
        [pets]
    );

    const selectedPet = useMemo(
        () => carePets.find((pet) => pet._id === selectedPetId) || carePets[0] || null,
        [carePets, selectedPetId]
    );

    useEffect(() => {
        if (!carePets.length) {
            setSelectedPetId(null);
            return;
        }

        if (!selectedPetId || !carePets.some((pet) => pet._id === selectedPetId)) {
            setSelectedPetId(carePets[0]._id);
        }
    }, [carePets, selectedPetId]);

    const handleVaccinationSubmit = async (event) => {
        event.preventDefault();
        if (!selectedPet || !user?.token) return;

        setSubmitting(true);
        setFeedback('');

        try {
            const response = await fetch(`http://localhost:5000/api/pets/${selectedPet._id}/vaccinate`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                setPets((prev) =>
                    prev.map((pet) => (pet._id === data.pet._id ? data.pet : pet))
                );
                setSelectedPetId(data.pet._id);
                setFormData({ vaccineName: '', date: '' });
                setFeedback('Vaccination history updated successfully.');
            } else {
                setFeedback(data.message || 'Unable to save vaccination details.');
            }
        } catch (error) {
            console.error('Vaccination update error:', error);
            setFeedback('Unable to save vaccination details.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="adopter-container">
            <AdopterSideBar />

            <main className="adopter-main petcare-main">
                <header className="petcare-header">
                    <div>
                        <p className="petcare-eyebrow">Adopter Care</p>
                        <h1>Pet Care</h1>
                        <p className="petcare-subtitle">
                            Track adopted pets, monitor vaccination timelines, and keep care records tidy.
                        </p>
                    </div>

                    <div className="petcare-profile-pill">
                        <div className="petcare-profile-avatar">
                            {(user?.name || user?.fullName || 'U').charAt(0)}
                        </div>
                        <div>
                            <span className="petcare-profile-label">Care Profile</span>
                            <strong>{user?.name || user?.fullName || 'Adopter'}</strong>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <section className="petcare-empty-state">
                        <ShieldCheck size={34} />
                        <h2>Loading pet care records...</h2>
                    </section>
                ) : carePets.length === 0 ? (
                    <section className="petcare-empty-state">
                        <ShieldCheck size={34} />
                        <h2>No adopted pets yet</h2>
                        <p>Your Pet Care tab will light up here as soon as an adoption is linked to your profile.</p>
                    </section>
                ) : (
                    <section className="petcare-shell">
                        <div className="petcare-bento-grid">
                            {carePets.map((pet) => {
                                const statusMeta = STATUS_META[pet.careStatus];
                                const StatusIcon = statusMeta.icon;
                                const isSelected = selectedPet?._id === pet._id;

                                return (
                                    <button
                                        key={pet._id}
                                        type="button"
                                        className={`petcare-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedPetId(pet._id);
                                            setFeedback('');
                                        }}
                                    >
                                        <div className={`petcare-status-banner ${statusMeta.className}`}>
                                            <StatusIcon size={14} />
                                            <span>{statusMeta.label}</span>
                                        </div>

                                        <div className="petcare-card-body">
                                            <div className="petcare-card-media">
                                                {pet.images?.[0] ? (
                                                    <img
                                                        src={`http://localhost:5000/uploads/${pet.images[0]}`}
                                                        alt={pet.name}
                                                    />
                                                ) : (
                                                    <div className="petcare-card-placeholder">
                                                        <ShieldCheck size={22} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="petcare-card-copy">
                                                <div className="petcare-card-title-row">
                                                    <h3>{pet.name}</h3>
                                                    {pet.isClinicallyApproved && (
                                                        <span className="petcare-clinical-badge">
                                                            <ShieldCheck size={14} />
                                                            Clinically Approved
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="petcare-card-meta">
                                                    {pet.type} • {pet.breed || 'Companion pet'}
                                                </p>
                                                <p className="petcare-card-location">
                                                    <MapPin size={14} />
                                                    {pet.location}
                                                </p>
                                                <div className="petcare-card-footer">
                                                    <span>Last vaccine</span>
                                                    <strong>{formatDisplayDate(pet.latestVaccination?.date)}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {selectedPet && (
                            <aside className="petcare-detail-panel">
                                <div className="petcare-panel-head">
                                    <div>
                                        <p className="petcare-panel-label">Medical Overview</p>
                                        <h2>{selectedPet.name}</h2>
                                    </div>
                                    <span className={`petcare-panel-pill ${STATUS_META[selectedPet.careStatus].className}`}>
                                        {STATUS_META[selectedPet.careStatus].label}
                                    </span>
                                </div>

                                <div className="petcare-detail-grid">
                                    <div className="petcare-detail-card">
                                        <span className="petcare-detail-kicker">Latest Vaccine</span>
                                        <strong>{selectedPet.latestVaccination?.vaccineName || 'No vaccine logged yet'}</strong>
                                        <p>{formatDisplayDate(selectedPet.latestVaccination?.date)}</p>
                                    </div>

                                    <div className="petcare-detail-card">
                                        <span className="petcare-detail-kicker">Vaccination Count</span>
                                        <strong>{selectedPet.sortedVaccinationHistory.length}</strong>
                                        <p>Entries stored in your care history</p>
                                    </div>
                                </div>

                                <section className="petcare-contact-card">
                                    <div className="petcare-section-title">
                                        <User size={18} />
                                        <h3>Original Donor</h3>
                                    </div>

                                    <div className="petcare-contact-row">
                                        <div className="petcare-contact-avatar">
                                            {(selectedPet.donorId?.fullName || 'D').charAt(0)}
                                        </div>
                                        <div>
                                            <strong>{selectedPet.donorId?.fullName || 'Donor unavailable'}</strong>
                                            <p>Original caregiver contact</p>
                                        </div>
                                    </div>

                                    <div className="petcare-contact-info">
                                        <span>
                                            <Mail size={14} />
                                            {selectedPet.donorId?.email || 'Email not available'}
                                        </span>
                                        <span>
                                            <Calendar size={14} />
                                            Adopted care records ready
                                        </span>
                                    </div>
                                </section>

                                <section className="petcare-history-card">
                                    <div className="petcare-section-title">
                                        <Calendar size={18} />
                                        <h3>Vaccination History</h3>
                                    </div>

                                    {selectedPet.sortedVaccinationHistory.length > 0 ? (
                                        <div className="petcare-history-list">
                                            {selectedPet.sortedVaccinationHistory.map((record, index) => (
                                                <div key={`${record.date}-${record.vaccineName}-${index}`} className="petcare-history-item">
                                                    <div>
                                                        <strong>{record.vaccineName}</strong>
                                                        <p>{formatDisplayDate(record.date)}</p>
                                                    </div>
                                                    <span className="petcare-history-chip">Logged</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="petcare-history-empty">
                                            No vaccinations logged yet for this pet.
                                        </div>
                                    )}
                                </section>

                                <section className="petcare-log-card">
                                    <div className="petcare-section-title">
                                        <Plus size={18} />
                                        <h3>Log New Vaccination</h3>
                                    </div>

                                    <form className="petcare-form" onSubmit={handleVaccinationSubmit}>
                                        <div className="petcare-form-row">
                                            <label htmlFor="vaccineName">Vaccine Name</label>
                                            <input
                                                id="vaccineName"
                                                type="text"
                                                value={formData.vaccineName}
                                                onChange={(event) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        vaccineName: event.target.value
                                                    }))
                                                }
                                                placeholder="e.g. Annual booster"
                                                required
                                            />
                                        </div>

                                        <div className="petcare-form-row">
                                            <label htmlFor="vaccineDate">Vaccination Date</label>
                                            <input
                                                id="vaccineDate"
                                                type="date"
                                                value={formData.date}
                                                onChange={(event) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        date: event.target.value
                                                    }))
                                                }
                                                required
                                            />
                                        </div>

                                        {feedback && <p className="petcare-feedback">{feedback}</p>}

                                        <button
                                            type="submit"
                                            className="petcare-primary-btn"
                                            disabled={submitting}
                                        >
                                            {submitting ? 'Saving...' : 'Save Vaccination Record'}
                                        </button>
                                    </form>
                                </section>
                            </aside>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
};

export default PetCare;
