import React, { useState } from 'react'; // Added useState
import { MapPin, Heart, Search } from 'lucide-react';
import NavBar from './NavBar';
import Footer from './Footer';
import './PetListing.css';

const PetListing = () => {
    // 1. State to track which pet IDs are favorited
    const [favorites, setFavorites] = useState({});

    // 2. Toggle function
    const toggleWishlist = (id) => {
        setFavorites(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const pets = [
        { id: 1, name: "Milo", age: "3 yrs", gender: "Male", size: "Large", location: "Lalitpur, Nepal" },
        { id: 2, name: "Kanchi", age: "2 yrs", gender: "Female", size: "Small", location: "Kathmandu, Nepal" },
        { id: 3, name: "Bruno", age: "4 yrs", gender: "Male", size: "Medium", location: "Bhaktapur, Nepal" },
        { id: 4, name: "Simba", age: "1 yr", gender: "Male", size: "Large", location: "Lalitpur, Nepal" },
        { id: 5, name: "Luna", age: "2 yrs", gender: "Female", size: "Medium", location: "Kathmandu, Nepal" },
        { id: 6, name: "Max", age: "5 yrs", gender: "Male", size: "Large", location: "Lalitpur, Nepal" },
        { id: 7, name: "Bella", age: "1 yr", gender: "Female", size: "Small", location: "Pokhara, Nepal" },
        { id: 8, name: "Charlie", age: "3 yrs", gender: "Male", size: "Medium", location: "Lalitpur, Nepal" },
    ];

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
                            Browse through 120+ verified pets looking for a loving home in Nepal.
                        </p>
                    </div>

                    <div className="filters-container">
                        <div className="filters-row">
                            <div className="filter-group">
                                <label>Pet Type</label>
                                <select className="filter-dropdown">
                                    <option>All Types</option>
                                    <option>Dogs</option>
                                    <option>Cats</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Location</label>
                                <select className="filter-dropdown">
                                    <option>Anywhere</option>
                                    <option>Kathmandu</option>
                                    <option>Lalitpur</option>
                                </select>
                            </div>
                            <div className="filter-group">
                                <label>Age</label>
                                <select className="filter-dropdown">
                                    <option>All ages</option>
                                    <option>Puppy/Kitten</option>
                                    <option>Adult</option>
                                </select>
                            </div>
                            <button className="search-btn-brown">
                                <Search size={18} /> Search
                            </button>
                        </div>
                    </div>
                </section>

                <section className="pet-grid-section">
                    <div className="pet-grid-inner">
                        {pets.map(pet => (
                            <div key={pet.id} className="pet-card">
                                <div className="pet-card-image">
                                    {/* 3. UPDATED BUTTON: Added onClick and dynamic fill */}
                                    <button 
                                        className={`wishlist-btn ${favorites[pet.id] ? 'active' : ''}`}
                                        onClick={() => toggleWishlist(pet.id)}
                                    >
                                        <Heart 
                                            size={20} 
                                            color="#7F65F0" 
                                            fill={favorites[pet.id] ? "#7F65F0" : "none"} 
                                        />
                                    </button>
                                    <div className="empty-img-slot">Pet Photo</div>
                                </div>
                                <div className="pet-card-details">
                                    <div className="pet-name-title">
                                        <h3>{pet.name}</h3>
                                    </div>
                                    <p className="pet-meta">
                                        {pet.age} • {pet.gender} • {pet.size}
                                    </p>
                                    <div className="pet-location-tag">
                                        <MapPin size={14} /> {pet.location}
                                    </div>
                                    <button className="view-profile-btn-brown">View Profile</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="explore-more-container">
                        <button className="load-more-btn-brown">Explore More Pets</button>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default PetListing;