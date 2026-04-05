import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import './AboutPage.css';

const STATS = [
  { value: 10000, suffix: '+', label: 'Books in Collection' },
  { value: 3200,  suffix: '+', label: 'Active Members' },
  { value: 25,    suffix: '',  label: 'Years of Excellence' },
  { value: 98,    suffix: '%', label: 'Member Satisfaction' },
];

const SERVICES = [
  {
    icon: '📚',
    title: 'Premium Book Lending',
    desc: 'Borrow from our curated collection of over 10,000 titles across every genre and discipline with flexible lending periods.',
  },
  {
    icon: '🔍',
    title: 'Expert Curation',
    desc: 'Every book is hand-selected by our team of expert librarians ensuring only the finest titles grace our shelves.',
  },
  {
    icon: '💻',
    title: 'Digital Management',
    desc: 'Track your borrowed books, manage your account, and receive smart reminders through our elegant digital platform.',
  },
  {
    icon: '🎓',
    title: 'Academic Support',
    desc: 'Special collections and dedicated sections for students and researchers with access to rare academic texts.',
  },
  {
    icon: '📖',
    title: 'Reading Events',
    desc: 'Regular book clubs, author meets, and literary discussions to bring our community of readers together.',
  },
  {
    icon: '🌐',
    title: 'Online Catalogue',
    desc: 'Browse our entire collection from anywhere, check availability, and reserve books before you visit.',
  },
];

const TIMELINE = [
  { year: '1999', title: 'Founded', desc: 'Luxe Library opened its doors with a modest collection of 500 books and a grand vision.' },
  { year: '2005', title: 'Expansion', desc: 'Moved to a larger premises and expanded our collection to over 3,000 titles.' },
  { year: '2012', title: 'Digital Era', desc: 'Launched our first digital catalogue system, bringing our collection online.' },
  { year: '2018', title: 'Community Hub', desc: 'Introduced reading events, book clubs, and academic partnerships with local colleges.' },
  { year: '2024', title: 'Full Platform', desc: 'Launched our complete digital management platform with member portal and smart tracking.' },
];

const TEAM = [
  { name: 'Dr. Priya Mehta', role: 'Chief Librarian', emoji: '👩‍💼', desc: 'PhD in Library Science with 20+ years of curation expertise.' },
  { name: 'Arjun Patel', role: 'Digital Manager', emoji: '👨‍💻', desc: 'Built and maintains our award-winning digital platform.' },
  { name: 'Sonal Shah', role: 'Member Relations', emoji: '👩‍🏫', desc: 'Dedicated to ensuring every member has an exceptional experience.' },
  { name: 'Vikram Desai', role: 'Collections Lead', emoji: '🧑‍🔬', desc: 'Handpicks every new acquisition ensuring quality and relevance.' },
];

// Animated counter hook
function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

function StatCard({ value, suffix, label, animate }) {
  const count = useCounter(value, 1800, animate);
  return (
    <div className="about-stat">
      <div className="about-stat__value">{animate ? count : 0}{suffix}</div>
      <div className="about-stat__label">{label}</div>
    </div>
  );
}

