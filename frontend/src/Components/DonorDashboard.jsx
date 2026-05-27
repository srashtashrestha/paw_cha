import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, Plus, LogOut, Layout, MessageSquare, Camera, X, RefreshCcw, Mail, Phone, Calendar, ChevronLeft, Send, Bell } from 'lucide-react';
import './DonorDashboard.css';
import logo from '../Assets/Logo/Logo.png'; 
import { io } from 'socket.io-client';
// const socket = io("http://localhost:5000");

const DonorDashboard = () => {
    const { user, logout } = useAuth();
    console.log("Full User Object from Context:", user);
    const socket = useRef(null);
    const [activeTab, setActiveTab] = useState('inventory');
    const [activeChat, setActiveChat] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formStep, setFormStep] = useState(1);
    const [inquiries, setInquiries] = useState([]); 
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [verificationFile, setVerificationFile] = useState(null);
    const [myPets, setMyPets] = useState([]);
    const [selectedPetId, setSelectedPetId] = useState(null);

    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const messagesEndRef = useRef(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const [petData, setPetData] = useState({
        name: '', type: 'Dog', breed: '', age: '', weight: '',
        location: 'Kathmandu', vaccinationStatus: 'Full',
        neuteredStatus: 'Yes', vetFollowUp: '', personality: '',
        lovesLikes: '', reasonForAdoption: ''
    });

    const donorName = user?.name || 'Donor';
    const getStatusConfirmationLabel = (status) => {
        if (status === "approved") return "approve this inquiry for chat";
        if (status === "finalized") return "finalize this adoption";
        if (status === "declined") return "decline this reserved adoption";
        if (status === "rejected") return "reject this inquiry";
        return `${status} this inquiry`;
    };

    // --- FETCHING DATA ---
    

    const fetchMyPets = useCallback(async () => {
        if (!user?.token) return;
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

    const fetchMessages = useCallback(async (inquiryId) => {
        if (!user?.token || !inquiryId) return;
        try {
            const response = await fetch(`http://localhost:5000/api/messages/${inquiryId}`, {
                headers: { "Authorization": `Bearer ${user.token}` }
            });
            const result = await response.json();
            // Check if backend returns 'messages' or 'data'
            if (result.success) {
                setChatMessages(result.messages || result.data || []);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    }, [user?.token]);

    useEffect(() => {
        if (user?.token) {
            // Replace with your actual backend URL
            socket.current = io("http://localhost:5000", {
                auth: { token: user.token }
            });

            socket.current.on("connect", () => {
                console.log("Connected to socket:", socket.current.id);
            });

            // Cleanup on unmount
            return () => {
                if (socket.current) socket.current.disconnect();
            };
        }
    }, [user?.token]);

    useEffect(() => {
        if (user?.token) {
            fetchMyPets();
            fetchInquiries();
        }
    }, [fetchMyPets, fetchInquiries, user?.token]);

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user?.token) return;

            try {
                const response = await fetch("http://localhost:5000/api/notifications", {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                const result = await response.json();

                if (result.success) {
                    setNotifications(result.notifications || []);
                    setUnreadCount((result.notifications || []).filter((notification) => !notification.read).length);
                }
            } catch (error) {
                console.error("Error fetching donor notifications:", error);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 15000);
        return () => clearInterval(interval);
    }, [user?.token]);

    // NEW: Effect to fetch messages when tab or activeChat changes
    useEffect(() => {
        if (activeTab === 'chat' && activeChat?._id) {
            fetchMessages(activeChat._id);
        }
    }, [activeTab, activeChat?._id, fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);


useEffect(() => {
    if (!socket.current) return;
    if (!activeChat?._id) return;

    const handleNewMessage = (msg) => {
        const incomingChatId = String(msg.chatId || msg.inquiryId);
        const currentChatId = String(activeChat._id);

        if (incomingChatId !== currentChatId) return;

        setChatMessages((prev) => {
            const exists = prev.find((m) => {
                if (msg._id && m._id) return m._id === msg._id;

                const existingSenderId = String(m.senderId?._id || m.senderId);
                const incomingSenderId = String(msg.senderId?._id || msg.senderId);

                return (
                    m.text === msg.text &&
                    existingSenderId === incomingSenderId &&
                    m.createdAt === msg.createdAt
                );
            });

            if (exists) return prev;
            return [...prev, msg];
        });
    };

    socket.current.on("receive_message", handleNewMessage);
    return () => socket.current.off("receive_message", handleNewMessage);
}, [activeChat]);

useEffect(() => {
    if (!socket.current) return;

    const handleIncomingNotification = (notification) => {
        setNotifications((prev) => {
            const exists = prev.some((item) => item._id === notification._id);
            if (exists) return prev;
            return [notification, ...prev];
        });

        setUnreadCount((prev) => {
            if (notification.read) return prev;
            return prev + 1;
        });

        fetchInquiries();
    };

    socket.current.on("notification_created", handleIncomingNotification);
    return () => socket.current.off("notification_created", handleIncomingNotification);
}, [fetchInquiries]);

    const toggleNotifDropdown = () => {
        setShowNotifDropdown((prev) => !prev);
    };

    const handleMarkNotificationRead = async (notificationId) => {
        if (!user?.token) return;

        const targetNotification = notifications.find((notification) => notification._id === notificationId);
        if (!targetNotification || targetNotification.read) return;

        try {
            const response = await fetch(`http://localhost:5000/api/notifications/read/${notificationId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });
            const result = await response.json();

            if (result.success) {
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
            console.error("Failed to mark donor notification as read:", error);
        }
    };

    const handleNotificationAction = () => {
        setShowNotifDropdown(false);
        setActiveTab("inquiries");
    };
    // --- HANDLERS ---

    const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    const messageData = {
        chatId: activeChat._id,
        text: newMessage
    };

    const savedMsg = newMessage;
    setNewMessage("");

    try {
        const response = await fetch("http://localhost:5000/api/messages/send", {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${user.token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(messageData)
        });
        
        const result = await response.json();
        if (!result.success) {
            setNewMessage(savedMsg);
            alert("Message failed to send.");
        }
    } catch (error) {
        console.error("Error sending message:", error);
        setNewMessage(savedMsg);
    }
};

    const handleStatusUpdate = async (inquiryId, newStatus) => {
        if (!window.confirm(`Are you sure you want to ${getStatusConfirmationLabel(newStatus)}?`)) return;

        try {
            const response = await fetch(`http://localhost:5000/api/inquiries/status/${inquiryId}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${user.token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status: newStatus })
            });
            const result = await response.json();

            if (result.success) {
                const currentInquiry = inquiries.find((inv) => inv._id === inquiryId);
                const resolvedStatus = result.inquiry?.status || newStatus;
                const nextInquiry = currentInquiry
                    ? {
                        ...currentInquiry,
                        ...(result.inquiry || {}),
                        petId: result.inquiry?.petId || currentInquiry.petId,
                        adopterId: result.inquiry?.adopterId || currentInquiry.adopterId,
                        status: resolvedStatus
                    }
                    : null;

                setInquiries((prev) =>
                    prev.map((inv) => {
                        if (inv._id !== inquiryId) return inv;
                        return nextInquiry || { ...inv, ...(result.inquiry || {}), status: resolvedStatus };
                    })
                );

                setActiveChat((prev) => {
                    if (!prev || prev._id !== inquiryId) return prev;
                    return {
                        ...prev,
                        ...(result.inquiry || {}),
                        petId: result.inquiry?.petId || prev.petId,
                        adopterId: result.inquiry?.adopterId || prev.adopterId,
                        status: resolvedStatus
                    };
                });

                fetchInquiries();
                fetchMyPets();

                if (newStatus === 'approved') {
                    if (nextInquiry) {
                        handleMessageClick(nextInquiry);
                    }
                }
            } else {
                alert(result.message || "Failed to update inquiry status.");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Unable to update inquiry right now.");
        }
    };

    const handleDeletePet = async (petId) => {
        if (!window.confirm("Are you sure you want to delete this listing?")) return;
        try {
            const response = await fetch(`http://localhost:5000/api/pets/delete/${petId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${user.token}` }
            });
            const result = await response.json();
            if (result.success) {
                setMyPets(prev => prev.filter(pet => pet._id !== petId));
            }
        } catch (error) { console.error(error); }
    };

    const handleInputChange = (e) => setPetData({ ...petData, [e.target.name]: e.target.value });
    const handleFileChange = (e) => setSelectedFiles(Array.from(e.target.files));
    const handleVerificationFileChange = (e) => setVerificationFile(e.target.files?.[0] || null);

    const closeModal = () => {
        setIsModalOpen(false);
        setFormStep(1);
        setSelectedFiles([]);
        setVerificationFile(null);
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
        if (verificationFile) {
            data.append('clinicalVerificationImage', verificationFile);
        }

        const url = selectedPetId 
            ? `http://localhost:5000/api/pets/update/${selectedPetId}` 
            : "http://localhost:5000/api/pets/list";

        try {
            const response = await fetch(url, {
                method: selectedPetId ? "PUT" : "POST",
                headers: { "Authorization": `Bearer ${user.token}` },
                body: data
            });

            const result = await response.json();
            if (result.success) {
                alert(selectedPetId ? "Pet updated successfully!" : "Pet listed successfully!");
                closeModal();
                fetchMyPets();
            } else {
                alert("Failed to save pet: " + result.message);
            }
        } catch (error) { 
            console.error("Error submitting pet:", error);
        }
    };

    const handleEditClick = (pet) => {
        setSelectedPetId(pet._id);
        setVerificationFile(null);
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

    const handleMessageClick = (inquiry) => {
    setActiveChat(inquiry);
    setActiveTab('chat');
    fetchMessages(inquiry._id);
    
    // Join the specific room for this inquiry
    if (socket.current) {
        socket.current.emit("join_chat", inquiry._id); 
    }
};

    const renderChatInterface = () => {
        if (!activeChat) return (
            <div className="empty-state" style={{ textAlign: 'center', padding: '100px' }}>
                <Send size={48} color="#d7ccc8" />
                <p>Select an inquiry to start messaging.</p>
            </div>
        );

        // const currentUserId = user?._id || user?.id;

        return (
            <div className="chat-interface-container">
                <header className="chat-header">
                    <button className="back-btn" onClick={() => setActiveTab('inquiries')}>
                        <ChevronLeft size={20} />
                    </button>
                    <div className="chat-user-info">
                        <div className="mini-avatar">{activeChat.adopterId?.fullName?.[0]}</div>
                        <div>
                            <h3>{activeChat.adopterId?.fullName}</h3>
                            <p>Inquiry for {activeChat.petId?.name}</p>
                        </div>
                    </div>
                </header>

                <div className="chat-messages-area">
                      {chatMessages.map((msg, index) => {
    // 1. Get sender ID from message (handle object or string)
    const senderId = msg.senderId?._id || msg.senderId;
    
    // 2. Get your ID from AuthContext (using 'id' as defined in your context)
    const myId = user?.id;

    // 3. String comparison + check for "undefined" string
    const isSentByMe = 
        senderId && 
        myId && 
        String(senderId) === String(myId) && 
        String(myId) !== "undefined";

    return (
        <div 
            key={msg._id || index} 
            className={`message-wrapper ${isSentByMe ? 'sent' : 'received'}`}
        >
            <div className={`message-bubble ${isSentByMe ? 'sent' : 'received'}`}>
                <p>{msg.text || msg.message}</p>
                <span className="chat-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </div>
    );
})}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-input-wrapper" onSubmit={handleSendMessage}>
                    <div className="input-box">
                        <input 
                            type="text" 
                            placeholder="Write a message..." 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button type="submit" className="send-msg-btn"><Send size={18} /></button>
                    </div>
                </form>
            </div>
        );
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
                    <button className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>
                    <Send size={18} /> Messages
                    </button>
                </nav>

                <button className="logout-btn" onClick={logout}>
                    <LogOut size={18} /> Logout
                </button>
            </aside>

            <main className="main-content">
                {activeTab === 'chat' ? renderChatInterface() : ( 
                    <>
                    <header className="dashboard-header">
                            <div>
                                <h1>{activeTab === 'inventory' ? 'Manage Pet Listings' : 'Adoption Inquiries'}</h1>
                                <p className="subtitle">Track your listings and respond to potential adopters.</p>
                            </div>
                            <div className="header-actions">
                                <div className="donor-notification-wrapper">
                                    <button
                                        className={`donor-notif-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                                        onClick={toggleNotifDropdown}
                                        type="button"
                                    >
                                        <Bell size={20} />
                                        {unreadCount > 0 && <span className="donor-notif-badge">{unreadCount}</span>}
                                    </button>

                                    {showNotifDropdown && (
                                        <div className="donor-notif-dropdown">
                                            <div className="donor-notif-header">
                                                <h4>Notifications</h4>
                                                {unreadCount > 0 && <span className="donor-unread-dot"></span>}
                                            </div>

                                            {notifications.length > 0 ? (
                                                notifications.map((notification) => (
                                                    <div
                                                        key={notification._id}
                                                        className={`donor-notif-item ${notification.read ? 'read' : 'unread'}`}
                                                    >
                                                        <p>{notification.message}</p>
                                                        <div className="donor-notif-actions">
                                                            <div className="donor-notif-action-buttons">
                                                                <button
                                                                    type="button"
                                                                    className="donor-notif-link"
                                                                    onClick={handleNotificationAction}
                                                                >
                                                                    View Inquiries
                                                                </button>
                                                                {!notification.read && (
                                                                    <button
                                                                        type="button"
                                                                        className="donor-mark-read-btn"
                                                                        onClick={() => handleMarkNotificationRead(notification._id)}
                                                                    >
                                                                        Mark as read
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <span className="donor-notif-time">
                                                                {new Date(notification.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="donor-empty-notif">
                                                    <Bell size={30} opacity={0.3} />
                                                    <p>No new updates</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button className="refresh-btn" onClick={activeTab === 'inventory' ? fetchMyPets : fetchInquiries}>
                                    <RefreshCcw size={18} color="#5d4037" />
                                </button>
                                <button className="add-pet-btn" onClick={() => setIsModalOpen(true)}>
                                    <Plus size={20} /> List a New Pet
                                </button>
                            </div>
                        </header>
                     </>
                )}

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
                                    <div className="pet-card-title-row">
                                        <h2 className="pet-card-title">{pet.name}</h2>
                                        <span className={`pet-status-chip ${pet.status || 'available'}`}>
                                            {pet.status || 'available'}
                                        </span>
                                    </div>
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
                ) : activeTab === 'inquiries' ? (
                    <div className="inquiry-container">
                        {inquiries.length === 0 ? (
                            <div className="empty-state" style={{ textAlign: 'center', padding: '50px' }}>
                                <MessageSquare size={48} color="#d7ccc8" style={{ marginBottom: '10px' }} />
                                <p>No adoption inquiries yet.</p>
                            </div>
                        ) : (
                            inquiries.map((inq) => {
                                const inquiryStatusLabel =
                                    inq.status === 'approved' && inq.petId?.status === 'reserved'
                                        ? 'reserved'
                                        : inq.status;

                                return (
                                <div key={inq._id} className={`inquiry-card inquiry-${inq.status}`}>
                                    <div className="inquiry-profile-column">
                                        <div className="adopter-profile">
                                            <div className="mini-avatar">{inq.adopterId?.fullName?.[0] || 'A'}</div>
                                            <div className="adopter-info-text">
                                                <h3>{inq.adopterId?.fullName || inq.adopterName}</h3>
                                                <p className="app-for"><span className="meta-label">Interested in</span> <strong>{inq.petId?.name || 'Deleted Pet'}</strong></p>
                                            </div>
                                        </div>
                                        <span className={`status-pill ${inquiryStatusLabel}`}>{inquiryStatusLabel}</span>
                                    </div>
                                    
                                    <div className="inquiry-body">
                                        <div className="contact-info-row">
                                            <span><Mail size={14}/> {inq.adopterId?.email || inq.adopterEmail}</span>
                                            {inq.phone && <span><Phone size={14}/> {inq.phone}</span>}
                                            <span><Calendar size={14}/> {new Date(inq.createdAt).toLocaleDateString()}</span>
                                            {inq.petId?.status && <span><MapPin size={14}/> <span className="meta-label">Pet</span> {inq.petId.status}</span>}
                                        </div>
                                        
                                        {inq.motivation && (
                                            <div className="motivation-box">
                                                <h4 className="meta-label">Motivation</h4>
                                                <p>"{inq.motivation}"</p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="inquiry-footer">
                                        {inq.status === 'pending' ? (
                                            <>
                                                <button className="delete-action-btn" onClick={() => handleStatusUpdate(inq._id, 'rejected')}>Reject</button>
                                                <button className="edit-action-btn" onClick={() => handleStatusUpdate(inq._id, 'approved')}>Approve Inquiry for Chat</button>
                                            </>
                                        ) : inq.status === 'approved' ? (
                                            <>
                                                <button className="danger-action-btn" onClick={() => handleStatusUpdate(inq._id, 'declined')}>Decline Adoption</button>
                                                <button className="success-action-btn" onClick={() => handleStatusUpdate(inq._id, 'finalized')}>Finalize Adoption</button>
                                                <button className="message-btn" onClick={() => handleMessageClick(inq)} style={{ backgroundColor: '#5d4037', color: 'white', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer' }}>
                                                    <MessageSquare size={16} /> Message Adopter
                                                </button>
                                            </>
                                        ) : inq.status === 'adopted' ? (
                                            <span className="info-state-text">Adoption finalized</span>
                                        ) : inq.status === 'closed' ? (
                                            <span className="info-state-text">Closed after adoption</span>
                                        ) : null}
                                    </div>
                                </div>
                                );
                            })
                        )}
                    </div>
                ) : null}

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
                                        <div className="image-upload-zone">
                                            <Camera size={32} />
                                            <p>{verificationFile ? verificationFile.name : "Clinic Pet Verification"}</p>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                name="clinicalVerificationImage"
                                                onChange={handleVerificationFileChange}
                                            />
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
