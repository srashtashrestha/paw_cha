import React, { useState } from 'react';
import { Mail, Phone, MapPin, AlertCircle } from 'lucide-react';
import NavBar from './NavBar';
import Footer from './Footer';
import './ContactUs.css';

const ContactUs = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFeedback({ type: '', message: '' });

        try {
            const response = await fetch('http://localhost:5000/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setFeedback({ type: 'success', message: 'Your message has been sent successfully! We will get back to you soon.' });
                setFormData({ fullName: '', email: '', phone: '', subject: '', message: '' });
            } else {
                setFeedback({ type: 'error', message: data.message || 'Failed to send message. Please try again.' });
            }
        } catch (error) {
            console.error('Contact submission error:', error);
            setFeedback({ type: 'error', message: 'Network error. Please check your connection and try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="landing-wrapper">
            <NavBar />

            <main className="main-content">
                <section className="contact-container">
                    <div className="contact-inner">
                        
                        {/* --- HEADER SECTION --- */}
                        <div className="contact-header">
                            <h1 className="hero-title">We're Here to <span className="highlight-purple">Help</span></h1>
                            <p className="hero-subtitle" style={{ textAlign: 'center' }}>
                                Have questions about adoptions, donations, or pet care? Reach out anytime
                            </p>
                        </div>

                        {/* --- CONTACT CARDS GRID --- */}
                        <div className="contact-cards-grid">
                            <div className="contact-info-card">
                                <div className="contact-icon-wrapper">
                                    <Mail size={24} />
                                </div>
                                <h3>Email Support</h3>
                                <p className="primary-info">support@pawcha.com</p>
                                <p className="secondary-info">Response within 24 hours</p>
                            </div>

                            <div className="contact-info-card">
                                <div className="contact-icon-wrapper purple">
                                    <Phone size={24} />
                                </div>
                                <h3>Phone Support</h3>
                                <p className="primary-info">+1 (555) 123-4567</p>
                                <p className="secondary-info">Mon-Fri: 9am - 6pm EST</p>
                            </div>

                            <div className="contact-info-card">
                                <div className="contact-icon-wrapper pink">
                                    <MapPin size={24} />
                                </div>
                                <h3>Visit Us</h3>
                                <p className="primary-info">123 Pet Haven Lane, Austin, TX<br/>78701</p>
                                <p className="secondary-info">Open daily 10am - 5pm</p>
                            </div>

                            <div className="contact-info-card emergency-card">
                                <div className="contact-icon-wrapper gold">
                                    <AlertCircle size={24} />
                                </div>
                                <h3>Emergency Pet Help</h3>
                                <p className="primary-info">+1 (555) 911-PETS</p>
                                <p className="secondary-info">Available 24/7</p>
                                <p className="emergency-text">For urgent pet emergencies</p>
                            </div>
                        </div>

                        {/* --- CONTACT FORM SECTION --- */}
                        <div className="contact-form-section">
                            <div className="form-header">
                                <h2 className="listing-title">Send Us a Message</h2>
                                <p className="hero-subtitle" style={{ textAlign: 'center' }}>
                                    Fill out the form below and we'll get back to you as soon as possible
                                </p>
                            </div>

                            <form className="contact-form-box" onSubmit={handleSubmit}>
                                <div className="form-row full-width">
                                    <label htmlFor="fullName">Full name*</label>
                                    <input 
                                        type="text" 
                                        id="fullName" 
                                        name="fullName" 
                                        placeholder="Ram Shrestha" 
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        required 
                                    />
                                </div>

                                <div className="form-row split">
                                    <div className="form-group">
                                        <label htmlFor="email">Email Address</label>
                                        <input 
                                            type="email" 
                                            id="email" 
                                            name="email" 
                                            placeholder="email@example.com" 
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required 
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="phone">Phone Number</label>
                                        <input 
                                            type="tel" 
                                            id="phone" 
                                            name="phone" 
                                            placeholder="+977 9871284901" 
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-row full-width">
                                    <label htmlFor="subject">Subject</label>
                                    <select 
                                        id="subject" 
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="" disabled>Select a Topic</option>
                                        <option value="adoption">Adoption Inquiry</option>
                                        <option value="donation">Donation Support</option>
                                        <option value="technical">Technical Issue</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div className="form-row full-width">
                                    <label htmlFor="message">Your Message*</label>
                                    <textarea 
                                        id="message" 
                                        name="message" 
                                        placeholder="Type your message here..." 
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        required
                                    ></textarea>
                                </div>

                                {feedback.message && (
                                    <div className={`form-feedback ${feedback.type}`}>
                                        {feedback.message}
                                    </div>
                                )}

                                {/* Using your established LandingPage button styles */}
                                <button 
                                    type="submit" 
                                    className="btn-primary" 
                                    style={{ width: '100%', marginTop: '16px' }}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Sending...' : 'Send Message'}
                                </button>
                            </form>
                        </div>

                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default ContactUs;