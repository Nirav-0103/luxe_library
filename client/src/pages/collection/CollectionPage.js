import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import PageTransition from '../../components/layout/PageTransition';
import { getCategoryCountsAPI } from '../../api';
import './CollectionPage.css';

const CATEGORIES = [
  { name: 'Science',     icon: '⚗️', color: '#5a9ce0', desc: 'Physics, Chemistry, Biology & more' },
  { name: 'Technology',  icon: '💻', color: '#5acea0', desc: 'Programming, AI, Engineering & more' },
  { name: 'History',     icon: '📜', color: '#c9a84c', desc: 'Ancient, Modern & World History' },
  { name: 'Literature',  icon: '✍️', color: '#e05a9a', desc: 'Fiction, Poetry, Drama & Classics' },
  { name: 'Philosophy',  icon: '🧠', color: '#9a5ae0', desc: 'Ethics, Logic, Metaphysics & more' },
  { name: 'Biography',   icon: '🌍', color: '#e07a5a', desc: 'Life stories of great personalities' },
];

export default function CollectionPage() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getCategoryCountsAPI()
      .then(res => {
        const map = {};
        res.data.data.forEach(c => { map[c._id] = c.count; });
        setCounts(map);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageTransition>
      <div className="collection-page">
      <Header />

      {/* Hero */}
      <section className="collection-hero">
        <div className="collection-hero__bg" />
        <div className="container collection-hero__inner">
          <p className="col-tag"><span className="col-tag-line" />Our Catalogue</p>
          <h1 className="collection-hero__title">Explore by Category</h1>
          <p className="collection-hero__subtitle" style={{ marginBottom: 24 }}>
            A thoughtfully curated collection spanning every domain of human knowledge and imagination.
          </p>
          <button 
            onClick={() => navigate('/collection/all')}
            style={{ padding: '12px 32px', background: 'var(--gold)', color: '#000', borderRadius: 40, border: 'none', fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer', transition: '0.3s' }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Explore All Books ✨
          </button>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="collection-body">
        <div className="container">
          <div className="col-grid">
            {CATEGORIES.map((cat, i) => {
              const count = counts[cat.name] || 0;
              return (
                <div
                  key={i}
                  className="col-card"
                  style={{ '--delay': `${i * 0.08}s`, '--color': cat.color }}
                  onClick={() => navigate(`/collection/${cat.name.toLowerCase()}`)}
                >
                  <div className="col-card__glow" />
                  <div className="col-card__top">
                    <div className="col-card__icon">{cat.icon}</div>
                    <div className="col-card__count-badge">
                      {loading ? '...' : count} {count === 1 ? 'Book' : 'Books'}
                    </div>
                  </div>
                  <h2 className="col-card__name">{cat.name}</h2>
                  <p className="col-card__desc">{cat.desc}</p>
                  <div className="col-card__footer">
                    <span className="col-card__explore">Explore →</span>
                    <div className="col-card__line" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
    </PageTransition>
  );
}
