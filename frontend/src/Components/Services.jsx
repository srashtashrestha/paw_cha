import React from 'react';
import { Heart, Home, ShieldCheck, Headphones, Shield, FileText, MessageCircle, Award } from 'lucide-react';
import NavBar from './NavBar';
import Footer from './Footer';
import './Services.css';


const Services = () => {
    return (
        <div className="landing-wrapper services-page">
            <NavBar />

            <main className="main-content">
                {/* 1. HERO SECTION */}
                <section className="services-hero-container">
                    <div className="services-hero-inner">
                        <div className="services-hero-glass-box">
                            <h1>Our <span className="highlight-purple">Services</span></h1>
                            <p>Everything you need to find, connect with, and adopt your perfect pet companion</p>
                        </div>
                    </div>
                </section>

                <div className="services-main-content">
                    {/* 2. SERVICES GRID */}
                    <section className="services-grid">
                        <div className="service-bento-card">
                            <div className="service-icon-wrapper">
                                <Heart size={24} />
                            </div>
                            <h3>Pet Adoption</h3>
                            <p>Browse verified pets from trusted shelters and individuals. Get matched based on your lifestyle and apply with confidence.</p>
                        </div>

                        <div className="service-bento-card">
                            <div className="service-icon-wrapper">
                                <Home size={24} />
                            </div>
                            <h3>Rehome a Pet</h3>
                            <p>Safely rehome pets through a verified process that ensures transparency, trust, and the pet's well-being.</p>
                        </div>

                        <div className="service-bento-card">
                            <div className="service-icon-wrapper">
                                <ShieldCheck size={24} />
                            </div>
                            <h3>Verified Listings</h3>
                            <p>All donors and shelters go through a verification process so adopters can trust every listing they see.</p>
                        </div>

                        <div className="service-bento-card">
                            <div className="service-icon-wrapper">
                                <Headphones size={24} />
                            </div>
                            <h3>Adoption Support</h3>
                            <p>From application to final adoption, PawCha guides you step-by-step and keeps communication clear and secure.</p>
                        </div>
                    </section>

                    {/* 3. TRUST & SAFETY ROW */}
                    <section className="trust-safety-banner">
                        <div className="trust-header">
                            <h2>Trust & Safety</h2>
                            <p>Your peace of mind is our priority</p>
                        </div>
                        <div className="trust-items-row">
                            <div className="trust-item">
                                <div className="trust-icon-circle"><Shield size={18} /></div>
                                <span>Verified shelters & donors</span>
                            </div>
                            <div className="trust-item">
                                <div className="trust-icon-circle"><FileText size={18} /></div>
                                <span>Health transparency</span>
                            </div>
                            <div className="trust-item">
                                <div className="trust-icon-circle"><MessageCircle size={18} /></div>
                                <span>Secure messaging</span>
                            </div>
                            <div className="trust-item">
                                <div className="trust-icon-circle"><Award size={18} /></div>
                                <span>Admin-reviewed applications</span>
                            </div>
                        </div>
                    </section>

                    {/* 4. CTA BANNER */}
                    <section className="services-cta-section">
                        <div className="cta-text-content">
                            <h2>Ready To Make A <span className="highlight-purple">Difference?</span></h2>
                            <div className="cta-button-group">
                                {/* Utilizing your LandingPage.css button classes for exact consistency */}
                                <button className="btn-primary">Adopt Now</button>
                                <button className="btn-secondary">Rehome a Pet</button>
                            </div>
                        </div>
                        <div className="cta-pets-wrapper">
                            
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Services;