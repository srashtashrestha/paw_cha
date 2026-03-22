import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

import logo from '../Assets/Logo/Logo.png'; 

const AdminDashboard = () => {
    const [donors, setDonors] = useState([]);
    const [adopters, setAdopters] = useState([]);
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('donors');
    const navigate = useNavigate();

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            
            const [donorRes, adopterRes, petRes] = await Promise.all([
                fetch('http://127.0.0.1:5000/api/admin/donors', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('http://127.0.0.1:5000/api/admin/adopters'),
                fetch('http://127.0.0.1:5000/api/admin/all-pets', { 
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const donorData = await donorRes.json();
            const adopterData = await adopterRes.json();
            const petData = await petRes.json();

            if (donorData.success) setDonors(donorData.donors);
            if (adopterData.success) setAdopters(adopterData.adopters);
            if (petData.success) setPets(petData.pets);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'admin') {
            navigate('/admin-login');
            return;
        }
        fetchAllData();
    }, [navigate]);

    const refreshDonors = async () => {
        const response = await fetch('http://127.0.0.1:5000/api/admin/donors', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        if (data.success) setDonors(data.donors);
    };

    const handleVerify = async (id) => {
        try {
            const response = await fetch(`http://127.0.0.1:5000/api/admin/verify-donor/${id}`, {
                method: 'PUT'
            });
            const data = await response.json();
            if (data.success) {
                alert("Donor Verified Successfully!");
                refreshDonors(); 
            }
        } catch (error) {
            alert("Verification failed");
        }
    };

    const handleReject = async (id) => {
        if (window.confirm("Rejecting this user will permanently delete their account. Proceed?")) {
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/admin/reject-donor/${id}`, {
                    method: 'DELETE'
                });
                const data = await response.json();
                if (data.success) {
                    alert("Account deleted.");
                    fetchAllData();
                }
            } catch (error) {
                alert("Error deleting account.");
            }
        }
    };

    const handleDeletePet = async (petId) => {
        if (window.confirm("Are you sure this listing is fake? This will permanently remove the pet listing.")) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`http://127.0.0.1:5000/api/admin/delete-pet/${petId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    alert("Listing removed successfully.");
                    fetchAllData();
                }
            } catch (error) {
                console.error("Error deleting pet:", error);
                alert("Failed to remove listing.");
            }
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="admin-container">
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <img src={logo} alt="PawCha Logo" className="admin-sidebar-logo" />
                </div>
                <nav className="sidebar-nav">
                    <button className={`nav-item ${activeTab === 'donors' ? 'active' : ''}`} onClick={() => setActiveTab('donors')}>Donors List</button>
                    <button className={`nav-item ${activeTab === 'adopters' ? 'active' : ''}`} onClick={() => setActiveTab('adopters')}>Adopter Accounts</button>
                    <button className={`nav-item ${activeTab === 'adoptions' ? 'active' : ''}`} onClick={() => setActiveTab('adoptions')}>Adoptions (Pets)</button>
                    <button className="nav-item logout-btn" onClick={handleLogout}>Logout</button>
                </nav>
            </aside>

            <main className="admin-content">
                <header className="content-header">
                    <h1>
                        {activeTab === 'donors' && 'Donor Verification Queue'}
                        {activeTab === 'adopters' && 'Adopter Management'}
                        {activeTab === 'adoptions' && 'Listed Pets for Adoption'}
                    </h1>
                    <div className="user-profile">Admin Account</div>
                </header>

                <div className="table-card">
                    {loading ? (
                        <p>Loading data...</p>
                    ) : (
                        <table className="donor-table">
                            <thead>
                                {activeTab === 'adoptions' ? (
                                    <tr>
                                        <th>Photo</th>
                                        <th>Pet Name</th>
                                        <th>Type & Age</th>
                                        <th>Donor Details</th>
                                        <th>Location</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th>Full Name</th>
                                        <th>Email</th>
                                        {activeTab === 'donors' && <th>ID Card</th>}
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {activeTab === 'donors' && donors.map((user) => (
                                    <tr key={user._id}>
                                        <td>{user.fullName}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            {user.idCardPath ? (
                                                <a href={`http://127.0.0.1:5000/uploads/${user.idCardPath}`} target="_blank" rel="noreferrer" className="view-link">View Document</a>
                                            ) : "No File"}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${user.isVerified ? 'verified' : 'pending'}`}>
                                                {user.isVerified ? 'Verified/Active' : 'Pending'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                {!user.isVerified && (
                                                    <button className="verify-btn" onClick={() => handleVerify(user._id)}>Approve</button>
                                                )}
                                                <button className="reject-btn" onClick={() => handleReject(user._id)}>Remove</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {activeTab === 'adopters' && adopters.map((user) => (
                                    <tr key={user._id}>
                                        <td>{user.fullName}</td>
                                        <td>{user.email}</td>
                                        <td><span className="status-badge verified">Active Adopter</span></td>
                                        <td><button className="reject-btn" onClick={() => handleReject(user._id)}>Remove</button></td>
                                    </tr>
                                ))}

                                {activeTab === 'adoptions' && pets.map((pet) => (
                                    <tr key={pet._id}>
                                        <td>
                                            <img 
                                                src={pet.imagePath ? `http://localhost:5000/uploads/${pet.imagePath}` : "placeholder.png"} 
                                                alt={pet.name} 
                                                style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/60?text=No+Image'; }}
                                            />
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '700' }}>{pet.name}</div>
                                            <div style={{ fontSize: '12px', color: '#8d6e63' }}>{pet.gender || 'Not specified'}</div>
                                        </td>
                                        <td>
                                            <div>{pet.type} ({pet.breed || 'Mixed'})</div>
                                            <div style={{ fontSize: '12px', color: '#8d6e63' }}>Age: {pet.age || 'Unknown'}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 'bold', color: '#5d4037' }}>{pet.donorId?.fullName || 'Unknown'}</div>
                                            <div style={{ fontSize: '11px', color: '#a1887f' }}>{pet.donorId?.email || 'N/A'}</div>
                                        </td>
                                        <td>{pet.location}</td>
                                        <td>
                                            <span className="status-badge verified">Listed</span>
                                        </td>
                                        <td>
                                            <button className="reject-btn" onClick={() => handleDeletePet(pet._id)}>Remove Pet</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;