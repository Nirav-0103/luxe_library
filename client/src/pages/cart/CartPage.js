import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './CartPage.css';

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleRemove = (book) => {
    removeFromCart(book._id);
    toast(`"${book.title}" removed`, { icon: '🗑️' });
  };

  const handleClear = () => {
    if (!window.confirm('Clear all items?')) return;
    clearCart();
    toast('Cart cleared!', { icon: '🛒' });
  };

  const handleCheckout = () => {
    if (!user) { toast.error('Please login to proceed'); navigate('/login'); return; }
    navigate('/checkout');
  };

  return (
    <div className="cart-page">
      <Header />

      <section className="cart-hero">
        <div className="cart-hero__bg" />
        <div className="container cart-hero__inner">
          <p className="cart-tag"><span className="cart-tag-line" />My Cart</p>
          <h1 className="cart-title">Book Cart</h1>
          <p className="cart-subtitle">
            {items.length === 0
              ? 'Your cart is empty'
              : `${items.reduce((s,i) => s+(i.quantity||1), 0)} item${items.reduce((s,i) => s+(i.quantity||1), 0) > 1 ? 's' : ''} selected`}
          </p>
        </div>
      </section>

      <section className="cart-body">
        <div className="container">
          {items.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty__icon">🛒</div>
              <h2 className="cart-empty__title">Your cart is empty</h2>
              <p className="cart-empty__desc">Browse our collection and add books you'd like.</p>
              <Link to="/collection" className="cart-empty__btn">Explore Collection →</Link>
            </div>
          ) : (
            <div className="cart-grid">
              {/* Book List */}
              <div className="cart-list">
                <div className="cart-list__header">
                  <h2 className="cart-list__title">Selected Books</h2>
                  <button className="cart-clear-btn" onClick={handleClear}>Clear All</button>
                </div>

                {items.map((book, i) => (
                  <div key={book._id} className="cart-item" style={{ '--delay': `${i * 0.06}s` }}>
                    {/* Cover */}
                    <div className="cart-item__cover">
                      {book.coverImage
                        ? <img src={book.coverImage} alt={book.title} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                        : <span className="cart-item__cover-icon">📖</span>
                      }
                    </div>

                    {/* Info */}
                    <div className="cart-item__info">
                      <h3 className="cart-item__title">{book.title}</h3>
                      <p className="cart-item__author">by {book.author}</p>
                      <div className="cart-item__meta">
                        <span className="cart-item__cat">{book.category}</span>
                        <span className={`cart-item__avail ${book.availableCopies > 0 ? 'avail--yes' : 'avail--no'}`}>
                          {book.availableCopies > 0 ? `${book.availableCopies} Available` : 'Unavailable'}
                        </span>
                      </div>
                      {/* Price per book */}
                      {book.price > 0 && (
                        <div style={{fontSize:13, color:'var(--gold)', fontWeight:600, marginTop:6}}>
                          ₹{book.price} × {book.quantity || 1} = ₹{(book.price * (book.quantity || 1))}
                        </div>
                      )}
                    </div>

                    {/* Quantity Controls */}
                    <div className="cart-item__qty">
                      <button
                        className="cart-qty-btn"
                        onClick={() => updateQuantity(book._id, (book.quantity || 1) - 1)}
                        title="Decrease"
                      >−</button>
                      <input 
                        type="number" 
                        style={{ width:40, textAlign:'center', background:'transparent', border:'none', color:'var(--text-primary)', outline:'none', fontWeight:600, appearance: 'none', MozAppearance: 'textfield' }}
                        value={book.quantity || 1} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val)) {
                            if (val > (book.availableCopies || 1)) updateQuantity(book._id, book.availableCopies || 1);
                            else if (val < 1) updateQuantity(book._id, 1);
                            else updateQuantity(book._id, val);
                          }
                        }} 
                      />
                      {/* Fix #22: Cap at local availableCopies */}
                      <button
                        className="cart-qty-btn"
                        onClick={() => updateQuantity(book._id, (book.quantity || 1) + 1)}
                        disabled={(book.quantity || 1) >= (book.availableCopies || 1)}
                        title="Increase"
                      >+</button>
                    </div>

                    {/* Remove */}
                    <button className="cart-item__remove" onClick={() => handleRemove(book)} title="Remove">✕</button>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="cart-summary">
                <div className="cart-summary__box">
                  <h3 className="cart-summary__title">Order Summary</h3>

                  {items.map(b => (
                    <div key={b._id} className="cart-summary__row" style={{fontSize:13}}>
                      <span style={{color:'var(--text-primary)'}}>{b.title} ×{b.quantity||1}</span>
                      <span>₹{(b.price||0)*(b.quantity||1)}</span>
                    </div>
                  ))}

                  <div className="cart-summary__divider" />

                  <div className="cart-summary__row">
                    <span>Total Items</span>
                    <span>{items.reduce((s,i) => s+(i.quantity||1), 0)}</span>
                  </div>
                  <div className="cart-summary__row cart-summary__total">
                    <span>Total Amount</span>
                    <span style={{color:'var(--gold)', fontSize:18, fontWeight:700}}>₹{totalPrice}</span>
                  </div>

                  <div className="cart-summary__divider" />

                  <div className="cart-summary__note">
                    <span>📍</span>
                    <span>Visit Luxe Library with your Member ID to collect your books.</span>
                  </div>

                  <button className="cart-summary__btn" onClick={handleCheckout}>
                    {user ? '💳 Proceed to Checkout →' : '🔐 Login to Proceed'}
                  </button>

                  <Link to="/collection" className="cart-summary__continue">← Continue Browsing</Link>
                </div>

                {user && (
                  <div className="cart-member-card">
                    <div className="cart-member-card__avatar">{user.name.charAt(0)}</div>
                    <div>
                      <div className="cart-member-card__name">{user.name}</div>
                      {user.membershipId && (
                        <div className="cart-member-card__id">ID: {user.membershipId}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}