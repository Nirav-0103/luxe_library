import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../context/AuthContext';
import BookModal from '../collection/BookModal';
import { getBooksAPI, updateProfileAPI, changePasswordAPI, getMyOrdersAPI, cancelOrderRequestAPI, refundRequestAPI, createComplaintAPI, getMyComplaintsAPI } from '../../api';
import './UserDashboard.css';

const ORDER_STATUS_COLOR = {
  placed:'#5a9ce0', confirmed:'#c9a84c', processing:'#c9a84c',
  ready:'#5acea0', completed:'#5acea0', cancel_requested:'#e05a5a', cancelled:'#e05a5a'
};
const ORDER_STATUS_ICON = {
  placed:'📋', confirmed:'✅', processing:'⚙️',
  ready:'📦', completed:'🎉', cancel_requested:'⚠️', cancelled:'❌'
};

const COMPLAINT_STATUS_COLOR = {
  open:'#5a9ce0', in_progress:'#c9a84c', resolved:'#5acea0', closed:'#888'
};

export default function UserDashboard() {
  const { user, updateUser, wishlist } = useAuth();
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('catalog');
  const [selectedBook, setSelectedBook] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: user?.name||'', phone: user?.phone||'' });
  const [passForm, setPassForm] = useState({ oldPassword:'', newPassword:'' });
  const [saving, setSaving] = useState(false);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [refundModal, setRefundModal] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [complaintModal, setComplaintModal] = useState(null);
  const [complaintForm, setComplaintForm] = useState({ subject: '', description: '', priority: 'medium' });

  useEffect(() => { if (activeTab==='catalog') loadBooks(); }, [search, activeTab]);
  useEffect(() => { if (activeTab==='orders' || activeTab==='refunds') loadOrders(); }, [activeTab]);
  useEffect(() => { if (activeTab==='complaints') loadComplaints(); }, [activeTab]);

  const loadBooks = async () => {
    try { const res = await getBooksAPI({ search }); setBooks(res.data.data); }
    catch { toast.error('Failed to load books'); }
  };

  const loadOrders = async () => {
    try { 
      const res = await getMyOrdersAPI(); 
      setOrders(res.data.data || []); 
    }
    catch (err) { 
      console.log('Orders:', err.message);
      setOrders([]);
    }
  };

  const loadComplaints = async () => {
    try {
      const res = await getMyComplaintsAPI();
      setComplaints(res.data.data || []);
    } catch (err) {
      console.log('Complaints:', err.message);
      setComplaints([]);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await updateProfileAPI(profileForm);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setSaving(false); }
  };

  const handlePassChange = async (e) => {
    e.preventDefault();
    if (passForm.newPassword.length < 6) return toast.error('Min 6 characters');
    try {
      setSaving(true);
      await changePasswordAPI(passForm);
      toast.success('Password changed!');
      setPassForm({ oldPassword:'', newPassword:'' });
    } catch (err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setSaving(false); }
  };

  const handleCancelRequest = async () => {
    if (!cancelReason.trim()) return toast.error('Please provide a reason');
    try {
      await cancelOrderRequestAPI(cancelModal._id, cancelReason);
      toast.success('Cancel request sent!');
      setCancelModal(null); setCancelReason('');
      loadOrders();
    } catch (err) { toast.error(err.response?.data?.message||'Failed'); }
  };

  const handleRefundRequest = async () => {
    if (!refundReason.trim()) return toast.error('Please provide a reason for refund');
    try {
      await refundRequestAPI(refundModal._id, refundReason);
      toast.success('Refund request submitted!');
      setRefundModal(null); setRefundReason('');
      loadOrders();
    } catch (err) { toast.error(err.response?.data?.message||'Failed'); }
  };

  const handleComplaintSubmit = async () => {
    if (!complaintForm.subject.trim() || !complaintForm.description.trim()) {
      return toast.error('Please fill in subject and description');
    }
    try {
      await createComplaintAPI({
        orderId: complaintModal._id,
        subject: complaintForm.subject,
        description: complaintForm.description,
        priority: complaintForm.priority,
      });
      toast.success('Complaint submitted!');
      setComplaintModal(null);
      setComplaintForm({ subject: '', description: '', priority: 'medium' });
      loadComplaints();
    } catch (err) { toast.error(err.response?.data?.message||'Failed'); }
  };

  // Fix #21: Only show orders that are actually refund-eligible:
  // - Active orders (placed/confirmed/processing) can request a refund
  // - Cancelled orders are eligible ONLY if paid via Razorpay (COD cancelled orders have nothing to refund)
  // - Already requested orders shown for status tracking
  const refundEligibleOrders = orders.filter(o =>
    ['placed', 'confirmed', 'processing'].includes(o.orderStatus) ||
    (o.orderStatus === 'cancelled' && o.paymentMethod === 'razorpay' && o.paymentStatus === 'paid') ||
    o.refundRequestedByUser
  );

  const TABS = [
    { key:'catalog', label:'Book Catalog', icon:'📚' },
    { key:'orders',  label:'My Orders',    icon:'🛒' },
    { key:'refunds', label:'Refunds',      icon:'💰' },
    { key:'complaints', label:'Complaints', icon:'📝' },
    { key:'wishlist', label:'Wishlist',    icon:'❤️' },
    { key:'profile', label:'My Profile',   icon:'👤' },
    { key:'security',label:'Security',     icon:'🔒' },
  ];

  return (
    <div className="udash">
      <Header />
      <div className="udash__hero">
        <div className="udash__hero-bg" />
        <div className="container udash__hero-inner">
          <div className="udash__welcome">
            <div className="udash__avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
            <div>
              <p className="udash__greeting">Welcome back,</p>
              <h1 className="udash__name">{user?.name}</h1>
              <span className="udash__membership">
                {user?.membershipId && <>Member ID: <strong>{user.membershipId}</strong></>}
                <span style={{marginLeft: 10, color: '#5acea0', fontWeight: 600, background: 'rgba(90,206,160,0.1)', padding: '2px 8px', borderRadius: 4}}>💫 {user?.luxePoints || 0} Luxe Points</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container udash__body">
        <div className="udash__tabs">
          {TABS.map(t => (
            <button key={t.key} className={`udash__tab ${activeTab===t.key?'active':''}`} onClick={()=>setActiveTab(t.key)}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* CATALOG */}
        {activeTab === 'catalog' && (
          <div className="udash__section page-enter">
            <div className="udash__section-header">
              <h2 className="udash__section-title">Our Collection</h2>
              <input className="udash__search" placeholder="Search books..." value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div className="udash__books-grid">
              {books.length === 0
                ? <div className="udash__empty"><p>📚 No books found</p></div>
                : books.map(book => (
                  <div key={book._id} className="udash__book-card" onClick={() => setSelectedBook(book)}>
                    <div className="udash__book-cover">
                      {book.coverImage
                        ? <img
                            src={book.coverImage}
                            alt={book.title}
                            style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}}
                            onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML = '<span style="font-size:40px">📖</span>'; }}
                          />
                        : <span className="udash__book-emoji">📖</span>
                      }
                      <div className="udash__book-overlay">View Details →</div>
                    </div>
                    <div className="udash__book-info">
                      <h3 className="udash__book-title">{book.title}</h3>
                      <p className="udash__book-author">by {book.author}</p>
                      <div className="udash__book-meta">
                        <span className="udash__badge udash__badge--blue">{book.category}</span>
                        <span className={`udash__badge ${book.availableCopies>0?'udash__badge--green':'udash__badge--red'}`}>
                          {book.availableCopies>0?`${book.availableCopies} Avail`:'Unavail'}
                        </span>
                      </div>
                      {book.price > 0 && (
                        <p style={{fontSize:13,color:'var(--gold)',fontWeight:600,marginTop:4}}>₹{book.price}</p>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* MY ORDERS */}
        {activeTab === 'orders' && (
          <div className="udash__section page-enter">
            <div className="udash__section-header">
              <h2 className="udash__section-title">My Orders</h2>
              <Link to="/collection" className="udash__btn" style={{textDecoration:'none',padding:'8px 20px',fontSize:12}}>+ New Order</Link>
            </div>
            {orders.length === 0 ? (
              <div className="udash__empty">
                <p>🛒 No orders yet</p>
                <Link to="/collection" style={{color:'var(--gold)',fontSize:14,marginTop:12,display:'block'}}>Browse Collection →</Link>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:16}}>
                {orders.map(order => (
                  <div key={order._id} style={{background:'var(--bg-card)',border:'1px solid var(--border-color2)',borderRadius:12,padding:24}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:16}}>
                      <div>
                        <div style={{fontSize:12,fontFamily:'monospace',color:'var(--gold)',fontWeight:600,marginBottom:4}}>{order.orderNumber}</div>
                        <div style={{fontSize:12,color:'var(--text-muted)'}}>{new Date(order.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</div>
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{
                          padding:'4px 14px',borderRadius:20,fontSize:12,fontWeight:600,
                          background:`${ORDER_STATUS_COLOR[order.orderStatus]}20`,
                          color:ORDER_STATUS_COLOR[order.orderStatus],
                          border:`1px solid ${ORDER_STATUS_COLOR[order.orderStatus]}40`
                        }}>
                          {ORDER_STATUS_ICON[order.orderStatus]} {order.orderStatus.replace('_',' ')}
                        </span>
                        <span style={{
                          padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:500,
                          background: order.paymentStatus==='paid' ? 'rgba(90,206,160,0.12)' : order.paymentStatus==='refunded' ? 'rgba(90,156,224,0.12)' : 'rgba(224,90,90,0.12)',
                          color: order.paymentStatus==='paid' ? '#5acea0' : order.paymentStatus==='refunded' ? '#5a9ce0' : '#e05a5a',
                        }}>
                          💳 {order.paymentStatus}
                        </span>
                        <strong style={{color:'var(--gold)',fontSize:16}}>₹{order.totalAmount}</strong>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:16}}>
                      {order.items.map((item,i) => (
                        <div key={i} style={{display:'flex',alignItems:'center',gap:8,background:'var(--bg-card2)',borderRadius:8,padding:'8px 12px'}}>
                          <div style={{width:28,height:36,borderRadius:3,overflow:'hidden',background:'linear-gradient(135deg,#1a1a3a,#2a2a6a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,flexShrink:0}}>
                            {item.coverImage?<img src={item.coverImage} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:'📖'}
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:500,color:'var(--text-primary)'}}>{item.title}</div>
                            <div style={{fontSize:11,color:'var(--text-muted)'}}>₹{item.price} × {item.quantity||1}</div>
                          </div>
                          {(order.paymentStatus === 'paid' || ['confirmed','processing','ready','completed'].includes(order.orderStatus)) && (
                            <Link to={`/read/${item.book?._id || item.book}`} target="_blank" style={{marginLeft:'auto',padding:'6px 12px',background:'rgba(201,168,76,0.1)',border:'1px solid rgba(201,168,76,0.3)',color:'var(--gold)',fontSize:11,fontWeight:600,borderRadius:6,textDecoration:'none',whiteSpace:'nowrap',transition:'all 0.2s'}}>
                              📖 Read Digital Copy
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                    <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
                      <span style={{fontSize:12,color:'var(--text-muted)'}}>Payment: <strong style={{color:'var(--text-secondary)',textTransform:'capitalize'}}>{order.paymentMethod}</strong></span>
                      <button onClick={()=>window.open('/invoice/'+order._id, '_blank')} style={{padding:'6px 14px',background:'var(--bg-card2)',border:'1px solid var(--border-color2)',color:'var(--text-primary)',fontSize:12,fontWeight:500,borderRadius:6,cursor:'pointer',marginLeft:8}}>
                        📄 View Invoice
                      </button>
                      
                      {/* Refund request button for eligible orders */}
                      {['placed','confirmed','processing'].includes(order.orderStatus) && !order.refundRequestedByUser && (
                        <button onClick={()=>{setRefundModal(order);setRefundReason('');}} style={{padding:'6px 14px',background:'rgba(90,156,224,0.1)',border:'1px solid rgba(90,156,224,0.25)',color:'#5a9ce0',fontSize:12,fontWeight:500,borderRadius:6,cursor:'pointer'}}>
                          💰 Request Refund
                        </button>
                      )}
                      {order.refundRequestedByUser && (
                        <span style={{fontSize:12,color:'#c9a84c',background:'rgba(201,168,76,0.1)',padding:'4px 12px',borderRadius:6}}>
                          ⏳ Refund requested
                        </span>
                      )}

                      {/* Complaint button */}
                      <button onClick={()=>{setComplaintModal(order);setComplaintForm({subject:'',description:'',priority:'medium'});}} style={{padding:'6px 14px',background:'rgba(201,168,76,0.08)',border:'1px solid rgba(201,168,76,0.2)',color:'var(--gold)',fontSize:12,fontWeight:500,borderRadius:6,cursor:'pointer'}}>
                        📝 Complaint
                      </button>

                      {['placed','confirmed'].includes(order.orderStatus) && (
                        <button onClick={()=>{setCancelModal(order);setCancelReason('');}} style={{marginLeft:'auto',padding:'6px 14px',background:'rgba(224,90,90,0.1)',border:'1px solid rgba(224,90,90,0.25)',color:'var(--red)',fontSize:12,fontWeight:500,borderRadius:6,cursor:'pointer'}}>
                          Request Cancel
                        </button>
                      )}
                      {order.orderStatus==='cancel_requested' && (
                        <span style={{marginLeft:'auto',fontSize:12,color:'var(--red)'}}>⏳ Cancel pending admin review</span>
                      )}
                    </div>
                    {order.adminNote && (
                      <div style={{marginTop:12,padding:'10px 14px',background:'rgba(201,168,76,0.08)',borderRadius:8,fontSize:12,color:'var(--text-secondary)'}}>💬 Admin: {order.adminNote}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REFUNDS TAB */}
        {activeTab === 'refunds' && (
          <div className="udash__section page-enter">
            <div className="udash__section-header">
              <h2 className="udash__section-title">My Refunds</h2>
            </div>

            {/* Summary cards */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:14,marginBottom:28}}>
              {[
                { icon:'💰', label:'Total Requests', value:orders.filter(o=>o.refundRequestedByUser).length, color:'#5a9ce0' },
                { icon:'⏳', label:'Pending', value:orders.filter(o=>o.refundRequestedByUser && o.refundStatus==='pending').length, color:'#c9a84c' },
                { icon:'✅', label:'Processed', value:orders.filter(o=>o.refundStatus==='processed').length, color:'#5acea0' },
                { icon:'❌', label:'Failed/Rejected', value:orders.filter(o=>o.refundStatus==='failed').length, color:'#e05a5a' },
              ].map((c,i) => (
                <div key={i} style={{
                  background:'var(--bg-card)',border:'1px solid var(--border-color2)',
                  borderTop:`2px solid ${c.color}`,borderRadius:14,padding:'18px 16px',
                  display:'flex',flexDirection:'column',gap:6,
                }}>
                  <span style={{fontSize:22}}>{c.icon}</span>
                  <span style={{fontSize:28,fontWeight:300,color:c.color,fontFamily:'Cormorant Garamond,serif'}}>{c.value}</span>
                  <span style={{fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{c.label}</span>
                </div>
              ))}
            </div>

            {/* Refund eligible orders */}
            {refundEligibleOrders.length === 0 ? (
              <div className="udash__empty">
                <p>💰 No refund-eligible orders</p>
                <p style={{fontSize:13,color:'var(--text-muted)',marginTop:8}}>Orders in placed, confirmed, or processing stage can request a refund</p>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {refundEligibleOrders.map(order => (
                  <div key={order._id} style={{
                    background:'var(--bg-card)',border:'1px solid var(--border-color2)',
                    borderRadius:12,padding:20,display:'flex',justifyContent:'space-between',
                    alignItems:'center',flexWrap:'wrap',gap:16,
                  }}>
                    <div>
                      <div style={{fontFamily:'monospace',fontSize:12,color:'var(--gold)',fontWeight:600,marginBottom:4}}>{order.orderNumber}</div>
                      <div style={{fontSize:13,color:'var(--text-primary)',fontWeight:500}}>₹{order.totalAmount}</div>
                      <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>
                        {order.items.length} book{order.items.length>1?'s':''} • {order.paymentMethod} • {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <span style={{
                        padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:600,
                        background:`${ORDER_STATUS_COLOR[order.orderStatus]}20`,
                        color:ORDER_STATUS_COLOR[order.orderStatus],
                      }}>
                        {ORDER_STATUS_ICON[order.orderStatus]} {order.orderStatus.replace('_',' ')}
                      </span>
                      {order.refundRequestedByUser ? (
                        <span style={{
                          padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:600,
                          background: order.refundStatus==='processed' ? 'rgba(90,206,160,0.12)' : order.refundStatus==='failed' ? 'rgba(224,90,90,0.12)' : 'rgba(201,168,76,0.12)',
                          color: order.refundStatus==='processed' ? '#5acea0' : order.refundStatus==='failed' ? '#e05a5a' : '#c9a84c',
                        }}>
                          {order.refundStatus==='processed' ? '✅ Refunded' : order.refundStatus==='failed' ? '❌ Failed' : '⏳ Pending'}
                        </span>
                      ) : (
                        <button
                          onClick={()=>{setRefundModal(order);setRefundReason('');}}
                          style={{
                            padding:'6px 16px',background:'rgba(90,156,224,0.1)',
                            border:'1px solid rgba(90,156,224,0.25)',color:'#5a9ce0',
                            fontSize:12,fontWeight:600,borderRadius:6,cursor:'pointer',
                          }}
                        >
                          💰 Request Refund
                        </button>
                      )}
                    </div>
                    {order.refundRequestReason && (
                      <div style={{width:'100%',fontSize:12,color:'var(--text-muted)',padding:'8px 12px',background:'var(--bg-card2)',borderRadius:6}}>
                        📝 Reason: {order.refundRequestReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COMPLAINTS TAB */}
        {activeTab === 'complaints' && (
          <div className="udash__section page-enter">
            <div className="udash__section-header">
              <h2 className="udash__section-title">My Complaints</h2>
            </div>

            {/* Summary */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:14,marginBottom:28}}>
              {[
                { icon:'📝', label:'Total', value:complaints.length, color:'#5a9ce0' },
                { icon:'🔵', label:'Open', value:complaints.filter(c=>c.status==='open').length, color:'#5a9ce0' },
                { icon:'🟡', label:'In Progress', value:complaints.filter(c=>c.status==='in_progress').length, color:'#c9a84c' },
                { icon:'✅', label:'Resolved', value:complaints.filter(c=>c.status==='resolved').length, color:'#5acea0' },
              ].map((c,i) => (
                <div key={i} style={{
                  background:'var(--bg-card)',border:'1px solid var(--border-color2)',
                  borderTop:`2px solid ${c.color}`,borderRadius:14,padding:'16px 14px',
                  display:'flex',flexDirection:'column',gap:6,
                }}>
                  <span style={{fontSize:20}}>{c.icon}</span>
                  <span style={{fontSize:26,fontWeight:300,color:c.color,fontFamily:'Cormorant Garamond,serif'}}>{c.value}</span>
                  <span style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{c.label}</span>
                </div>
              ))}
            </div>

            {/* File complaint from orders */}
            {orders.length > 0 && (
              <div style={{marginBottom:24}}>
                <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:12}}>📌 Select an order to file a complaint:</p>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  {orders.map(order => (
                    <button
                      key={order._id}
                      onClick={()=>{setComplaintModal(order);setComplaintForm({subject:'',description:'',priority:'medium'});}}
                      style={{
                        padding:'8px 14px',background:'var(--bg-card)',border:'1px solid var(--border-color2)',
                        borderRadius:8,cursor:'pointer',color:'var(--text-primary)',fontSize:12,
                        display:'flex',alignItems:'center',gap:8,transition:'all 0.2s',
                      }}
                      onMouseOver={e=>e.currentTarget.style.borderColor='var(--gold)'}
                      onMouseOut={e=>e.currentTarget.style.borderColor='var(--border-color2)'}
                    >
                      <span style={{color:'var(--gold)',fontFamily:'monospace',fontWeight:600}}>{order.orderNumber}</span>
                      <span style={{color:'var(--text-muted)'}}>₹{order.totalAmount}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Complaints list */}
            {complaints.length === 0 ? (
              <div className="udash__empty">
                <p>📝 No complaints yet</p>
                <p style={{fontSize:13,color:'var(--text-muted)',marginTop:8}}>If you have any issues with your orders, file a complaint above</p>
              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                {complaints.map(c => (
                  <div key={c._id} style={{
                    background:'var(--bg-card)',border:'1px solid var(--border-color2)',
                    borderLeft:`3px solid ${COMPLAINT_STATUS_COLOR[c.status]}`,
                    borderRadius:12,padding:20,
                  }}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:12}}>
                      <div>
                        <h4 style={{fontSize:15,fontWeight:600,color:'var(--text-primary)',marginBottom:4}}>{c.subject}</h4>
                        <div style={{fontSize:12,color:'var(--text-muted)'}}>
                          Order: <span style={{color:'var(--gold)',fontFamily:'monospace'}}>{c.orderNumber}</span> • {new Date(c.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                        </div>
                      </div>
                      <div style={{display:'flex',gap:8,alignItems:'center'}}>
                        <span style={{
                          padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,
                          background:`${COMPLAINT_STATUS_COLOR[c.status]}20`,
                          color:COMPLAINT_STATUS_COLOR[c.status],
                          textTransform:'capitalize',
                        }}>
                          {c.status.replace('_',' ')}
                        </span>
                        <span style={{
                          padding:'3px 8px',borderRadius:20,fontSize:10,fontWeight:500,
                          background: c.priority==='high'?'rgba(224,90,90,0.12)':c.priority==='medium'?'rgba(201,168,76,0.12)':'rgba(90,156,224,0.12)',
                          color: c.priority==='high'?'#e05a5a':c.priority==='medium'?'#c9a84c':'#5a9ce0',
                          textTransform:'uppercase',letterSpacing:'0.05em',
                        }}>
                          {c.priority}
                        </span>
                      </div>
                    </div>
                    <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,marginBottom:c.adminResponse?12:0}}>
                      {c.description}
                    </p>
                    {c.adminResponse && (
                      <div style={{
                        marginTop:8,padding:'12px 14px',background:'rgba(201,168,76,0.06)',
                        borderRadius:8,border:'1px solid rgba(201,168,76,0.15)',
                      }}>
                        <div style={{fontSize:11,color:'var(--gold)',fontWeight:600,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>
                          💬 Admin Response
                        </div>
                        <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.5,margin:0}}>{c.adminResponse}</p>
                        {c.respondedAt && (
                          <div style={{fontSize:11,color:'var(--text-muted)',marginTop:6}}>
                            {new Date(c.respondedAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WISHLIST */}
        {activeTab === 'wishlist' && (
          <div className="udash__section page-enter">
            <div className="udash__section-header">
              <h2 className="udash__section-title">My Wishlist</h2>
            </div>
            <div className="udash__books-grid">
              {(!wishlist || wishlist.length === 0)
                ? <div className="udash__empty">
                    <p>❤️ No books in your wishlist</p>
                    <button onClick={() => setActiveTab('catalog')} style={{background:'none',border:'none',color:'var(--gold)',marginTop:14,fontSize:14,cursor:'pointer',fontWeight:500}}>Browse Catalog →</button>
                  </div>
                : wishlist.map(book => (
                  <div key={book._id} className="udash__book-card" onClick={() => setSelectedBook(book)}>
                    <div className="udash__book-cover">
                      {book.coverImage
                        ? <img
                            src={book.coverImage}
                            alt={book.title}
                            style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}}
                            onError={e => { e.target.style.display='none'; e.target.parentNode.innerHTML = '<span style="font-size:40px">📖</span>'; }}
                          />
                        : <span className="udash__book-emoji">📖</span>
                      }
                      <div className="udash__book-overlay">View Details →</div>
                    </div>
                    <div className="udash__book-info">
                      <h3 className="udash__book-title">{book.title}</h3>
                      <p className="udash__book-author">by {book.author}</p>
                      <div className="udash__book-meta">
                        <span className="udash__badge udash__badge--blue">{book.category}</span>
                        <span className={`udash__badge ${book.availableCopies>0?'udash__badge--green':'udash__badge--red'}`}>
                          {book.availableCopies>0?`${book.availableCopies} Avail`:'Unavail'}
                        </span>
                      </div>
                      {book.price > 0 && (
                        <p style={{fontSize:13,color:'var(--gold)',fontWeight:600,marginTop:4}}>₹{book.price}</p>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* PROFILE */}
        {activeTab === 'profile' && (
          <div className="udash__section page-enter">
            <h2 className="udash__section-title">My Profile</h2>
            <div className="udash__form-card">
              <form onSubmit={handleProfileSave} className="udash__form">
                <div className="udash__form-row">
                  <div className="udash__form-group">
                    <label className="udash__label">Full Name</label>
                    <input className="udash__input" value={profileForm.name} onChange={e=>setProfileForm(p=>({...p,name:e.target.value}))} required/>
                  </div>
                  <div className="udash__form-group">
                    <label className="udash__label">Phone</label>
                    <input className="udash__input" value={profileForm.phone} onChange={e=>setProfileForm(p=>({...p,phone:e.target.value}))} placeholder="+91 98765 43210"/>
                  </div>
                </div>
                <div className="udash__form-group">
                  <label className="udash__label">Email (cannot change)</label>
                  <input className="udash__input" value={user?.email} disabled style={{opacity:0.5,cursor:'not-allowed'}}/>
                </div>
                <button type="submit" className="udash__btn" disabled={saving}>{saving?'Saving...':'Save Changes'}</button>
              </form>
            </div>
          </div>
        )}

        {/* SECURITY */}
        {activeTab === 'security' && (
          <div className="udash__section page-enter">
            <h2 className="udash__section-title">Change Password</h2>
            <div className="udash__form-card" style={{maxWidth:460}}>
              <form onSubmit={handlePassChange} className="udash__form">
                <div className="udash__form-group">
                  <label className="udash__label">Current Password</label>
                  <input className="udash__input" type="password" value={passForm.oldPassword} onChange={e=>setPassForm(p=>({...p,oldPassword:e.target.value}))} required placeholder="••••••••"/>
                </div>
                <div className="udash__form-group">
                  <label className="udash__label">New Password</label>
                  <input className="udash__input" type="password" value={passForm.newPassword} onChange={e=>setPassForm(p=>({...p,newPassword:e.target.value}))} required placeholder="Min. 6 characters"/>
                </div>
                <button type="submit" className="udash__btn" disabled={saving}>{saving?'Changing...':'Change Password'}</button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Book Detail Modal */}
      {selectedBook && <BookModal book={selectedBook} onClose={() => setSelectedBook(null)} />}

      {/* Cancel Modal */}
      {cancelModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20,backdropFilter:'blur(5px)'}} onClick={()=>setCancelModal(null)}>
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border-color)',borderRadius:12,padding:32,width:'100%',maxWidth:440}} onClick={e=>e.stopPropagation()}>
            <h3 style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontWeight:300,color:'var(--text-primary)',marginBottom:8}}>Cancel Order?</h3>
            <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:20}}>Order <strong style={{color:'var(--gold)'}}>{cancelModal.orderNumber}</strong> — Admin approval required.</p>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-secondary)',display:'block',marginBottom:8}}>Reason *</label>
              <textarea value={cancelReason} onChange={e=>setCancelReason(e.target.value)} placeholder="Why cancel?" rows={3} style={{width:'100%',background:'var(--bg-card2)',border:'1px solid var(--border-color2)',color:'var(--text-primary)',padding:'10px 12px',borderRadius:6,fontSize:13,fontFamily:'Jost,sans-serif',resize:'vertical',outline:'none'}}/>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setCancelModal(null)} style={{flex:1,padding:'11px',background:'var(--bg-card2)',border:'1px solid var(--border-color2)',borderRadius:6,color:'var(--text-secondary)',cursor:'pointer',fontSize:13}}>Keep Order</button>
              <button onClick={handleCancelRequest} style={{flex:1,padding:'11px',background:'rgba(224,90,90,0.1)',border:'1px solid rgba(224,90,90,0.3)',borderRadius:6,color:'var(--red)',cursor:'pointer',fontSize:13,fontWeight:600}}>Request Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Request Modal */}
      {refundModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20,backdropFilter:'blur(5px)'}} onClick={()=>setRefundModal(null)}>
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border-color)',borderRadius:12,padding:32,width:'100%',maxWidth:440}} onClick={e=>e.stopPropagation()}>
            <h3 style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontWeight:300,color:'var(--text-primary)',marginBottom:8}}>💰 Request Refund</h3>
            <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:6}}>
              Order <strong style={{color:'var(--gold)'}}>{refundModal.orderNumber}</strong>
            </p>
            <p style={{fontSize:14,color:'var(--gold)',fontWeight:600,marginBottom:20}}>Amount: ₹{refundModal.totalAmount}</p>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-secondary)',display:'block',marginBottom:8}}>Reason *</label>
              <textarea value={refundReason} onChange={e=>setRefundReason(e.target.value)} placeholder="Why do you want a refund?" rows={3} style={{width:'100%',background:'var(--bg-card2)',border:'1px solid var(--border-color2)',color:'var(--text-primary)',padding:'10px 12px',borderRadius:6,fontSize:13,fontFamily:'Jost,sans-serif',resize:'vertical',outline:'none'}}/>
            </div>
            <div style={{padding:'10px 14px',background:'rgba(90,156,224,0.08)',borderRadius:8,fontSize:12,color:'var(--text-secondary)',marginBottom:20}}>
              ℹ️ Your refund request will be reviewed by our admin team. You'll be notified once it's processed.
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setRefundModal(null)} style={{flex:1,padding:'11px',background:'var(--bg-card2)',border:'1px solid var(--border-color2)',borderRadius:6,color:'var(--text-secondary)',cursor:'pointer',fontSize:13}}>Cancel</button>
              <button onClick={handleRefundRequest} style={{flex:1,padding:'11px',background:'rgba(90,156,224,0.15)',border:'1px solid rgba(90,156,224,0.3)',borderRadius:6,color:'#5a9ce0',cursor:'pointer',fontSize:13,fontWeight:600}}>Submit Refund Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {complaintModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20,backdropFilter:'blur(5px)'}} onClick={()=>setComplaintModal(null)}>
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border-color)',borderRadius:12,padding:32,width:'100%',maxWidth:480}} onClick={e=>e.stopPropagation()}>
            <h3 style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontWeight:300,color:'var(--text-primary)',marginBottom:8}}>📝 File a Complaint</h3>
            <p style={{fontSize:13,color:'var(--text-secondary)',marginBottom:20}}>
              Order <strong style={{color:'var(--gold)'}}>{complaintModal.orderNumber}</strong> — ₹{complaintModal.totalAmount}
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:16}}>
              <div>
                <label style={{fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-secondary)',display:'block',marginBottom:8}}>Subject *</label>
                <input value={complaintForm.subject} onChange={e=>setComplaintForm(p=>({...p,subject:e.target.value}))} placeholder="Brief subject of your complaint" style={{width:'100%',background:'var(--bg-card2)',border:'1px solid var(--border-color2)',color:'var(--text-primary)',padding:'10px 12px',borderRadius:6,fontSize:13,fontFamily:'Jost,sans-serif',outline:'none'}}/>
              </div>
              <div>
                <label style={{fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-secondary)',display:'block',marginBottom:8}}>Description *</label>
                <textarea value={complaintForm.description} onChange={e=>setComplaintForm(p=>({...p,description:e.target.value}))} placeholder="Describe your issue in detail..." rows={4} style={{width:'100%',background:'var(--bg-card2)',border:'1px solid var(--border-color2)',color:'var(--text-primary)',padding:'10px 12px',borderRadius:6,fontSize:13,fontFamily:'Jost,sans-serif',resize:'vertical',outline:'none'}}/>
              </div>
              <div>
                <label style={{fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-secondary)',display:'block',marginBottom:8}}>Priority</label>
                <div style={{display:'flex',gap:8}}>
                  {['low','medium','high'].map(p => (
                    <button key={p} onClick={()=>setComplaintForm(f=>({...f,priority:p}))}
                      style={{
                        flex:1,padding:'8px',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',textTransform:'uppercase',letterSpacing:'0.05em',
                        background:complaintForm.priority===p ? (p==='high'?'rgba(224,90,90,0.15)':p==='medium'?'rgba(201,168,76,0.15)':'rgba(90,156,224,0.15)') : 'var(--bg-card2)',
                        border:`1px solid ${complaintForm.priority===p ? (p==='high'?'rgba(224,90,90,0.3)':p==='medium'?'rgba(201,168,76,0.3)':'rgba(90,156,224,0.3)') : 'var(--border-color2)'}`,
                        color:complaintForm.priority===p ? (p==='high'?'#e05a5a':p==='medium'?'#c9a84c':'#5a9ce0') : 'var(--text-muted)',
                      }}
                    >{p}</button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:10,marginTop:24}}>
              <button onClick={()=>setComplaintModal(null)} style={{flex:1,padding:'11px',background:'var(--bg-card2)',border:'1px solid var(--border-color2)',borderRadius:6,color:'var(--text-secondary)',cursor:'pointer',fontSize:13}}>Cancel</button>
              <button onClick={handleComplaintSubmit} style={{flex:1,padding:'11px',background:'rgba(201,168,76,0.15)',border:'1px solid rgba(201,168,76,0.3)',borderRadius:6,color:'var(--gold)',cursor:'pointer',fontSize:13,fontWeight:600}}>Submit Complaint</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}