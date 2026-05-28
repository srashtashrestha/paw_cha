import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
    User,
    Bell,
    Edit2,
    Trash2,
    Activity,
    Stethoscope,
    Utensils
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
    const navigate = useNavigate();
    const { user } = useAuth();
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPetId, setSelectedPetId] = useState(null);
    const [activeTab, setActiveTab] = useState('vaccines'); // New Tab State
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [formData, setFormData] = useState({
        vaccineName: '',
        date: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState('');

    const fetchNotifications = useCallback(async () => {
        if (!user?.token) return;

        try {
            const response = await fetch('http://localhost:5000/api/notifications', {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });
            const data = await response.json();

            if (data.success) {
                setNotifications(data.notifications || []);
                setUnreadCount((data.notifications || []).filter((notification) => !notification.read).length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, [user?.token]);

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

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    useEffect(() => {
        const refreshNotifications = () => {
            if (document.visibilityState === 'hidden') return;
            fetchNotifications();
        };

        window.addEventListener('focus', refreshNotifications);
        document.addEventListener('visibilitychange', refreshNotifications);

        return () => {
            window.removeEventListener('focus', refreshNotifications);
            document.removeEventListener('visibilitychange', refreshNotifications);
        };
    }, [fetchNotifications]);

    const toggleNotifDropdown = () => {
        const nextState = !showNotifDropdown;
        setShowNotifDropdown(nextState);

        if (nextState) {
            fetchNotifications();
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        if (!user?.token) return;

        const targetNotification = notifications.find((notification) => notification._id === notificationId);
        if (!targetNotification || targetNotification.read) return;

        try {
            const response = await fetch(`http://localhost:5000/api/notifications/read/${notificationId}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${user.token}`
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
            console.error('Failed to mark notification as read', error);
        }
    };

    const handleNotificationAction = async (notification) => {
        if (!notification?.read) {
            await handleMarkAsRead(notification._id);
        }

        setShowNotifDropdown(false);
        navigate('/messages');
    };

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

                    <div className="petcare-header-actions">
                        <div className="notification-wrapper">
                            <button
                                type="button"
                                className={`icon-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                                onClick={toggleNotifDropdown}
                            >
                                <Bell size={22} />
                                {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
                            </button>

                            {showNotifDropdown && (
                                <div className="notif-dropdown">
                                    <div className="notif-header">
                                        <h4>Notifications</h4>
                                        {unreadCount > 0 && <span className="unread-dot"></span>}
                                    </div>
                                    {notifications.length > 0 ? (
                                        notifications.map((notification) => (
                                            <div
                                                key={notification._id}
                                                className={`notif-item ${notification.read ? 'read' : 'unread'}`}
                                            >
                                                <p>{notification.message}</p>
                                                <div className="notif-actions">
                                                    <div className="notif-action-buttons">
                                                        {notification.type === 'approval' && (
                                                            <button
                                                                type="button"
                                                                className="chat-now-btn"
                                                                onClick={() => handleNotificationAction(notification)}
                                                            >
                                                                Chat Now
                                                            </button>
                                                        )}
                                                        {!notification.read && (
                                                            <button
                                                                type="button"
                                                                className="mark-read-btn"
                                                                onClick={() => handleMarkAsRead(notification._id)}
                                                            >
                                                                Mark as read
                                                            </button>
                                                        )}
                                                    </div>
                                                    <span className="notif-time">
                                                        {new Date(notification.createdAt).toLocaleDateString()}
                                                    </span>
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
                        <div className="petcare-profile-pill">
                            <div className="petcare-profile-avatar">
                                {(user?.name || user?.fullName || 'U').charAt(0)}
                            </div>
                            <div>
                                <span className="petcare-profile-label">Care Profile</span>
                                <strong>{user?.name || user?.fullName || 'Adopter'}</strong>
                            </div>
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
                    <section className="petcare-shell pet-care-content">
                        {/* LEFT COLUMN: Pet Selector & Identity Card */}
                        <div className="pet-care-left-col">
                            <div className="pet-selector-header">
                                <select 
                                    className="pet-selector-dropdown"
                                    value={selectedPetId || ''}
                                    onChange={(e) => {
                                        setSelectedPetId(e.target.value);
                                        setFeedback('');
                                    }}
                                >
                                    {carePets.map(pet => (
                                        <option key={pet._id} value={pet._id}>
                                            {pet.name}
                                        </option>
                                    ))}
                                </select>
                                <button className="add-pet-btn" title="Add New Pet Profile">
                                    <Plus size={18} />
                                </button>
                            </div>

                            {selectedPet && (() => {
                                const statusMeta = STATUS_META[selectedPet.careStatus];
                                const StatusIcon = statusMeta.icon;

                                return (
                                    <div className="petcare-card selected fixed-card">
                                        <div className={`petcare-status-banner ${statusMeta.className}`}>
                                            <StatusIcon size={14} />
                                            <span>{statusMeta.label}</span>
                                        </div>

                                        <div className="petcare-card-body">
                                            <div className="petcare-card-media">
                                                {selectedPet.images?.[0] ? (
                                                    <img
                                                        src={`http://localhost:5000/uploads/${selectedPet.images[0]}`}
                                                        alt={selectedPet.name}
                                                    />
                                                ) : (
                                                    <div className="petcare-card-placeholder">
                                                        <ShieldCheck size={22} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="petcare-card-copy">
                                                <div className="petcare-card-title-row">
                                                    <h3>{selectedPet.name}</h3>
                                                    {selectedPet.isClinicallyApproved && (
                                                        <span className="petcare-clinical-badge">
                                                            <ShieldCheck size={14} />
                                                            Approved
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="petcare-card-meta">
                                                    {selectedPet.type} • {selectedPet.breed || 'Companion pet'}
                                                </p>
                                                <p className="petcare-card-location">
                                                    <MapPin size={14} />
                                                    {selectedPet.location}
                                                </p>
                                                <div className="petcare-card-footer">
                                                    <span>Last vaccine</span>
                                                    <strong>{formatDisplayDate(selectedPet.latestVaccination?.date)}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* RIGHT COLUMN: Tabbed Interface */}
                        {selectedPet && (
                            <div className="pet-care-right-panel">
                                <div className="petcare-tabs">
                                    <button 
                                        className={`petcare-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('overview')}
                                    >
                                        <Activity size={16} /> Overview
                                    </button>
                                    <button 
                                        className={`petcare-tab-btn ${activeTab === 'vaccines' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('vaccines')}
                                    >
                                        <ShieldCheck size={16} /> Medical
                                    </button>
                                    <button 
                                        className={`petcare-tab-btn ${activeTab === 'feeding' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('feeding')}
                                    >
                                        <Utensils size={16} /> Feeding
                                    </button>
                                    <button 
                                        className={`petcare-tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('appointments')}
                                    >
                                        <Calendar size={16} /> Schedule
                                    </button>
                                </div>

                                <aside className="petcare-detail-panel">
                                    {/* OVERVIEW TAB */}
                                    {activeTab === 'overview' && (
                                        <div className="tab-content fade-in">
                                            <div className="petcare-panel-head">
                                                <div>
                                                    <p className="petcare-panel-label">Profile Snapshot</p>
                                                    <h2>{selectedPet.name}</h2>
                                                </div>
                                                <span className={`petcare-panel-pill ${STATUS_META[selectedPet.careStatus].className}`}>
                                                    {STATUS_META[selectedPet.careStatus].label}
                                                </span>
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
                                        </div>
                                    )}

                                    {/* VACCINES TAB */}
                                    {activeTab === 'vaccines' && (
                                        <div className="tab-content fade-in">
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

                                            <section className="petcare-history-card">
                                                <div className="petcare-section-title">
                                                    <Stethoscope size={18} />
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
                                                                <div className="petcare-history-actions">
                                                                    <span className="petcare-history-chip">Logged</span>
                                                                    <button className="action-icon-btn" title="Edit Record"><Edit2 size={16} /></button>
                                                                    <button className="action-icon-btn danger" title="Delete Record"><Trash2 size={16} /></button>
                                                                </div>
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
                                        </div>
                                    )}

                                    {/* PLACEHOLDER TABS */}
                                    {activeTab === 'feeding' && (
                                        <div className="tab-content fade-in petcare-empty-state-small">
                                            <Utensils size={28} />
                                            <h3>Feeding Schedule</h3>
                                            <p>Set portion sizes and feeding times for {selectedPet.name}.</p>
                                            <button className="petcare-secondary-btn mt-3">+ Add Schedule</button>
                                        </div>
                                    )}

                                    {activeTab === 'appointments' && (
                                        <div className="tab-content fade-in petcare-empty-state-small">
                                            <Calendar size={28} />
                                            <h3>Upcoming Appointments</h3>
                                            <p>Track grooming sessions and vet visits.</p>
                                            <button className="petcare-secondary-btn mt-3">+ Book Appointment</button>
                                        </div>
                                    )}
                                </aside>
                            </div>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
};

export default PetCare;
