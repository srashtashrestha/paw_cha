import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { Search, Bell, Heart, MapPin,ChevronLeft, ChevronRight } from 'lucide-react';
import './AdopterDashboard.css';
import AdopterSideBar from './AdopterSideBar';

const AdopterDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth(); 
    const [pets, setPets] = useState([]);
    const [myInquiries, setMyInquiries] = useState([]); 
    const scrollRef = useRef(null);
    
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('pawcha_favorites');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    
    const adopterName = user?.role === 'adopter' ? user.name : 'User';

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 10);
            setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const petResponse = await fetch("http://localhost:5000/api/admin/all-pets");
                const petResult = await petResponse.json();
                
                const inqResponse = await fetch(`http://localhost:5000/api/adopter/my-inquiries`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                const inqResult = await inqResponse.json();

                if (petResult.success) setPets(petResult.pets);
                if (inqResult.success) setMyInquiries(inqResult.inquiries);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.token) fetchData();
    }, [user]);

    useEffect(() => {
        handleScroll();
        window.addEventListener('resize', handleScroll);
        return () => window.removeEventListener('resize', handleScroll);
    }, [pets, loading]);

    const toggleFavorite = (e, petId) => {
        e.stopPropagation();
        setFavorites(prev => {
            const updated = prev.includes(petId) 
                ? prev.filter(id => id !== petId) 
                : [...prev, petId];
            localStorage.setItem('pawcha_favorites', JSON.stringify(updated));
            return updated;
        });
    };

    const filteredPets = useMemo(() => {
        return [...pets]
            .reverse() 
            .filter(pet => !myInquiries.some(inquiry => inquiry.petId?._id === pet._id))
            .filter(pet => 
                pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pet.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                pet.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [searchTerm, pets, myInquiries]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="adopter-container">
            <AdopterSideBar />

            <main className="adopter-main">
                <header className="adopter-header">
                    <div className="welcome-section">
                        <h1>Welcome, <span className="highlight">{adopterName}!</span></h1>
                    </div>
                    <div className="header-controls">
                        <div className="search-bar">
                            <Search size={18} />
                            <input 
                                type="text" 
                                placeholder="Search by name, type, or city..." 
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="icon-btn"><Bell size={20} /></button>
                        <div className="user-profile">
                            <div className="profile-initials">{adopterName.charAt(0)}</div>
                            <span>{adopterName}</span>
                        </div>
                    </div>
                </header>

                <section className="listings-section" style={{ position: 'relative' }}>
                    <div className="section-header">
                        <h2>{searchTerm ? "Search Results" : "Recently Added Pets"}</h2>
                        <button className="explore-all-btn" onClick={() => navigate('/explore-pets')}>
                            Explore All
                        </button>
                    </div>

                    {!loading && filteredPets.length > 0 && (
                        <>
                            {showLeftArrow && (
                                <button className="scroll-arrow-btn left" onClick={() => scroll('left')}>
                                    <ChevronLeft size={24} />
                                </button>
                            )}
                            {showRightArrow && (
                                <button className="scroll-arrow-btn right" onClick={() => scroll('right')}>
                                    <ChevronRight size={24} />
                                </button>
                            )}
                        </>
                    )}

                    <div 
                        className="pets-scroll-grid" 
                        ref={scrollRef}
                        onScroll={handleScroll}
                    >
                        {loading ? (
                            <div className="status-msg">Loading pets...</div>
                        ) : filteredPets.length > 0 ? (
                            filteredPets.map(pet => (
                                <div key={pet._id} className="pet-item-card">
                                    <div className="pet-thumb">
                                        <img 
                                            src={pet.images?.[0] ? `http://localhost:5000/uploads/${pet.images[0]}` : '/placeholder.png'} 
                                            alt={pet.name} 
                                        />
                                        <button 
                                            className={`fav-overlay ${favorites.includes(pet._id) ? 'is-fav' : ''}`}
                                            onClick={(e) => toggleFavorite(e, pet._id)}
                                        >
                                            <Heart 
                                                size={18} 
                                                fill={favorites.includes(pet._id) ? "#7c4dff" : "none"} 
                                                color={favorites.includes(pet._id) ? "#7c4dff" : "currentColor"}
                                            />
                                        </button>
                                    </div>
                                    <div className="pet-info">
                                        <h3>{pet.name}</h3>
                                        <span className="pet-specs">{pet.age} yrs • {pet.type}</span>
                                        <p className="pet-loc"><MapPin size={14} /> {pet.location}</p>
                                        <button className="view-profile-btn" onClick={() => navigate(`/pet-profile/${pet._id}`)}>
                                            View Profile
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="status-msg">
                                {searchTerm ? "No pets found matching your search." : "You've applied for all available pets!"}
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default AdopterDashboard;