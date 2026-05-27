import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Heart, Search, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import Footer from './Footer';
import './PetListing.css';

const PetListing = () => {
    const navigate = useNavigate();
    const [favorites, setFavorites] = useState({});
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState('All Types');
    const [locationFilter, setLocationFilter] = useState('Anywhere');
    const [ageFilter, setAgeFilter] = useState('All ages');

    const toggleWishlist = (id) => {
        setFavorites((prev) => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    useEffect(() => {
        const fetchPets = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://localhost:5000/api/pets', {
                    cache: 'no-store'
                });
                const data = await response.json();

                if (data.success) {
                    setPets(data.pets || []);
                }
            } catch (error) {
                console.error('Error fetching pet listings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPets();
    }, []);

    const filteredPets = useMemo(() => {
        return pets.filter((pet) => {
            const petType = String(pet.type || '').toLowerCase();
            const petLocation = String(pet.location || '').toLowerCase();
            const ageValueMatch = String(pet.age ?? '').match(/\d+(\.\d+)?/);
            const numericAge = ageValueMatch ? Number(ageValueMatch[0]) : null;

            const matchesType =
                typeFilter === 'All Types' ||
                petType === typeFilter.slice(0, -1).toLowerCase();

            const matchesLocation =
                locationFilter === 'Anywhere' ||
                petLocation.includes(locationFilter.toLowerCase());

            const matchesAge =
                ageFilter === 'All ages' ||
                (ageFilter === 'Puppy/Kitten' && numericAge !== null && numericAge < 1) ||
                (ageFilter === 'Adult' && numericAge !== null && numericAge >= 1);

            return matchesType && matchesLocation && matchesAge;
        });
    }, [pets, typeFilter, locationFilter, ageFilter]);

    return (
        <div className="listing-page-wrapper">
            <NavBar />
            <main className="listing-main-content">
                <section className="listing-hero">
                    <div className="listing-hero-text">
                        <h1 className="hero-title">
                            Find Your New <span className="highlight-purple">Companion</span>
                        </h1>
                        <p className="hero-subtitle">
                            Browse through all pets currently listed for adoption in PawCha.
                        </p>
                    </div>

                    <div className="filters-container">
                        <div className="filters-row">
                            <div className="filter-group">
                                <label>Pet Type</label>
                                <select className="filter-dropdown" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                                    <option>All Types</option>
                                    <option>Dogs</option>
                                    <option>Cats</option>
                                    <option>Birds</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Location</label>
                                <select className="filter-dropdown" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                                    <option>Anywhere</option>
                                    <option>Kathmandu</option>
                                    <option>Lalitpur</option>
                                    <option>Bhaktapur</option>
                                    <option>Pokhara</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Age</label>
                                <select className="filter-dropdown" value={ageFilter} onChange={(e) => setAgeFilter(e.target.value)}>
                                    <option>All ages</option>
                                    <option>Puppy/Kitten</option>
                                    <option>Adult</option>
                                </select>
                            </div>
                            <button className="search-btn-brown" type="button">
                                <Search size={18} /> Search
                            </button>
                        </div>
                    </div>
                </section>

                <section className="pet-grid-section">
                    <div className="pet-grid-inner">
                        {loading ? (
                            <div className="listing-status-msg">Loading pets...</div>
                        ) : filteredPets.length > 0 ? (
                            filteredPets.map((pet) => (
                                <div key={pet._id} className="pet-card">
                                    <div className="pet-card-image">
                                        <button
                                            className={`wishlist-btn ${favorites[pet._id] ? 'active' : ''}`}
                                            onClick={() => toggleWishlist(pet._id)}
                                            type="button"
                                        >
                                            <Heart
                                                size={20}
                                                color="#7F65F0"
                                                fill={favorites[pet._id] ? "#7F65F0" : "none"}
                                            />
                                        </button>
                                        {pet.images?.[0] ? (
                                            <img
                                                src={`http://localhost:5000/uploads/${pet.images[0]}`}
                                                alt={pet.name}
                                                className="pet-card-photo"
                                            />
                                        ) : (
                                            <div className="empty-img-slot">Pet Photo</div>
                                        )}
                                    </div>
                                    <div className="pet-card-details">
                                        <div className="pet-name-title">
                                            <h3>{pet.name}</h3>
                                            {pet.isClinicallyApproved && (
                                                <span className="pet-clinical-badge">
                                                    <ShieldCheck size={14} />
                                                    Clinically Approved
                                                </span>
                                            )}
                                        </div>
                                        <p className="pet-meta">
                                            {pet.age} • {pet.type} • {pet.breed || 'Mixed'}
                                        </p>
                                        <div className="pet-location-tag">
                                            <MapPin size={14} /> {pet.location}
                                        </div>
                                        <button
                                            className="view-profile-btn-brown"
                                            type="button"
                                            onClick={() => navigate(`/pet-profile/${pet._id}`)}
                                        >
                                            View Profile
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="listing-status-msg">No pets found for the selected filters.</div>
                        )}
                    </div>
                    <div className="explore-more-container">
                        <button className="load-more-btn-brown" type="button" onClick={() => navigate('/explore-pets')}>
                            Explore More Pets
                        </button>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default PetListing;
