import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createOrderAPI, getSavedAddressesAPI, saveAddressAPI, createRazorpayOrderAPI, verifyRazorpayPaymentAPI } from '../../api';
import './CheckoutPage.css';

export default function CheckoutPage() {
  const { items, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [payMethod, setPayMethod] = useState('razorpay');
  const [processing, setProcessing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  
  // Phase 2: Luxe Points
  const [pointsToUse, setPointsToUse] = useState(0);

  const [address, setAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: 'Surat',
    state: 'Gujarat',
    pincode: '',
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [saveAddr, setSaveAddr] = useState(false);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrErrors, setAddrErrors] = useState({});

  // Load saved addresses on mount
  React.useEffect(() => {
    if (user) {
      getSavedAddressesAPI()
        .then(res => {
          const addrs = res.data.data || [];
          setSavedAddresses(addrs);
          const def = addrs.find(a => a.isDefault);
          if (def) {
            setAddress({ fullName: def.fullName, phone: def.phone, street: def.street, city: def.city, state: def.state, pincode: def.pincode });
          }
        })
        .catch(() => setSavedAddresses([]));
    }

    // Load Razorpay SDK
    if (!document.getElementById('razorpay-sdk')) {
      const script = document.createElement('script');
      script.id = 'razorpay-sdk';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [user]);

  // Fix #23: Clean, readable price calculations
  const subTotal = totalPrice || 0;
  let grandTotal = subTotal;
  
  // Points calculation
  const availablePoints = user?.luxePoints || 0;
  // Make sure they can't use more points than they have, or more than the grand total
  const pointsDiscount = Math.min(Number(pointsToUse) || 0, availablePoints, grandTotal);
  grandTotal -= pointsDiscount;

  const validateAddress = () => {
    const e = {};
    if (!address.fullName.trim()) e.fullName = 'Name is required';
    if (!address.phone || !/^[+]?[\d\s\-()]{8,15}$/.test(address.phone)) e.phone = 'Enter valid phone';
    if (!address.street.trim()) e.street = 'Street address is required';
    if (!address.pincode || !/^\d{6}$/.test(address.pincode)) e.pincode = 'Enter valid 6-digit PIN code';
    setAddrErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddressNext = (e) => {
    e.preventDefault();
    if (!validateAddress()) { toast.error('Please fix the errors'); return; }
    setStep(2);
    window.scrollTo(0, 0);
  };

  // Helper: save address if checked
  const trySaveAddress = async () => {
    if (saveAddr) {
      try {
        await saveAddressAPI({ ...address, label: addrLabel, isDefault: savedAddresses.length === 0 });
      } catch (e) {
        console.log('Address save skipped:', e.message);
      }
    }
  };

  // ── COD flow ──────────────────────────────────────────────────────────────
  const handleCOD = async () => {
    setProcessing(true);
    try {
      const orderItems = items.map(b => ({
        book: b._id, title: b.title, author: b.author,
        coverImage: b.coverImage || '', price: Number(b.price) || 0, quantity: b.quantity || 1,
      }));
      const res = await createOrderAPI({
        items: orderItems,
        totalAmount: grandTotal,
        paymentMethod: 'cod',
        deliveryAddress: address,
        pointsToUse: pointsDiscount
      });
      await trySaveAddress();
      clearCart();
      setPlacedOrder(res.data.data);
      setStep(3);
      window.scrollTo(0, 0);
      toast.success('Order placed successfully! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed. Try again.');
    } finally {
      setProcessing(false);
    }
  };

  // ── Razorpay flow ─────────────────────────────────────────────────────────
  // Fix #2: Order is created ONLY after successful payment verification
  // No more orphan orders or inventory deductions before payment succeeds
  const handleRazorpay = async () => {
    if (!window.Razorpay) {
      toast.error('Payment gateway not loaded. Please refresh the page.');
      return;
    }
    setProcessing(true);
    try {
      // Step 1: Create Razorpay order on server (get rzp order id & amount)
      const rzpRes = await createRazorpayOrderAPI({ amount: grandTotal, currency: 'INR' });
      const rzpOrder = rzpRes.data.order;

      // Step 2: Open Razorpay popup
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: 'Luxe Library',
        description: 'Book Payment',
        order_id: rzpOrder.id,
        handler: async function (response) {
          // Step 3: Payment succeeded → NOW create DB order + verify
          try {
            const orderItems = items.map(i => ({
              book: i._id, title: i.title, author: i.author,
              coverImage: i.coverImage, price: i.price, quantity: i.quantity || 1,
            }));
            // Create order with 'pending' — verify endpoint will mark it 'paid'
            const orderRes = await createOrderAPI({
              items: orderItems,
              totalAmount: grandTotal,
              paymentMethod: 'razorpay',
              deliveryAddress: address,
              pointsToUse: pointsDiscount
            });
            const createdOrderId = orderRes.data.data?._id;

            // Verify payment signature + stamp payment IDs
            const verifyRes = await verifyRazorpayPaymentAPI({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              orderId: createdOrderId,
            });

            if (verifyRes.data.success) {
              await trySaveAddress();
              clearCart();
              setPlacedOrder(orderRes.data.data);
              setStep(3);
              window.scrollTo(0, 0);
              toast.success('Payment successful! Order placed 🎉');
            } else {
              toast.error('Payment verification failed. Contact support. Payment ID: ' + response.razorpay_payment_id);
              setProcessing(false);
            }
          } catch (err) {
            toast.error('Verification error. Your payment was received — contact support. Payment ID: ' + response.razorpay_payment_id);
            setProcessing(false);
          }
        },
        prefill: { name: address.fullName, contact: address.phone, email: user?.email },
        theme: { color: '#c9a84c' },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled.', { icon: '⚠️' });
            setProcessing(false);
          }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response) {
        toast.error('Payment failed: ' + (response.error?.description || 'Unknown error'));
        setProcessing(false);
      });
      rzp1.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initiate payment. Try again.');
      setProcessing(false);
    }
  };

  const handlePayment = (e) => {
    e.preventDefault();
    if (payMethod === 'cod') {
      handleCOD();
    } else {
      handleRazorpay();
    }
  };

  if (items.length === 0 && step !== 3) {
    return (
      <div className="checkout-page">
        <Header />
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ fontSize: 64 }}>🛒</div>
          <h2 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 32, fontWeight: 300, color: 'var(--text-primary)' }}>Cart is Empty</h2>
          <Link to="/collection" className="chk-btn-primary">Browse Collection</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <Header />

      <section className="chk-hero">
        <div className="chk-hero__bg" />
        <div className="container chk-hero__inner">
          <p className="chk-tag"><span className="chk-tag-line" />Checkout</p>
          <h1 className="chk-title">
            {step === 1 ? 'Delivery Details' : step === 2 ? 'Payment' : 'Order Confirmed! 🎉'}
          </h1>
        </div>
      </section>

      {step < 3 && (
        <div className="chk-progress">
          <div className="container">
            <div className="chk-steps">
              {['Cart', 'Address', 'Payment', 'Done'].map((s, i) => (
                <div key={i} className={`chk-step ${i + 1 <= step + 1 ? 'active' : ''} ${i + 1 < step ? 'done' : ''}`}>
                  <div className="chk-step__dot">{i + 1 < step ? '✓' : i + 1}</div>
                  <span className="chk-step__label">{s}</span>
                  {i < 3 && <div className="chk-step__line" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <section className="chk-body">
        <div className="container">

          {/* STEP 1 — ADDRESS */}
          {step === 1 && (
            <div className="chk-grid">
              <div className="chk-main">
                <div className="chk-card">
                  <h2 className="chk-card__title">📍 Delivery Address</h2>

                  {savedAddresses.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 10 }}>Saved Addresses</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {savedAddresses.map((addr, i) => (
                          <div key={i}
                            onClick={() => setAddress({ fullName: addr.fullName, phone: addr.phone, street: addr.street, city: addr.city, state: addr.state, pincode: addr.pincode })}
                            style={{
                              padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                              background: address.street === addr.street ? 'rgba(201,168,76,0.1)' : 'var(--bg-card2)',
                              border: address.street === addr.street ? '1px solid rgba(201,168,76,0.4)' : '1px solid var(--border-color2)',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{addr.label} {addr.isDefault ? '⭐' : ''}</span>
                              {address.street === addr.street && <span style={{ fontSize: 11, color: 'var(--gold)' }}>✓ Selected</span>}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-primary)', marginTop: 2 }}>{addr.fullName} • {addr.phone}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{addr.street}, {addr.city} — {addr.pincode}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>↓ Or fill new address below</div>
                    </div>
                  )}

                  <form onSubmit={handleAddressNext} className="chk-form">
                    <div className="chk-form-row">
                      <div className="chk-form-group">
                        <label>Full Name *</label>
                        <input value={address.fullName} onChange={e => setAddress(p => ({ ...p, fullName: e.target.value }))} required placeholder="Your full name" />
                        {addrErrors.fullName && <span style={{ fontSize: 11, color: 'var(--red)' }}>{addrErrors.fullName}</span>}
                      </div>
                      <div className="chk-form-group">
                        <label>Phone *</label>
                        <input value={address.phone} onChange={e => setAddress(p => ({ ...p, phone: e.target.value }))} required placeholder="+91 98765 43210" />
                        {addrErrors.phone && <span style={{ fontSize: 11, color: 'var(--red)' }}>{addrErrors.phone}</span>}
                      </div>
                    </div>
                    <div className="chk-form-group">
                      <label>Street Address *</label>
                      <input value={address.street} onChange={e => setAddress(p => ({ ...p, street: e.target.value }))} required placeholder="House no., Street, Area" />
                      {addrErrors.street && <span style={{ fontSize: 11, color: 'var(--red)' }}>{addrErrors.street}</span>}
                    </div>
                    <div className="chk-form-row">
                      <div className="chk-form-group">
                        <label>City *</label>
                        <input value={address.city} onChange={e => setAddress(p => ({ ...p, city: e.target.value }))} required />
                      </div>
                      <div className="chk-form-group">
                        <label>State *</label>
                        <input value={address.state} onChange={e => setAddress(p => ({ ...p, state: e.target.value }))} required />
                      </div>
                      <div className="chk-form-group">
                        <label>PIN Code *</label>
                        <input value={address.pincode} onChange={e => setAddress(p => ({ ...p, pincode: e.target.value.replace(/\D/, '').slice(0, 6) }))} required placeholder="395010" maxLength={6} />
                        {addrErrors.pincode && <span style={{ fontSize: 11, color: 'var(--red)' }}>{addrErrors.pincode}</span>}
                      </div>
                    </div>
                    {/* Save address option */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--bg-card2)', borderRadius: 8 }}>
                      <input type="checkbox" id="saveAddr" checked={saveAddr} onChange={e => setSaveAddr(e.target.checked)} style={{ accentColor: 'var(--gold)', width: 16, height: 16 }} />
                      <label htmlFor="saveAddr" style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer', flex: 1 }}>
                        💾 Save this address for future orders
                      </label>
                      {saveAddr && (
                        <input value={addrLabel} onChange={e => setAddrLabel(e.target.value)} placeholder="Label (Home/Work)" style={{ padding: '6px 10px', background: 'var(--bg-card)', border: '1px solid var(--border-color2)', borderRadius: 6, fontSize: 12, color: 'var(--text-primary)', width: 140, outline: 'none', fontFamily: 'Jost,sans-serif' }} />
                      )}
                    </div>
                    <button type="submit" className="chk-btn-primary">Continue to Payment →</button>
                  </form>
                </div>
              </div>
              <OrderSummary items={items} subTotal={subTotal} grandTotal={grandTotal} 
                availablePoints={availablePoints} pointsToUse={pointsDiscount} setPointsToUse={setPointsToUse} />
            </div>
          )}

          {/* STEP 2 — PAYMENT */}
          {step === 2 && (
            <div className="chk-grid">
              <div className="chk-main">
                <div className="chk-card">
                  <h2 className="chk-card__title">💳 Choose Payment Method</h2>

                  <div className="pay-tabs">
                    {[
                      { id: 'razorpay', icon: '⚡', label: 'Pay Online', sub: 'Card / UPI / Netbanking' },
                      { id: 'cod', icon: '🏛️', label: 'Pay at Library', sub: 'Cash on Delivery / Visit' },
                    ].map(m => (
                      <button key={m.id} className={`pay-tab ${payMethod === m.id ? 'active' : ''}`} onClick={() => setPayMethod(m.id)} type="button">
                        <span className="pay-tab__icon">{m.icon}</span>
                        <div style={{ textAlign: 'left' }}>
                          <div className="pay-tab__label">{m.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{m.sub}</div>
                        </div>
                        {payMethod === m.id && <span className="pay-tab__check" style={{ marginLeft: 'auto' }}>✓</span>}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handlePayment} className="chk-form" style={{ marginTop: 24 }}>

                    {payMethod === 'razorpay' && (
                      <div style={{ textAlign: 'center', padding: '32px 20px' }}>
                        <div style={{ fontSize: 56, marginBottom: 16 }}>⚡</div>
                        <h3 style={{ fontFamily: 'Cormorant Garamond,serif', fontSize: 22, fontWeight: 300, color: 'var(--text-primary)', marginBottom: 8 }}>Secure Online Payment</h3>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.7 }}>
                          Pay securely using Credit/Debit Card, UPI (GPay, PhonePe, Paytm), Net Banking, or Wallets via Razorpay.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
                          {['💳 Card', '📱 UPI', '🏦 Net Banking', '👛 Wallets'].map(m => (
                            <span key={m} style={{ padding: '6px 14px', background: 'var(--bg-card2)', borderRadius: 20, fontSize: 12, color: 'var(--text-secondary)', border: '1px solid var(--border-color2)' }}>{m}</span>
                          ))}
                        </div>
                        <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                          🔒 Secured by Razorpay — PCI DSS compliant
                        </div>
                      </div>
                    )}

                    {payMethod === 'cod' && (
                      <div className="cash-info">
                        <div className="cash-info__icon">🏛️</div>
                        <h3>Pay at Library</h3>
                        <p>Visit Luxe Library and pay <strong style={{ color: 'var(--gold)' }}>₹{grandTotal}</strong> at the front desk when collecting your books.</p>
                        <div className="cash-info__details">
                          <div><span>📍</span> Kapodara, Surat — 395010</div>
                          <div><span>📞</span> +91 96246 07410</div>
                          <div><span>🕐</span> Mon–Sat: 9AM – 8PM</div>
                        </div>
                      </div>
                    )}

                    <div className="chk-secure">🔒 100% Secure — SSL Encrypted</div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                      <button type="button" className="chk-btn-ghost" onClick={() => setStep(1)}>← Back</button>
                      <button type="submit" className="chk-btn-primary" disabled={processing} style={{ flex: 1 }}>
                        {processing
                          ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}><span className="chk-spinner" />Processing...</span>
                          : payMethod === 'razorpay' ? `⚡ Pay ₹${grandTotal} Online →` : `✅ Confirm Order →`}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              <OrderSummary items={items} subTotal={subTotal} grandTotal={grandTotal} showAddress address={address} 
                availablePoints={availablePoints} pointsToUse={pointsDiscount} setPointsToUse={setPointsToUse} />
            </div>
          )}

          {/* STEP 3 — SUCCESS */}
          {step === 3 && placedOrder && (
            <div className="chk-success">
              <div className="chk-success__circle">
                <span className="chk-success__check">✓</span>
              </div>
              <h2 className="chk-success__title">Order Placed!</h2>
              <p className="chk-success__subtitle">Your order has been placed. Admin will confirm it shortly. Visit library to collect your books.</p>
              <div className="chk-success__card">
                <div className="chk-success__row"><span>Order No.</span><strong style={{ color: 'var(--gold)' }}>{placedOrder.orderNumber}</strong></div>
                <div className="chk-success__row"><span>Member</span><strong>{address.fullName}</strong></div>
                <div className="chk-success__row"><span>Amount</span><strong>₹{placedOrder?.totalAmount ?? grandTotal}</strong></div>
                <div className="chk-success__row"><span>Payment</span><strong style={{ textTransform: 'capitalize' }}>{payMethod}</strong></div>
                <div className="chk-success__row"><span>Status</span><strong style={{ color: 'var(--gold)' }}>⏳ Placed — Awaiting Confirmation</strong></div>
              </div>
              <div className="chk-success__actions">
                <Link to="/dashboard" className="chk-btn-primary">View My Orders</Link>
                <Link to="/collection" className="chk-btn-ghost">Browse More</Link>
              </div>
              <div className="chk-success__visit">
                <span>📍</span>
                <span>Atmanand Saraswati Science College, Kapodara, Surat — 395010 | 📞 +91 96246 07410</span>
              </div>
            </div>
          )}

        </div>
      </section>
      <Footer />
    </div>
  );
}

// Fix #23: Clean, readable OrderSummary with explicit variables
function OrderSummary({ items, subTotal, grandTotal, showAddress, address, availablePoints, pointsToUse, setPointsToUse }) {
  return (
    <div className="chk-summary">
      <div className="chk-summary__box">
        <h3 className="chk-summary__title">Order Summary</h3>
        <div className="chk-summary__books">
          {items.map(b => (
            <div key={b._id} className="chk-summary__book">
              <div className="chk-summary__book-cover">
                {b.coverImage ? <img src={b.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span>📖</span>}
              </div>
              <div className="chk-summary__book-info">
                <div className="chk-summary__book-title">{b.title}</div>
                <div className="chk-summary__book-author">by {b.author}</div>
                <div style={{ fontSize: 12, color: 'var(--gold)', fontWeight: 600 }}>₹{b.price || 0} × {b.quantity || 1}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="chk-summary__divider" />
        <div className="chk-summary__row"><span>Books</span><span>{items.length}</span></div>
        <div className="chk-summary__row"><span>Subtotal</span><span>₹{subTotal}</span></div>

        {availablePoints > 0 && (
          <>
            <div className="chk-summary__divider" />
            <div style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>
              <label style={{ display: 'block', fontSize: 13, marginBottom: 8 }}>
                You have <strong style={{color:'var(--gold)'}}>{availablePoints}</strong> Luxe Points.
              </label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input 
                  type="number" 
                  min="0" 
                  max={Math.min(availablePoints, subTotal)} 
                  value={pointsToUse === 0 ? '' : pointsToUse} 
                  onChange={e => setPointsToUse(e.target.value === '' ? 0 : Number(e.target.value))} 
                  placeholder="Redeem points"
                  style={{ flex: 1, padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color2)', borderRadius: 6, color: 'var(--text-primary)', outline: 'none' }}
                />
                <button 
                  type="button"
                  onClick={() => setPointsToUse(Math.min(availablePoints, subTotal))}
                  style={{ padding: '8px 12px', background: 'var(--bg-card2)', border: '1px solid var(--border-color2)', borderRadius: 6, color: 'var(--gold)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  MAX
                </button>
              </div>
              {pointsToUse > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 12 }}>
                  <span>Points Discount</span>
                  <span style={{ color: 'var(--gold)', fontWeight: 600 }}>-₹{pointsToUse}</span>
                </div>
              )}
            </div>
          </>
        )}

        <div className="chk-summary__row chk-summary__total" style={{ borderTop: '2px solid var(--border-color2)', paddingTop: 16, marginTop: 8 }}>
          <span>Total</span><span>₹{grandTotal}</span>
        </div>

        {showAddress && address?.street && (
          <>
            <div className="chk-summary__divider" />
            <div className="chk-summary__address">
              <div className="chk-summary__addr-title">📍 Deliver To</div>
              <div className="chk-summary__addr-text">{address.fullName}<br />{address.street}<br />{address.city}, {address.state} — {address.pincode}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}