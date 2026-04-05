import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import BookModal from './BookModal';
import { getBooksAPI } from '../../api';
import './CollectionPage.css';

const CATEGORY_META = {
  science:    { icon: '⚗️', color: '#5a9ce0', label: 'Science' },
  technology: { icon: '💻', color: '#5acea0', label: 'Technology' },
  history:    { icon: '📜', color: '#c9a84c', label: 'History' },
  literature: { icon: '✍️', color: '#e05a9a', label: 'Literature' },
  philosophy: { icon: '🧠', color: '#9a5ae0', label: 'Philosophy' },
  biography:  { icon: '🌍', color: '#e07a5a', label: 'Biography' },
};

const COVER_COLORS = [
  ['#1a1a3a','#3a3a8a'], ['#1a2a1a','#2a5a2a'], ['#2a1a1a','#6a2a2a'],
  ['#1a1a2a','#2a4a6a'], ['#2a1a2a','#5a2a5a'], ['#2a2a1a','#5a5a1a'],
];

export default function CategoryPage() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedBook, setSelectedBook] = useState(null);

  const meta = category?.toLowerCase() === 'all' 
    ? { icon: '🌎', color: '#c9a84c', label: 'All Books' } 
    : CATEGORY_META[category?.toLowerCase()] || { icon: '📚', color: '#c9a84c', label: category };
    
  const label = meta.label;
  const queryCategory = category?.toLowerCase() === 'all' ? 'All' : label;

  useEffect(() => {
    setLoading(true);
    // Add small debounce to avoid spam
    const timeoutId = setTimeout(() => {
      getBooksAPI({ category: queryCategory, search, minPrice, maxPrice, minRating, sortBy })
        .then(res => setBooks(res.data.data))
        .catch(() => setBooks([]))
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [queryCategory, search, minPrice, maxPrice, minRating, sortBy]);

  return (
    <div className="collection-page">
      <Header />

      {/* Hero */}
      <section className="collection-hero" style={{ '--cat-color': meta.color }}>
        <div className="collection-hero__bg" />
        <div className="container collection-hero__inner">
          <button className="col-back" onClick={() => navigate('/collection')}>
            ← All Categories
          </button>
          <div className="col-cat-icon">{meta.icon}</div>
          <p className="col-tag"><span className="col-tag-line" style={{ background: meta.color }} />Category</p>
          <h1 className="collection-hero__title" style={{ color: 'var(--text-primary)' }}>
            {label}
          </h1>
          <p className="collection-hero__subtitle">
            {books.length} book{books.length !== 1 ? 's' : ''} in this collection
          </p>
        </div>
      </section>

      {/* Books */}
      <section className="collection-body">
        <div className="container">
          {/* Search & Filters */}
          <div className="cat-filters-container" style={{ marginBottom: 40 }}>
            <div className="cat-search-wrap" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: showFilters ? 20 : 0 }}>
              <input
                className="cat-search"
                placeholder={`Search ${label}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, maxWidth: 400 }}
              />
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                style={{ padding: '0 20px', background: showFilters ? 'var(--gold)' : 'var(--bg-card)', color: showFilters ? '#000' : 'var(--text-primary)', border: `1px solid ${showFilters ? 'var(--gold)' : 'var(--border-color2)'}`, borderRadius: 40, cursor: 'pointer', fontWeight: 500, transition: '0.3s' }}
              >
                {showFilters ? 'Hide Filters' : 'Filters ⚙️'}
              </button>
            </div>
            
            {showFilters && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color2)', borderRadius: 12, padding: 24, animation: 'fadeUp 0.3s ease' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
                  
                  {/* Sort */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sort By</label>
                    <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: 10, background: 'var(--bg-card2)', color: 'var(--text-primary)', border: '1px solid var(--border-color2)', borderRadius: 6, outline: 'none' }}>
                      <option value="newest">Newest Added</option>
                      <option value="rating_desc">Highest Rated</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                    </select>
                  </div>

                  {/* Rating */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Minimum Rating</label>
                    <select value={minRating} onChange={e => setMinRating(e.target.value)} style={{ padding: 10, background: 'var(--bg-card2)', color: 'var(--text-primary)', border: '1px solid var(--border-color2)', borderRadius: 6, outline: 'none' }}>
                      <option value="">Any Rating</option>
                      <option value="4">4+ Stars ★</option>
                      <option value="3">3+ Stars ★</option>
                      <option value="2">2+ Stars ★</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Price Range (₹)</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} style={{ width: '100%', padding: 10, background: 'var(--bg-card2)', color: 'var(--text-primary)', border: '1px solid var(--border-color2)', borderRadius: 6, outline: 'none' }} />
                      <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={{ width: '100%', padding: 10, background: 'var(--bg-card2)', color: 'var(--text-primary)', border: '1px solid var(--border-color2)', borderRadius: 6, outline: 'none' }} />
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="col-loading"><div className="spinner" /></div>
          ) : books.length === 0 ? (
            <div className="col-empty">
              <div className="col-empty__icon">{meta.icon}</div>
              <h3 className="col-empty__title">No books found</h3>
              <p className="col-empty__desc">
                {search ? `No results for "${search}"` : `No books in ${label} yet. Admin can add books from the Admin Panel.`}
              </p>
            </div>
          ) : (
            <div className="books-grid">
              {books.map((book, i) => {
                const [c1, c2] = COVER_COLORS[i % COVER_COLORS.length];
                return (
                  <div
                    key={book._id}
                    className="book-card"
                    style={{ '--delay': `${i * 0.05}s` }}
                    onClick={() => setSelectedBook(book)}
                  >
                    {/* Book Cover */}
                    <div className="book-card__cover" style={{ background: `linear-gradient(145deg, ${c1}, ${c2})` }}>
                      {book.coverImage
                        ? <img src={book.coverImage} alt={book.title} className="book-card__cover-img" loading="lazy" />
                        : (
                          <div className="book-card__cover-text">
                            <span className="book-card__cover-title">{book.title}</span>
                            <span className="book-card__cover-author">{book.author}</span>
                          </div>
                        )
                      }
                      <div className="book-card__cover-shine" />
                      {/* Available badge */}
                      <div className={`book-card__avail ${book.availableCopies > 0 ? 'avail--yes' : 'avail--no'}`}>
                        {book.availableCopies > 0 ? `${book.availableCopies} Available` : 'Unavailable'}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="book-card__info">
                      <h3 className="book-card__title">{book.title}</h3>
                      <p className="book-card__author">by {book.author}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        {book.publishedYear && <p className="book-card__year" style={{ marginBottom: 0 }}>{book.publishedYear}</p>}
                        {book.price > 0 && <span style={{ color: 'var(--gold)', fontSize: 13, fontWeight: 600 }}>₹{book.price}</span>}
                      </div>
                      <button className="book-card__btn">View Details</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Book Detail Modal */}
      {selectedBook && (
        <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />
      )}

      <Footer />
    </div>
  );
}
