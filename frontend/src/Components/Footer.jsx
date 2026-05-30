import React from 'react';
import { Instagram, Facebook, Mail, MapPin, Globe } from 'lucide-react';
import './Footer.css';
import logo from '../Assets/Logo/Logo.png';

const TikTokIcon = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const Footer = () => {
    return (
        <footer className="pawcha-footer">
            <div className="footer-inner">
                <div className="footer-content">
                    <div className="footer-brand-section">
                        <img src={logo} alt="PawCha Logo" className="footer-logo" />
                        <p className="footer-text">
                            Connecting hearts and homes. We make pet adoption in Nepal safe, transparent, and easy for everyone.
                        </p>
                        <div className="footer-socials">
                            <div className="social-icon-wrapper"><Globe size={32} /></div>
                            <div className="social-icon-wrapper"><Instagram size={32} /></div>
                            <div className="social-icon-wrapper"><TikTokIcon size={32} /></div>
                            <div className="social-icon-wrapper"><Facebook size={32} /></div>
                        </div>
                    </div>

                    <div className="footer-links-container">
                        <div className="footer-column">
                            <h3 className="footer-heading">Explore</h3>
                            <ul className="footer-list">
                                <li>Find a Pet</li>
                                <li>Rehome a Pet</li>
                                <li>Success Stories</li>
                                <li>How it Works</li>
                                <li>Volunteer with Us</li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h3 className="footer-heading">Support & Resources</h3>
                            <ul className="footer-list">
                                <li>Adoption Guide</li>
                                <li>Pet Care Tips</li>
                                <li>Verified Health Cards</li>
                                <li>Safety & Security</li>
                                <li>FAQs</li>
                            </ul>
                        </div>

                        <div className="footer-column">
                            <h3 className="footer-heading">Get in Touch</h3>
                            <div className="contact-info">
                                <div className="contact-item">
                                    <Mail size={20} />
                                    <span>info.pawcha@gmail.com</span>
                                </div>
                                <div className="contact-item">
                                    <MapPin size={20} />
                                    <span>Kathmandu, Nepal</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="footer-divider"></div>

                <div className="footer-bottom">
                    <div className="copyright">© 2026 Pawcha Nepal. All rights reserved. Built with love for animals.</div>
                    <div className="legal-links">
                        <span>Privacy Policy</span>
                        <span>Terms of Use</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;