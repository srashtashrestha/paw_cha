import React, { useRef, useState } from 'react';
import { ChevronRight, ChevronLeft, MapPin, Heart } from 'lucide-react'; 
import NavBar from './NavBar';
import Footer from './Footer';
import './LandingPage.css'; 

// --- SVG IMPORTS ---
import hero from '../Assets/Photos/Hero.svg';
import verify from '../Assets/Photos/verified.svg';
import community from '../Assets/Photos/communitywithblob.svg';
import adoption from '../Assets/Photos/adoptonwithblob.svg';

const LandingPage = () => {
    const scrollRef = useRef(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);

    const handleScroll = () => {
        if (scrollRef.current) {
            setShowLeftArrow(scrollRef.current.scrollLeft > 10);
        }
    };

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = direction === 'left' ? -350 : 350;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const pets = [
        { id: 1, name: "Milo", age: "5 years old", location: "Lalitpur, Nepal", img: "" },
        { id: 2, name: "Milo", age: "5 years old", location: "Lalitpur, Nepal", img: "" },
        { id: 3, name: "Milo", age: "5 years old", location: "Lalitpur, Nepal", img: "" },
        { id: 4, name: "Kanchi", age: "3 years old", location: "Lalitpur, Nepal", img: "" },
        { id: 5, name: "Buddy", age: "2 years old", location: "Kathmandu, Nepal", img: "" },
    ];

    return (
        <div className="landing-wrapper">
            <NavBar />

            <main className="main-content">
               {/* --- HERO SECTION --- */}
<section className="hero-container">
    <div className="hero-inner">
        <div className="hero-content" style={{ alignItems: 'flex-start' }}> {/* Ensures all children are left-aligned */}
            <h1 className="hero-title">Find Your New <br /> Bestfriend Today</h1>
            <p 
                className="hero-subtitle" 
                style={{ textAlign: 'left', marginLeft: 0, marginRight: 'auto' }}
            >
                Give a loving home to a pet in need. Adopt, don't shop — change a life forever with Pawचा.
            </p>
            <div className="hero-buttons">
                <button className="btn-primary">Adopt now</button>
                <button className="btn-secondary">Rehome a Pet</button>
            </div>
        </div>
        <div className="hero-image-container">
            <div className="image-placeholder">
                <img src={hero} alt="Pet Adoption Illustration" className="hero-svg-main" />
                <div className="placeholder-blob"></div>
            </div>
        </div>
    </div>
</section>

                {/* --- PET LISTING SECTION --- */}
                <section className="pet-listing-section">
                    <div className="pet-listing-inner">
                        <div className="pet-listing-header">
                            <h2 className="listing-title">Meet Pets <span className="highlight-purple">Ready</span> for Adoption</h2>
                            <div className="view-more-simple">
                                View more <ChevronRight size={20} />
                            </div>
                        </div>

                        <div className="scroll-wrapper">
                            {showLeftArrow && (
                                <button className="scroll-arrow-btn left" onClick={() => scroll('left')}>
                                    <ChevronLeft size={28} />
                                </button>
                            )}
                            <div className="pet-cards-container" ref={scrollRef} onScroll={handleScroll}>
                                {pets.map((pet) => (
                                    <div className="pet-card" key={pet.id}>
                                        <div className="pet-card-image">
                                            {pet.img ? <img src={pet.img} alt={pet.name} /> : <div className="empty-img-slot">Image Space</div>}
                                        </div>
                                        <div className="pet-card-details">
                                            <div className="pet-name-title">
                                                <Heart size={22} fill="#8B5CF6" stroke="none" className="heart-icon" />
                                                <h3>{pet.name}</h3>
                                            </div>
                                            <p className="pet-meta age-text">{pet.age}</p>
                                            <p className="pet-meta status-text">Looking for Love</p>
                                            <div className="pet-location-tag">
                                                <MapPin size={18} />
                                                <span>{pet.location}</span>
                                            </div>
                                            <button className="view-profile-btn-brown">View Profile</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="scroll-arrow-btn right" onClick={() => scroll('right')}>
                                <ChevronRight size={28} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* --- ABOUT PAWCHA SECTION --- */}
                <section className="about-section">
                    <div className="about-inner">
                        <div className="about-header">
                            <h2 className="listing-title">About PawCha</h2>
                            <p className="about-subtitle-top">A safer, more transparent way to find your new bestfriend</p>
                        </div>

                        <div className="about-cards-stack">
                            {/* Card 1: Health */}
                            <div className="about-card">
                                <div className="about-image-side">
                                    <svg className="blob-svg" width="249" height="249" viewBox="0 0 249 249" fill="none">
                                        <circle cx="124.5" cy="124.5" r="124.5" fill="#F0CF65"/>
                                    </svg>
                                    <div className="svg-container-placeholder">
                                        {<img src={verify} alt="" className="card-illustration" />}
                                    </div>
                                </div>
                                <div className="about-text-side">
                                    <h2 className="about-card-title"><span className="highlight-purple">Verified</span> Health Transparency</h2>
                                    <p className="about-card-body">Every pet on Pawcha comes with a digital history. No more manual tracking —see every vaccination and deworming date at a glance.</p>
                                </div>
                            </div>

                            {/* Card 2: Security */}
                            <div className="about-card row-reverse">
                                <div className="about-image-side">
                                    <svg className="blob-svg" width="249" height="249" viewBox="0 0 249 249" fill="none">
                                        <circle cx="124.5" cy="124.5" r="124.5" fill="#F0CF65"/>
                                    </svg>
                                    <div className="svg-container-placeholder">
                                        {<img src={community} alt="" className="card-illustration" />}
                                    </div>
                                </div>
                                <div className="about-text-side">
                                    <h2 className="about-card-title">A <span className="highlight-purple">Secure</span>, Vetted Community</h2>
                                    <p className="about-card-body">We protect our pets by vetting adopters. Our inquiry system ensures that donors only connect with serious, responsible families.</p>
                                </div>
                            </div>

                            {/* Card 3: Step-by-Step */}
                            <div className="about-card">
                                <div className="about-image-side">
                                    <svg className="blob-svg" width="249" height="249" viewBox="0 0 249 249" fill="none">
                                        <circle cx="124.5" cy="124.5" r="124.5" fill="#F0CF65"/>
                                    </svg>
                                    <div className="svg-container-placeholder">
                                        {<img src={adoption} alt="" className="card-illustration" />}
                                    </div>
                                </div>
                                <div className="about-text-side">
                                    <h2 className="about-card-title">Guided <span className="highlight-purple">Step-by-Step</span> Adoption</h2>
                                    <p className="about-card-body">From the first inquiry to the final handover, we provide the tools and safety tips you need for a successful transition.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div style={{ height: '80px' }}></div>
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;