export default function AboutPage() {
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-page">
      <Header />

      {/* ── HERO ── */}
      <section className="about-hero">
        <div className="about-hero__bg">
          <div className="about-hero__lines">
            {[...Array(5)].map((_, i) => <div key={i} className="about-hero__line" style={{ '--i': i }} />)}
          </div>
        </div>
        <div className="container about-hero__inner">
          <div className="about-hero__content">
            <p className="about-hero__tag">
              <span className="about-hero__tag-line" />
              Our Story
            </p>
            <h1 className="about-hero__title">
              A Legacy Built on
              <em className="about-hero__title-em"> Knowledge</em>
            </h1>
            <p className="about-hero__subtitle">
              For over 25 years, Luxe Library has been Gujarat's premier destination for the discerning reader — a sanctuary where knowledge and elegance meet.
            </p>
            <div className="about-hero__ctas">
              <Link to="/contact" className="about-hero__cta-primary">Get In Touch</Link>
              <Link to="/signup" className="about-hero__cta-ghost">Join Free</Link>
            </div>
          </div>
          <div className="about-hero__visual">
            <div className="about-hero__card about-hero__card--1">
              <span className="about-hero__card-icon">📚</span>
              <span>10,000+ Books</span>
            </div>
            <div className="about-hero__card about-hero__card--2">
              <span className="about-hero__card-icon">⭐</span>
              <span>Est. 1999</span>
            </div>
            <div className="about-hero__card about-hero__card--3">
              <span className="about-hero__card-icon">👥</span>
              <span>3,200 Members</span>
            </div>
            <div className="about-hero__glow" />
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="about-stats" ref={statsRef}>
        <div className="container">
          <div className="about-stats__grid">
            {STATS.map((s, i) => (
              <StatCard key={i} value={s.value} suffix={s.suffix} label={s.label} animate={statsVisible} />
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION ── */}
      <section className="about-mission">
        <div className="container">
          <div className="about-mission__grid">
            <div className="about-mission__content">
              <p className="section-tag">Our Mission</p>
              <h2 className="about-mission__title">Why We Exist</h2>
              <p className="about-mission__text">
                We believe that access to great books should feel like a privilege, not a chore. Luxe Library was founded on the conviction that the right book at the right time can change a life.
              </p>
              <p className="about-mission__text">
                Our mission is to connect the people of Gujarat with the world's greatest ideas — curated with care, presented with elegance, and managed with technology that stays out of your way.
              </p>
              <div className="about-mission__pillars">
                {['Curate with Excellence', 'Serve with Passion', 'Innovate with Purpose'].map((p, i) => (
                  <div key={i} className="about-mission__pillar">
                    <div className="about-mission__pillar-dot" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="about-mission__quote-box">
              <div className="about-mission__quote-mark">"</div>
              <blockquote className="about-mission__quote">
                A reader lives a thousand lives before he dies. The man who never reads lives only one.
              </blockquote>
              <cite className="about-mission__cite">— George R.R. Martin</cite>
              <div className="about-mission__quote-deco" />
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="about-services">
        <div className="container">
          <div className="section-header">
            <p className="section-tag">What We Offer</p>
            <h2 className="about-services__title">Our Services</h2>
            <p className="about-services__subtitle">Everything you need for an exceptional library experience.</p>
          </div>
          <div className="about-services__grid">
            {SERVICES.map((s, i) => (
              <div key={i} className="service-card" style={{ '--delay': `${i * 0.08}s` }}>
                <div className="service-card__icon">{s.icon}</div>
                <h3 className="service-card__title">{s.title}</h3>
                <p className="service-card__desc">{s.desc}</p>
                <div className="service-card__line" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="about-timeline">
        <div className="container">
          <div className="section-header">
            <p className="section-tag">Our Journey</p>
            <h2 className="about-timeline__title">25 Years of Excellence</h2>
          </div>
          <div className="timeline">
            {TIMELINE.map((item, i) => (
              <div key={i} className={`timeline-item ${i % 2 === 0 ? 'timeline-item--left' : 'timeline-item--right'}`}>
                <div className="timeline-item__dot">
                  <div className="timeline-item__dot-inner" />
                </div>
                <div className="timeline-item__card">
                  <div className="timeline-item__year">{item.year}</div>
                  <h4 className="timeline-item__title">{item.title}</h4>
                  <p className="timeline-item__desc">{item.desc}</p>
                </div>
              </div>
            ))}
            <div className="timeline__line" />
          </div>
        </div>
      </section>

      {/* ── TEAM ── */}
      <section className="about-team">
        <div className="container">
          <div className="section-header">
            <p className="section-tag">The People</p>
            <h2 className="about-team__title">Meet Our Team</h2>
            <p className="about-team__subtitle">Passionate professionals dedicated to your reading experience.</p>
          </div>
          <div className="about-team__grid">
            {TEAM.map((member, i) => (
              <div key={i} className="team-card" style={{ '--delay': `${i * 0.1}s` }}>
                <div className="team-card__avatar">{member.emoji}</div>
                <h3 className="team-card__name">{member.name}</h3>
                <p className="team-card__role">{member.role}</p>
                <p className="team-card__desc">{member.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="about-cta">
        <div className="about-cta__glow" />
        <div className="container about-cta__inner">
          <p className="section-tag">Join Us</p>
          <h2 className="about-cta__title">Become Part of Our Story</h2>
          <p className="about-cta__subtitle">Join thousands of readers who have made Luxe Library their intellectual home.</p>
          <div className="about-cta__actions">
            <Link to="/signup" className="about-hero__cta-primary">Create Free Account</Link>
            <Link to="/contact" className="about-hero__cta-ghost">Contact Us</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
