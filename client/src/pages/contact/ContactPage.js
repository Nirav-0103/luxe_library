import React, { useState } from 'react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import toast from 'react-hot-toast';
import { contactAPI } from '../../api';
import './ContactPage.css';

const INFO = [
  {
    icon: '📍',
    title: 'Our Location',
    lines: ['Atmanand Saraswati Science College', 'Kapodara, Surat', 'Gujarat — 395010'],
  },
  {
    icon: '📞',
    title: 'Phone',
    lines: ['+91 96246 07410'],
  },
  {
    icon: '✉️',
    title: 'Email',
    lines: ['info@luxelibrary.in', 'support@luxelibrary.in'],
  },
  {
    icon: '🕐',
    title: 'Working Hours',
    lines: ['Monday – Saturday: 9AM – 8PM', 'Sunday: 10AM – 5PM'],
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const hc = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill all required fields'); return;
    }
    try {
      setLoading(true);
      await contactAPI(form);
      setSent(true);
      toast.success('Message sent! We will reply to your email shortly.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send. Please call us at +91 96246 07410');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      <Header />

      {/* ── HERO ── */}
      <section className="contact-hero">
        <div className="contact-hero__bg" />
        <div className="container contact-hero__inner">
          <p className="contact-hero__tag">
            <span className="contact-hero__tag-line" />
            Get In Touch
          </p>
          <h1 className="contact-hero__title">Contact Us</h1>
          <p className="contact-hero__subtitle">
            We'd love to hear from you. Visit us at our library or reach out through any of the channels below.
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <section className="contact-body">
        <div className="container">
          <div className="contact-grid">

            {/* Left — Info Cards */}
            <div className="contact-info">
              <h2 className="contact-info__title">Reach Out</h2>
              <p className="contact-info__desc">
                Whether you have a question about membership, need help finding a book, or simply want to know more — we are here to help.
              </p>

              <div className="contact-cards">
                {INFO.map((item, i) => (
                  <div key={i} className="contact-card" style={{ '--delay': `${i * 0.1}s` }}>
                    <div className="contact-card__icon">{item.icon}</div>
                    <div className="contact-card__content">
                      <h4 className="contact-card__title">{item.title}</h4>
                      {item.lines.map((line, j) => (
                        <p key={j} className="contact-card__line">{line}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Contact Form */}
            <div className="contact-form-wrap">
              <div className="contact-form-box">
                <h2 className="contact-form__title">Send a Message</h2>
                <p className="contact-form__desc">Fill out the form and we'll get back to you within 24 hours.</p>

                {sent && (
                  <div className="contact-success">
                    ✅ Message sent successfully! We'll get back to you soon.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="contact-form__row">
                    <div className="contact-form__group">
                      <label className="contact-form__label">Full Name *</label>
                      <input
                        className="contact-form__input"
                        name="name"
                        value={form.name}
                        onChange={hc}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div className="contact-form__group">
                      <label className="contact-form__label">Email *</label>
                      <input
                        className="contact-form__input"
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={hc}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="contact-form__group">
                    <label className="contact-form__label">Subject</label>
                    <input
                      className="contact-form__input"
                      name="subject"
                      value={form.subject}
                      onChange={hc}
                      placeholder="What is this about?"
                    />
                  </div>

                  <div className="contact-form__group">
                    <label className="contact-form__label">Message *</label>
                    <textarea
                      className="contact-form__input contact-form__textarea"
                      name="message"
                      value={form.message}
                      onChange={hc}
                      placeholder="Write your message here..."
                      rows="5"
                      required
                    />
                  </div>

                  <button type="submit" className="contact-form__submit">
                    Send Message <span>→</span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAP SECTION ── */}
      <section className="contact-map-section">
        <div className="container">
          <div className="contact-map-header">
            <p className="contact-map-tag">Find Us</p>
            <h2 className="contact-map-title">Our Location</h2>
          </div>
        </div>

        <div className="contact-map-wrap">
          {/* Real Google Maps embed for Kapodara, Surat */}
          <iframe
            className="contact-map-iframe"
            title="Luxe Library Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3720.4!2d72.8777!3d21.2048!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be04f0e1b0a0001%3A0x1234567890abcdef!2sKapodara%2C%20Surat%2C%20Gujarat%20395010!5e0!3m2!1sen!2sin!4v1234567890"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

          {/* Map overlay card */}
          <div className="contact-map-card">
            <div className="contact-map-card__icon">📍</div>
            <div>
              <div className="contact-map-card__name">Luxe Library</div>
              <div className="contact-map-card__addr">Atmanand Saraswati Science College</div>
              <div className="contact-map-card__addr">Kapodara, Surat — 395010</div>
              <a
                href="https://maps.google.com/?q=Kapodara,Surat,Gujarat,395010"
                target="_blank"
                rel="noreferrer"
                className="contact-map-card__link"
              >
                Open in Google Maps →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUICK CONTACT BAR ── */}
      <section className="contact-bar">
        <div className="container contact-bar__inner">
          <div className="contact-bar__item">
            <span className="contact-bar__icon">📞</span>
            <div>
              <div className="contact-bar__label">Call Us</div>
              <a href="tel:+919624607410" className="contact-bar__value">+91 96246 07410</a>
            </div>
          </div>
          <div className="contact-bar__divider" />
          <div className="contact-bar__item">
            <span className="contact-bar__icon">✉️</span>
            <div>
              <div className="contact-bar__label">Email Us</div>
              <a href="mailto:info@luxelibrary.in" className="contact-bar__value">info@luxelibrary.in</a>
            </div>
          </div>
          <div className="contact-bar__divider" />
          <div className="contact-bar__item">
            <span className="contact-bar__icon">🕐</span>
            <div>
              <div className="contact-bar__label">Open Today</div>
              <div className="contact-bar__value">9:00 AM – 8:00 PM</div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
