import React, { useCallback, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdopterHeaderActions.css';

const AdopterHeaderActions = ({ className = '' }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [showNotifDropdown, setShowNotifDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const adopterName = user?.fullName || user?.name || 'User';
    const profilePicFile = Array.isArray(user?.profilePic)
        ? user.profilePic.find(Boolean)
        : user?.profilePic;
    const profilePicSrc = profilePicFile ? `http://localhost:5000/uploads/${profilePicFile}` : null;

    const fetchNotifications = useCallback(async () => {
        if (!user?.token) return;

        try {
            const response = await fetch('http://localhost:5000/api/notifications', {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await response.json();

            if (data.success) {
                const nextNotifications = data.notifications || [];
                setNotifications(nextNotifications);
                setUnreadCount(nextNotifications.filter((notification) => !notification.read).length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, [user?.token]);

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

    const handleMarkAsRead = async (notificationId) => {
        if (!user?.token) return;

        const targetNotification = notifications.find((notification) => notification._id === notificationId);
        if (!targetNotification || targetNotification.read) return;

        try {
            const response = await fetch(`http://localhost:5000/api/notifications/read/${notificationId}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await response.json();

            if (data.success) {
                setNotifications((prev) =>
                    prev.map((notification) =>
                        notification._id === notificationId ? { ...notification, read: true } : notification
                    )
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const handleChatAction = async (notification) => {
        if (!notification?.read) {
            await handleMarkAsRead(notification._id);
        }

        setShowNotifDropdown(false);
        navigate('/messages');
    };

    const toggleNotifDropdown = () => {
        const nextState = !showNotifDropdown;
        setShowNotifDropdown(nextState);

        if (nextState) {
            fetchNotifications();
        }
    };

    return (
        <div className={`adopter-header-actions ${className}`.trim()}>
            <div className="notification-wrapper">
                <button
                    type="button"
                    className={`icon-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
                    onClick={toggleNotifDropdown}
                    aria-label="Notifications"
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
                                                    onClick={() => handleChatAction(notification)}
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

            <div className="user-profile">
                <div className="profile-initials">
                    {profilePicSrc ? (
                        <img src={profilePicSrc} alt={adopterName} />
                    ) : (
                        adopterName.charAt(0)
                    )}
                </div>
                <span>{adopterName}</span>
            </div>
        </div>
    );
};

export default AdopterHeaderActions;
