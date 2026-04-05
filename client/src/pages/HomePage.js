import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import { getRecommendedBooksAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import AntiGravityHero from '../components/layout/AntiGravityHero';
import PageTransition from '../components/layout/PageTransition';
import './HomePage.css';

const SLIDES = [
  {
    tag: 'Premium Collection',
    title: 'Where Knowledge\nMeets Elegance',
    subtitle: 'Discover over 10,000 curated titles across every discipline — from timeless classics to contemporary masterworks.',
    ctaGuest: 'Explore Collection', ctaGuestLink: '#collection',
    ctaUser: 'Browse Collection', ctaUserLink: '#collection',
    accent: '#c9a84c',
  },
  {
    tag: 'Luxe Points Loyalty',
    title: 'Read More,\nEarn More',
    subtitle: 'Join our exclusive loyalty program. Earn points on every digital order and redeem them for free book orders.',
    ctaGuest: 'Join Today', ctaGuestLink: '/signup',
    ctaUser: 'My Dashboard', ctaUserLink: '/dashboard',
    accent: '#5a9ce0',
  },
  {
    tag: 'Digital Experience',
    title: 'A Library Built\nFor the Modern Age',
    subtitle: 'Seamlessly manage your reading list, track borrowed books, and receive personalized alerts — all in one elegant platform.',
    ctaGuest: 'Get Started', ctaGuestLink: '/signup',
    ctaUser: 'Go to Dashboard', ctaUserLink: '/dashboard',
    accent: '#5acea0',
  },
];

const CATEGORIES = [
  { icon: '⚗️', name: 'Science', count: '1,240 Titles' },
  { icon: '💻', name: 'Technology', count: '980 Titles' },
  { icon: '📜', name: 'History', count: '1,560 Titles' },
  { icon: '✍️', name: 'Literature', count: '2,100 Titles' },
  { icon: '🧠', name: 'Philosophy', count: '740 Titles' },
  { icon: '🌍', name: 'Biography', count: '890 Titles' },
];

const STATS = [
  { value: '10,000+', label: 'Books in Collection' },
  { value: '3,200+', label: 'Active Members' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '25+', label: 'Years of Excellence' },
];

const TESTIMONIALS = [
  { name: 'Arjun Mehta', role: 'Researcher', text: 'The collection is extraordinary. I found rare texts here that I could not locate anywhere else in the city.' },
  { name: 'Priya Sharma', role: 'Student', text: 'The digital management system is incredibly smooth. Tracking my borrowed books has never been easier.' },
  { name: 'Vikram Patel', role: 'Author', text: 'A sanctuary for book lovers. The ambiance and the curated selection set this library apart from all others.' },
];

export default function HomePage() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [recommended, setRecommended] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      getRecommendedBooksAPI()
        .then(res => {
          if (res.data?.success) setRecommended(res.data.data);
        })
        .catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => goTo((current + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, [current]);

  const goTo = (idx) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setCurrent(idx); setAnimating(false); }, 400);
  };

  const slide = SLIDES[current];
  const dashLink = user?.role === 'admin' ? '/admin' : '/dashboard';

  return (
    <PageTransition>
      <div className="home">
        <Header />

        {/* HERO SLIDER */}
        <section className="hero">
          <div className="hero__bg">
            <div className="hero__lines">
            {[...Array(6)].map((_, i) => <div key={i} className="hero__line" style={{ '--i': i }} />)}
          </div>
          {/* Replaced Particles with 3D Anti-Gravity Canvas */}
          <AntiGravityHero />
        </div>

        <div className={`hero__content container ${animating ? 'hero__content--exit' : 'hero__content--enter'}`} style={{ zIndex: 10, pointerEvents: 'none' }}>
          <div className="hero__tag" style={{ pointerEvents: 'auto' }}>
            <span className="hero__tag-line" />
            <span>{slide.tag}</span>
          </div>
          <h1 className="hero__title" style={{ '--accent': slide.accent, pointerEvents: 'auto' }}>
            {slide.title.split('\n').map((line, i) => (
              <span key={i}>{i === 1 ? <em className="hero__title-em" style={{ color: slide.accent }}>{line}</em> : line}<br /></span>
            ))}
          </h1>
          <p className="hero__subtitle" style={{ pointerEvents: 'auto' }}>{slide.subtitle}</p>

          {/* AUTH-AWARE BUTTONS */}
          <div className="hero__ctas" style={{ pointerEvents: 'auto' }}>
            {user ? (
              <>
                <Link to={user.role === 'admin' ? '/admin' : slide.ctaUserLink} className="hero__cta-primary" style={{ '--accent': slide.accent }}>
                  {slide.ctaUser}<span className="hero__cta-arrow">→</span>
                </Link>
                <div className="hero__welcome-badge">
                  <span>👋</span>
                  <span>Welcome back, <strong>{user.name.split(' ')[0]}</strong></span>
                </div>
              </>
            ) : (
              <>
                <Link to={slide.ctaGuestLink} className="hero__cta-primary" style={{ '--accent': slide.accent }}>
                  {slide.ctaGuest}<span className="hero__cta-arrow">→</span>
                </Link>
                <Link to="/login" className="hero__cta-ghost">Sign In</Link>
              </>
            )}
          </div>
        </div>

        <div className="hero__controls">
          {SLIDES.map((_, i) => (
            <button key={i} className={`hero__dot ${i === current ? 'active' : ''}`} onClick={() => goTo(i)} style={{ '--accent': SLIDES[i].accent }} />
          ))}
        </div>

        <div className="hero__counter">
          <span className="hero__counter-current">{String(current + 1).padStart(2, '0')}</span>
          <span className="hero__counter-sep" />
          <span className="hero__counter-total">{String(SLIDES.length).padStart(2, '0')}</span>
        </div>

        {/* ✅ ROTATING BADGE — NAVU ADD KARYU */}
        <div className="hero__rotating-badge">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <path id="badgeCircle" d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0" />
            </defs>
            <text fill="#C9A84C" fontSize="10.5" fontFamily="Jost, sans-serif" letterSpacing="2.5">
              <textPath href="#badgeCircle">
                LUXE LIBRARY • PREMIUM COLLECTION •
              </textPath>
            </text>
            <text x="50" y="55" textAnchor="middle" fontSize="20" fill="#C9A84C">★</text>
          </svg>
        </div>

        <div className="hero__scroll-hint">
          <div className="hero__scroll-line" />
          <span>Scroll</span>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="stats-bar">
        <div className="container">
          <div className="stats-bar__grid">
            {STATS.map((s, i) => (
              <div key={i} className="stats-bar__item">
                <div className="stats-bar__value">{s.value}</div>
                <div className="stats-bar__label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* RECOMMENDED FOR YOU (PHASE 6) */}
      {user && recommended.length > 0 && (
        <section className="section" style={{ background: 'var(--bg-card)', padding: '60px 0' }}>
          <div className="container">
            <div className="section__header">
              <p className="section__tag">Personalized For You</p>
              <h2 className="section__title">Recommended Reads</h2>
              <p className="section__subtitle">Curated dynamically based on your wishlist and reading history.</p>
            </div>
            
            <div className="recommended-marquee-container">
              <div className="recommended-marquee-track">
                {[...recommended, ...recommended].map((rb, i) => (
                  <div key={i} onClick={() => navigate(`/read/${rb._id}`)} style={{ 
                    cursor: 'pointer', background: 'var(--bg-primary)', padding: 16, borderRadius: 12, 
                    border: '1px solid var(--border-color2)', transition: '0.3s',
                    width: 180, flexShrink: 0  // Fixed width for smooth sliding
                  }} onMouseOver={(e)=>e.currentTarget.style.borderColor='var(--gold)'} onMouseOut={(e)=>e.currentTarget.style.borderColor='var(--border-color2)'}>
                    <img src={rb.coverImage} alt={rb.title} style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 8, marginBottom: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <h4 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'normal' }}>{rb.title}</h4>
                    <p style={{ fontSize: 13, color: 'var(--gold)', marginTop: 4 }}>{rb.author}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* COLLECTION */}
      <section className="section" id="collection">
        <div className="container">
          <div className="section__header">
            <p className="section__tag">Our Catalogue</p>
            <h2 className="section__title">Explore by Category</h2>
            <p className="section__subtitle">A thoughtfully curated collection spanning every domain of human knowledge and imagination.</p>
          </div>
          <div className="categories__grid">
            {CATEGORIES.map((cat, i) => (
              <div key={i} className="category-card" style={{ '--delay': `${i * 0.08}s` }}>
                <div className="category-card__icon">{cat.icon}</div>
                <h3 className="category-card__name">{cat.name}</h3>
                <p className="category-card__count">{cat.count}</p>
                <div className="category-card__line" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="about" id="about">
        <div className="container">
          <div className="about__grid">
            <div className="about__visual">
              <div className="about__frame">
                <div className="about__frame-inner">
                  <div className="about__book-stack">
                    {['📚', '📖', '📕', '📗'].map((e, i) => (
                      <div key={i} className="about__book" style={{ '--i': i }}>{e}</div>
                    ))}
                  </div>
                  <div className="about__badge">
                    <span className="about__badge-num">25</span>
                    <span className="about__badge-text">Years of<br />Excellence</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="about__content">
              <p className="section__tag">Our Story</p>
              <h2 className="section__title" style={{ textAlign: 'left' }}>A Legacy Built on Knowledge</h2>
              <p className="about__text">Founded in 1999, Luxe Library began with a simple vision — to create a space where knowledge and beauty coexist. Over 25 years, we have grown from a small reading room to one of the finest curated libraries in Gujarat.</p>
              <p className="about__text">Our collection is meticulously selected by expert librarians who believe every book should earn its place on our shelves. We don't just stock books — we curate experiences.</p>
              <div className="about__features">
                {['Expert Curation', 'Digital Management', 'Member Benefits', 'Reading Events'].map((f, i) => (
                  <div key={i} className="about__feature"><span className="about__feature-dot" />{f}</div>
                ))}
              </div>
              {user ? (
                <Link to={dashLink} className="about__cta">Go to Dashboard</Link>
              ) : (
                <Link to="/signup" className="about__cta">Become a Member</Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials">
        <div className="container">
          <div className="section__header">
            <p className="section__tag">Testimonials</p>
            <h2 className="section__title">What Our Members Say</h2>
          </div>
          <div className="testimonials__grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-card__quote">"</div>
                <p className="testimonial-card__text">{t.text}</p>
                <div className="testimonial-card__author">
                  <div className="testimonial-card__avatar">{t.name[0]}</div>
                  <div>
                    <div className="testimonial-card__name">{t.name}</div>
                    <div className="testimonial-card__role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER — AUTH AWARE */}
      <section className="cta-banner" id="cta">
        <div className="cta-banner__glow" />
        <div className="container">
          <div className="cta-banner__inner">
            {user ? (
              <>
                <p className="section__tag">Welcome Back</p>
                <h2 className="cta-banner__title">Continue Your Journey</h2>
                <p className="cta-banner__subtitle">
                  You are logged in as <strong style={{ color: 'var(--gold)' }}>{user.name}</strong>. Explore our collection and manage your books.
                </p>
                <div className="cta-banner__actions">
                  <Link to={dashLink} className="hero__cta-primary">
                    {user.role === 'admin' ? '🛡️ Admin Panel' : '📚 My Dashboard'}
                  </Link>
                  <Link to="/#collection" className="hero__cta-ghost">Browse Collection</Link>
                </div>
              </>
            ) : (
              <>
                <p className="section__tag">Get Started Today</p>
                <h2 className="cta-banner__title">Ready to Begin Your Journey?</h2>
                <p className="cta-banner__subtitle">Join thousands of members who have discovered the joy of reading with Luxe Library.</p>
                <div className="cta-banner__actions">
                  <Link to="/signup" className="hero__cta-primary">Create Free Account</Link>
                  <Link to="/login" className="hero__cta-ghost">Sign In</Link>
                </div>
              </>
            )}
            <div className="cta-banner__contact">
              <span>📞 +91 96246 07410</span>
              <span>✉️ info@luxelibrary.in</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
    </PageTransition>
  );
}