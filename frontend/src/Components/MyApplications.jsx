import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import './MyApplications.css';
import AdopterSideBar from './AdopterSideBar'; 
import AdopterHeaderActions from './AdopterHeaderActions';

const MyApplications = () => {
    const { user } = useAuth();
    const [applications, setApplications] = useState([]);

    useEffect(() => {
        const fetchApps = async () => {
            const res = await fetch(`http://localhost:5000/api/adopter/my-inquiries`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            const data = await res.json();
            if (data.success) setApplications(data.inquiries);
        };
        if (user?.token) fetchApps(); // Added safety check for token
    }, [user]);

    const getStatusStyle = (status) => {
        if (status === 'approved') return { icon: <CheckCircle color="#4caf50" />, class: 'status-approved' };
        if (status === 'rejected') return { icon: <XCircle color="#f44336" />, class: 'status-rejected' };
        return { icon: <Clock color="#ff9800" />, class: 'status-pending' };
    };

    return (
        /* 2. Wrapped in adopter-container to handle sidebar layout */
        <div className="adopter-container">
            <AdopterSideBar />
            
            {/* 3. Wrapped content in adopter-main to provide proper margins */}
            <main className="adopter-main">
                <header className="adopter-header">
                    <div className="welcome-section">
                        <h1>My <span className="highlight">Applications</span></h1>
                    </div>
                    <AdopterHeaderActions />
                </header>

                <div className="applications-container">
                    <div className="apps-bento-grid">
                        {applications.map(app => (
                            <div key={app._id} className="app-card bento-card">
                                <img 
                                    src={`http://localhost:5000/uploads/${app.petId.images[0]}`} 
                                    alt={app.petId.name} 
                                />
                                <div className="app-info">
                                    <h3>{app.petId.name}</h3>
                                    <div className={`status-badge ${getStatusStyle(app.status).class}`}>
                                        {getStatusStyle(app.status).icon}
                                        <span>{app.status.toUpperCase()}</span>
                                    </div>
                                    <p className="app-date">
                                        Applied on: {new Date(app.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {applications.length === 0 && (
                        <div className="status-msg">You haven't submitted any applications yet.</div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default MyApplications;
