import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { addBookReviewAPI, getBookAPI, getRelatedBooksAPI } from '../../api';
import { io } from 'socket.io-client';
import './BookModal.css';

export default function BookModal({ book: initialBook, onClose }) {
  const [book, setBook] = useState(initialBook);
  const [mainImg, setMainImg] = useState(initialBook.coverImage || '');
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [related, setRelated] = useState([]);
  const [viewers, setViewers] = useState(1);
  const { addToCart, removeFromCart, isInCart } = useCart();
  const { user, wishlist, toggleWishlistItem } = useAuth();
  const navigate = useNavigate();
  
  const inCart = isInCart(book._id);
  const wishlisted = wishlist?.some(b => (b._id === book._id) || (b === book._id)) || false;

  useEffect(() => {
    getBookAPI(book._id).then(res => setBook(res.data.data)).catch(console.error);
    getRelatedBooksAPI(book._id).then(res => setRelated(res.data.data)).catch(console.error);

    const socketUrl = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:8080';
    const socket = io(socketUrl);
    socket.emit('join_book', book._id);
    socket.on('viewers_count', count => setViewers(count));

    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      socket.emit('leave_book', book._id);
      socket.disconnect();
    };
  }, [book._id, onClose]);

  const handleCart = () => {
    if (inCart) {
      removeFromCart(book._id);
      toast('Removed from cart', { icon: '🗑️' });
    } else {
      if (book.availableCopies <= 0) {
        toast.error('This book is currently unavailable');
        return;
      }
      // Explicitly pass all needed fields including price
      const bookToAdd = {
        _id: book._id,
        title: book.title,
        author: book.author,
        category: book.category,
        price: Number(book.price) || 0,
        coverImage: book.coverImage || '',
        availableCopies: book.availableCopies,
        totalCopies: book.totalCopies,
        isbn: book.isbn,
        publisher: book.publisher || '',
        publishedYear: book.publishedYear || '',
        language: book.language || '',
        pages: book.pages || '',
        description: book.description || '',
      };
      console.log('Adding to cart with price:', bookToAdd.price); // debug
      addToCart(bookToAdd);
      toast.success(`Added to cart! ₹${bookToAdd.price > 0 ? bookToAdd.price : 'Free'} 🛒`);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login to post a review');
    try {
      setReviewLoading(true);
      await addBookReviewAPI(book._id, reviewForm);
      toast.success('Review added successfully!');
      const res = await getBookAPI(book._id);
      setBook(res.data.data);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post review');
    } finally {
      setReviewLoading(false);
    }
  };

  const hasReviewed = book.reviews?.some(r => r.user?.toString() === user?._id?.toString());

  return (
    <div className="bmodal-overlay" onClick={onClose}>
      <div className="bmodal" onClick={e => e.stopPropagation()}>
        <button className="bmodal__close" onClick={onClose}>✕</button>

        <div className="bmodal__inner">
          {/* Left — Cover */}
          <div className="bmodal__left">
            <div className="bmodal__cover">
              {(mainImg || book.coverImage)
                ? <img src={mainImg || book.coverImage} alt={book.title} className="bmodal__cover-img" />
                : (
                  <div className="bmodal__cover-placeholder">
                    <span className="bmodal__cover-emoji">📖</span>
                    <span className="bmodal__cover-ctitle">{book.title}</span>
                    <span className="bmodal__cover-cauthor">{book.author}</span>
                  </div>
                )
              }
            </div>

            {/* Extra Images Gallery */}
            {book.extraImages && book.extraImages.length > 0 && (
              <div className="bmodal__gallery">
                {book.extraImages.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt={`${book.title} ${i+1}`}
                    className="bmodal__gallery-img"
                    onClick={() => setMainImg(img)}
                  />
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="bmodal__actions">
              <button
                className={`bmodal__cart-btn ${inCart ? 'in-cart' : ''} ${book.availableCopies <= 0 ? 'unavailable' : ''}`}
                onClick={handleCart}
                disabled={book.availableCopies <= 0 && !inCart}
              >
                {inCart
                  ? '✅ In Cart — Click to Remove'
                  : book.availableCopies <= 0
                    ? '❌ Unavailable'
                    : `🛒 Add to Cart${book.price > 0 ? ` — ₹${book.price}` : ' — Free'}`}
              </button>

              <button
                className={`bmodal__wishlist ${wishlisted ? 'wishlisted' : ''}`}
                onClick={async () => {
                  if (!user) {
                    toast.error('Please login to use wishlist');
                    onClose();
                    navigate('/login');
                    return;
                  }
                  setWishlistLoading(true);
                  const res = await toggleWishlistItem(book._id);
                  if (res.success) toast(res.message);
                  else toast.error(res.message);
                  setWishlistLoading(false);
                }}
                disabled={wishlistLoading}
              >
                {wishlisted ? '❤️ Wishlisted' : '🤍 Wishlist'}
              </button>
            </div>
          </div>

          {/* Right — Details */}
          <div className="bmodal__right">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="bmodal__category">{book.category}</div>
              <div style={{ fontSize: 12, color: 'var(--gold)', background: 'rgba(201,168,76,0.1)', padding: '4px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display:'inline-block', width:6, height:6, background:'var(--gold)', borderRadius:'50%', animation: 'pulse 2s infinite' }} />
                {viewers} {viewers === 1 ? 'person' : 'people'} currently viewing
              </div>
            </div>
            <h2 className="bmodal__title">{book.title}</h2>
            
            {/* Aggregate Rating */}
            {book.numReviews > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ color: 'var(--gold)' }}>{'★'.repeat(Math.round(book.rating))}</span>
                <span style={{ color: 'var(--text-muted)' }}>{'★'.repeat(5 - Math.round(book.rating))}</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{book.rating.toFixed(1)} ({book.numReviews} reviews)</span>
              </div>
            )}

            <p className="bmodal__author">by <strong>{book.author}</strong></p>

            {/* Price display */}
            {book.price > 0 && (
              <div style={{
                display:'inline-block',
                padding:'6px 16px', marginBottom:12,
                background:'rgba(201,168,76,0.12)',
                border:'1px solid rgba(201,168,76,0.3)',
                borderRadius:20, fontSize:16, fontWeight:700,
                color:'var(--gold)'
              }}>
                ₹{book.price}
              </div>
            )}

            {/* Availability */}
            <div className={`bmodal__avail-bar ${book.availableCopies > 0 ? 'avail-bar--yes' : 'avail-bar--no'}`}>
              {book.availableCopies > 0
                ? `✅ ${book.availableCopies} cop${book.availableCopies === 1 ? 'y' : 'ies'} available`
                : '❌ Currently unavailable'}
            </div>

            {book.description && (
              <p className="bmodal__desc">{book.description}</p>
            )}

            <div className="bmodal__details">
              {book.publisher && (
                <div className="bmodal__detail">
                  <span className="bmodal__detail-label">Publisher</span>
                  <span className="bmodal__detail-value">{book.publisher}</span>
                </div>
              )}
              {book.publishedYear && (
                <div className="bmodal__detail">
                  <span className="bmodal__detail-label">Year</span>
                  <span className="bmodal__detail-value">{book.publishedYear}</span>
                </div>
              )}
              {book.language && (
                <div className="bmodal__detail">
                  <span className="bmodal__detail-label">Language</span>
                  <span className="bmodal__detail-value">{book.language}</span>
                </div>
              )}
              {book.pages && (
                <div className="bmodal__detail">
                  <span className="bmodal__detail-label">Pages</span>
                  <span className="bmodal__detail-value">{book.pages}</span>
                </div>
              )}
              <div className="bmodal__detail">
                <span className="bmodal__detail-label">ISBN</span>
                <span className="bmodal__detail-value" style={{ fontFamily: 'monospace', fontSize:11 }}>{book.isbn}</span>
              </div>
              <div className="bmodal__detail">
                <span className="bmodal__detail-label">Copies</span>
                <span className="bmodal__detail-value">{book.availableCopies} / {book.totalCopies}</span>
              </div>
            </div>

            <div className="bmodal__note">
              <span>ℹ️</span>
              <span>Go to Library and check book condition before, if you purchase book offline</span>
            </div>

            {/* REVIEWS SECTION */}
            <div className="bmodal__reviews-section" style={{ marginTop: 32, borderTop: '1px solid var(--border-color2)', paddingTop: 24, maxHeight: 400, overflowY: 'auto' }}>
              <h3 style={{ fontSize: 18, marginBottom: 16 }}>Reviews & Ratings</h3>
              
              {/* New Review Form */}
              {user ? (
                hasReviewed ? (
                  <div style={{ padding: 12, background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, color: 'var(--gold)', marginBottom: 20, fontSize: 14 }}>
                    Thanks! You have already reviewed this book.
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} style={{ marginBottom: 24, padding: 16, background: 'var(--bg-card2)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                    <h4 style={{ fontSize: 14, marginBottom: 10 }}>Write a Review</h4>
                    <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color:'var(--text-secondary)' }}>Rating: </span>
                      <select value={reviewForm.rating} onChange={e => setReviewForm(prev => ({...prev, rating: e.target.value}))} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color2)', padding: '4px 8px', borderRadius: 4, outline: 'none' }}>
                        {[5, 4, 3, 2, 1].map(r => <option key={r} value={r}>{r} Stars</option>)}
                      </select>
                    </div>
                    <textarea 
                      placeholder="Share your thoughts about this book..."
                      required
                      value={reviewForm.comment}
                      onChange={e => setReviewForm(prev => ({...prev, comment: e.target.value}))}
                      style={{ width: '100%', minHeight: 60, background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color2)', padding: 10, borderRadius: 6, marginBottom: 10, resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                    />
                    <button type="submit" disabled={reviewLoading} style={{ background: 'var(--gold)', color: '#000', padding: '8px 16px', borderRadius: 4, border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                      {reviewLoading ? 'Submitting...' : 'Post Review'}
                    </button>
                  </form>
                )
              ) : (
                <div style={{ padding: 12, background: 'var(--bg-card2)', borderRadius: 8, border: '1px solid var(--border-color)', color: 'var(--text-secondary)', marginBottom: 20, fontSize: 13 }}>
                  Please <a href="/login" onClick={(e) => { e.preventDefault(); onClose(); navigate('/login'); }} style={{ color: 'var(--gold)' }}>login</a> to write a review.
                </div>
              )}

              {/* Review List */}
              {book.reviews && book.reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {book.reviews.slice().reverse().map((r, i) => (
                    <div key={i} style={{ padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border-color2)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ color: 'var(--gold)', marginBottom: 8, fontSize: 14 }}>
                        {'★'.repeat(Math.round(r.rating))}{'☆'.repeat(5 - Math.round(r.rating))}
                      </div>
                      <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 14, paddingBottom: 20 }}>No reviews yet. Be the first to review!</p>
              )}
            </div>
          </div>
        </div>

        {/* RELATED BOOKS SECTION */}
        {related && related.length > 0 && (
          <div style={{ padding: '24px 32px', borderTop: '1px solid var(--border-color)', marginTop: 10 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16, fontFamily: '"Cormorant Garamond", serif' }}>You May Also Like</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16 }}>
              {related.map((rb, i) => (
                <div key={i} onClick={() => { setBook(rb); setMainImg(''); getBookAPI(rb._id).then(res=>setBook(res.data.data)); getRelatedBooksAPI(rb._id).then(res=>setRelated(res.data.data))}} style={{ cursor: 'pointer', background: 'var(--bg-card)', padding: 10, borderRadius: 8, border: '1px solid var(--border-color2)', transition: '0.2s' }} onMouseOver={(e)=>e.currentTarget.style.borderColor='var(--gold)'} onMouseOut={(e)=>e.currentTarget.style.borderColor='var(--border-color2)'}>
                  <img src={rb.coverImage} alt={rb.title} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }} />
                  <h4 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{rb.title}</h4>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{rb.author}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}