import React, { useState, useEffect } from 'react';
import { MapPin, Heart, Bell} from 'lucide-react';
import AdopterSideBar from './AdopterSideBar';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdopterDashboard.css'; 

const Favourites = () => {
    const [allPets, setAllPets] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth(); 

    useEffect(() => {
        // 1. Get IDs from localStorage
        const savedFavs = JSON.parse(localStorage.getItem('pawcha_favorites') || '[]');
        setFavorites(savedFavs);

        // 2. Fetch all pets to match the IDs
        const fetchPets = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/admin/all-pets");
                const data = await res.json();
                if (data.success) setAllPets(data.pets);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPets();
    }, []);

const adopterName = user?.name || 'User';

    // Filter pets that are in the favorites array
    const favPets = allPets.filter(pet => favorites.includes(pet._id));

    return (
        <div className="adopter-container">
            <AdopterSideBar />
            <main className="adopter-main">
                <header className="adopter-header">
                    <h1>My <span className="highlight">Favourites</span></h1>
                     <button className="icon-btn"><Bell size={20} /></button>
                        <div className="user-profile">
                            <div className="profile-initials">{adopterName.charAt(0)}</div>
                            <span>{adopterName}</span>
                        </div>
                </header>

                <div className="pets-scroll-grid">
                    {loading ? (
                        <p>Loading your favorites...</p>
                    ) : favPets.length > 0 ? (
                        favPets.map(pet => (
                            <div key={pet._id} className="pet-item-card">
                                <div className="pet-thumb">
                                    <img src={`http://localhost:5000/uploads/${pet.images[0]}`} alt={pet.name} />
                                    <div className="fav-overlay is-fav">
                                        <Heart size={18} fill="#7c4dff" color="#7c4dff" />
                                    </div>
                                </div>
                                <div className="pet-info">
                                    <h3>{pet.name}</h3>
                                    <span className="pet-specs">{pet.age} yrs • {pet.type}</span>
                                    <p className="pet-loc"><MapPin size={14} /> {pet.location}</p>
                                </div>
                                <button className="view-profile-btn" onClick={() => navigate(`/pet-profile/${pet._id}`)}>
                                            View Profile
                                        </button>
                            </div>
                        ))
                    ) : (
                        <div className="status-msg">You haven't added any pets to your favourites yet.</div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Favourites;