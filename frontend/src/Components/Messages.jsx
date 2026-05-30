import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send } from 'lucide-react';
import axios from 'axios';
import AdopterSideBar from './AdopterSideBar';
import AdopterHeaderActions from './AdopterHeaderActions';
import './Messages.css';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true
});

const Messages = () => {
    const { user } = useAuth();
    const [inquiries, setInquiries] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const scrollRef = useRef();

    // Fetch all pet applications for this adopter
    useEffect(() => {
        const fetchInquiries = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/adopter/my-inquiries', {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setInquiries(res.data.inquiries);
            } catch (err) {
                console.error("Error fetching inquiries:", err);
            }
        };
        if (user?.token) fetchInquiries();
    }, [user?.token]);

    // Fetch messages when a chat is selected
    useEffect(() => {
        if (selectedChat) {
            const fetchMsgs = async () => {
                try {
                    const res = await axios.get(`http://localhost:5000/api/messages/${selectedChat._id}`, {
                        headers: { Authorization: `Bearer ${user.token}` }
                    });
                    setMessages(res.data.messages);
                } catch (err) {
                    console.error("Error fetching messages:", err);
                }
            };
            fetchMsgs();
        } else {
            setMessages([]);
        }
    }, [selectedChat, user?.token]);

    useEffect(() => {
        if (!selectedChat?._id) return;

        const handleNewMessage = (newMsg) => {
            const incomingChatId = String(newMsg.chatId || newMsg.inquiryId);
            const currentChatId = String(selectedChat._id);

            if (incomingChatId !== currentChatId) return;

            setMessages((prev) => {
                const alreadyExists = prev.some((m) => {
                    if (newMsg._id && m._id) return m._id === newMsg._id;

                    const existingSenderId = String(m.senderId?._id || m.senderId);
                    const incomingSenderId = String(newMsg.senderId?._id || newMsg.senderId);

                    return (
                        m.text === newMsg.text &&
                        existingSenderId === incomingSenderId &&
                        m.createdAt === newMsg.createdAt
                    );
                });

                return alreadyExists ? prev : [...prev, newMsg];
            });
        };

        socket.on("receive_message", handleNewMessage);
        return () => socket.off("receive_message", handleNewMessage);
    }, [selectedChat]);

    // Auto-scroll to bottom
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || !selectedChat) return;

        try {
            const res = await axios.post('http://localhost:5000/api/messages/send',
                {
                    chatId: selectedChat._id,
                    text: text
                },
                {
                    headers: { Authorization: `Bearer ${user.token}` }
                });

            setText("");
            if (res.data.newMessage) {
                setMessages((prev) => (
                    prev.some((m) => m._id === res.data.newMessage._id)
                        ? prev
                        : [...prev, res.data.newMessage]
                ));
            }
        } catch (err) {
            console.error("Message send failed", err);
        }
    };

    const handleSelectChat = (inq) => {
        setSelectedChat(inq);
        socket.emit("join_chat", inq._id);
    };

    return (
        <div className="adopter-container">
            <AdopterSideBar />

            <main className="adopter-main messages-adopter-main">
                <header className="adopter-header">
                    <div className="welcome-section">
                        <h1>Adoption <span className="highlight">Messages</span></h1>
                    </div>
                    <AdopterHeaderActions />
                </header>

                <div className="messages-page-container">
                    <div className="chat-sidebar">
                        <h3 className="sidebar-title">Conversations</h3>
                        <div className="inquiry-scroll-list">
                            {inquiries.map(inq => (
                                <div
                                    key={inq._id}
                                    className={`inquiry-card ${selectedChat?._id === inq._id ? 'active-chat' : ''}`}
                                    onClick={() => handleSelectChat(inq)}
                                >
                                    <img src={`http://localhost:5000/uploads/${inq.petId.images[0]}`} alt="pet" className="chat-pet-img" />
                                    <div className="inquiry-details">
                                        <h4>{inq.petId.name}</h4>
                                        <p>Status: <span className={`status-tag ${inq.status}`}>{inq.status}</span></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="chat-main-window">
                        {selectedChat ? (
                            <>
                                <div className="chat-header">
                                    <img src={`http://localhost:5000/uploads/${selectedChat.petId.images[0]}`} alt="avatar" />
                                    <div>
                                        <h4>Chatting about {selectedChat.petId.name}</h4>
                                        <p>Donor: {selectedChat.donorId.fullName}</p>
                                    </div>
                                </div>

                                <div className="chat-messages-area">
                                    {messages.map((m, i) => {
                                        // Fix 3: Standardize IDs as strings for reliable comparison
                                        const senderId = String(m.senderId?._id || m.senderId);
                                        const myId = String(user?._id || user?.id);
                                        const isMe = senderId === myId;

                                        return (
                                            <div key={m._id || i} className={`msg-wrapper ${isMe ? 'me' : 'them'}`}>
                                                <div className="msg-bubble">
                                                    {m.text || "No message content"}
                                                </div>
                                                <span className="msg-time">
                                                    {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    <div ref={scrollRef} />
                                </div>

                                <form className="chat-input-bar" onSubmit={handleSend}>
                                    <input
                                        type="text"
                                        placeholder="Write a message..."
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                    />
                                    <button type="submit" className="send-button">
                                        <Send size={20} />
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-content" style={{ textAlign: 'center' }}>
                                    <MessageSquare size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                                    <p>Pick a conversation to view your adoption inquiries</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Messages;
