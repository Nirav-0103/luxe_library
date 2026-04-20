import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getAdminOrdersAPI, updateOrderStatusAPI, downloadOrdersCSVAPI } from '../../api';

const STATUS_COLORS = {
  placed: 'ap-badge--blue',
  confirmed: 'ap-badge--gold',
  processing: 'ap-badge--gold',
  ready: 'ap-badge--green',
  completed: 'ap-badge--green',
  cancel_requested: 'ap-badge--red',
  cancelled: 'ap-badge--red',
};

const STATUS_ICONS = {
  placed: '📋', confirmed: '✅', processing: '⚙️',
  ready: '📦', completed: '🎉', cancel_requested: '⚠️', cancelled: '❌'
};

const NEXT_ACTIONS = {
  placed: [{ label: '✅ Confirm Order', status: 'confirmed' }, { label: '❌ Cancel', status: 'cancelled' }],
  confirmed: [{ label: '⚙️ Mark Processing', status: 'processing' }, { label: '❌ Cancel', status: 'cancelled' }],
  processing: [{ label: '📦 Mark Ready', status: 'ready' }],
  ready: [{ label: '🎉 Complete', status: 'completed' }],
  cancel_requested: [{ label: '✅ Approve Cancel', status: 'cancelled' }, { label: '🔄 Reject Cancel', status: 'confirmed' }],
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updating, setUpdating] = useState(false);
  
  // Fix #26: Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => { load(); }, [statusFilter, page]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getAdminOrdersAPI({ status: statusFilter, page, limit: 10 });
      setOrders(res.data.data);
      setTotalPages(res.data.totalPages || 1);
      setTotalOrders(res.data.total || res.data.data.length);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  const handleExportCSV = async () => {
    try {
      toast.loading('Exporting CSV...', { id: 'csv-export' });
      const res = await downloadOrdersCSVAPI({ status: statusFilter });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders_${statusFilter}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('CSV Exported!', { id: 'csv-export' });
    } catch (err) {
      toast.error('Failed to export CSV', { id: 'csv-export' });
    }
  };

  const handleStatus = async (orderId, status, label) => {
    // Removed window.confirm to prevent auto-close issues in embedded browsers
    try {
      setUpdating(true);
      await updateOrderStatusAPI(orderId, { status });
      toast.success(`Order ${status}!`);
      load();
      setSelectedOrder(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setUpdating(false); }
  };

  const cancelRequests = orders.filter(o => o.orderStatus === 'cancel_requested');

  return (
    <div className="page-enter">
      <div className="ap-header">
        <h1 className="ap-title">🛒 Orders</h1>
        <span className="ap-count" style={{fontSize:13}}>{totalOrders} orders</span>
      </div>

      {/* Cancel Requests Alert */}
      {cancelRequests.length > 0 && (
        <div style={{
          background:'rgba(224,90,90,0.1)', border:'1px solid rgba(224,90,90,0.3)',
          borderRadius:'var(--radius-lg)', padding:'14px 20px', marginBottom:20,
          display:'flex', alignItems:'center', gap:12
        }}>
          <span style={{fontSize:20}}>⚠️</span>
          <div>
            <div style={{fontWeight:600, color:'var(--red)', fontSize:14}}>
              {cancelRequests.length} Cancel Request{cancelRequests.length > 1 ? 's' : ''} Pending
            </div>
            <div style={{fontSize:12, color:'var(--text-secondary)'}}>
              Review and approve/reject cancel requests from customers
            </div>
          </div>
          <button className="ap-btn ap-btn--danger ap-btn--sm" style={{marginLeft:'auto'}}
            onClick={() => { setStatusFilter('cancel_requested'); setPage(1); }}>
            View Requests
          </button>
        </div>
      )}

      <div className="ap-table-box">
        <div className="ap-table-top">
          <select className="ap-search" style={{width:200}} value={statusFilter} onChange={e=>{setStatusFilter(e.target.value); setPage(1);}}>
            <option value="all">All Orders</option>
            <option value="placed">📋 Placed</option>
            <option value="confirmed">✅ Confirmed</option>
            <option value="processing">⚙️ Processing</option>
            <option value="ready">📦 Ready</option>
            <option value="completed">🎉 Completed</option>
            <option value="cancel_requested">⚠️ Cancel Requested</option>
            <option value="cancelled">❌ Cancelled</option>
          </select>
          <span className="ap-count">{totalOrders} orders</span>
          <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={handleExportCSV} style={{marginLeft: 'auto'}}>
            📥 Export CSV
          </button>
        </div>

        {loading ? <div className="ap-loading"><div className="spinner"/></div>
        : orders.length === 0 ? <div className="ap-empty"><div className="ap-empty-icon">🛒</div><p>No orders found</p></div>
        : (
          <>
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Order No.</th><th>Customer</th><th>Books</th>
                  <th>Amount</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id} style={order.orderStatus === 'cancel_requested' ? {background:'rgba(224,90,90,0.05)'} : {}}>
                    <td>
                      <strong style={{color:'var(--gold)', fontFamily:'monospace', fontSize:12}}>
                        {order.orderNumber}
                      </strong>
                    </td>
                    <td>
                      <strong>{order.user?.name}</strong><br/>
                      <span style={{fontSize:11,color:'var(--text-muted)'}}>{order.user?.membershipId}</span>
                    </td>
                    <td>
                      <div style={{display:'flex',gap:4}}>
                        {order.items.slice(0,3).map((item,i) => (
                          <div key={i} style={{
                            width:28,height:36,borderRadius:3,overflow:'hidden',
                            background:'linear-gradient(135deg,#1a1a3a,#2a2a6a)',
                            display:'flex',alignItems:'center',justifyContent:'center',fontSize:12
                          }}>
                            {item.coverImage
                              ? <img src={item.coverImage} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                              : '📖'}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <span style={{fontSize:11,color:'var(--text-muted)',alignSelf:'center'}}>+{order.items.length-3}</span>
                        )}
                      </div>
                      <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{order.items.length} book{order.items.length>1?'s':''}</div>
                    </td>
                    <td><strong style={{color:'var(--gold)'}}>₹{order.totalAmount}</strong></td>
                    <td>
                      <span className="ap-badge ap-badge--blue" style={{textTransform:'capitalize'}}>
                        {order.paymentMethod}
                      </span><br/>
                      <span className={`ap-badge ${order.paymentStatus==='paid'?'ap-badge--green':'ap-badge--red'}`} style={{marginTop:4,fontSize:10}}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`ap-badge ${STATUS_COLORS[order.orderStatus]||'ap-badge--blue'}`}>
                        {STATUS_ICONS[order.orderStatus]} {order.orderStatus.replace('_',' ')}
                      </span>
                      {order.cancelReason && (
                        <div style={{fontSize:10,color:'var(--red)',marginTop:4}}>"{order.cancelReason}"</div>
                      )}
                    </td>
                    <td style={{fontSize:12,color:'var(--text-muted)'}}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <div className="ap-actions">
                        <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={()=>setSelectedOrder(order)}>
                          👁️ View
                        </button>
                        <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={()=>window.open('/invoice/'+order._id, '_blank')} style={{marginLeft: 4}}>
                          📄 Invoice
                        </button>
                        {NEXT_ACTIONS[order.orderStatus]?.map((action,i) => (
                          <button
                            key={i}
                            className={`ap-btn ap-btn--sm ${action.status==='cancelled'?'ap-btn--danger':'ap-btn--success'}`}
                            onClick={()=>handleStatus(order._id, action.status, action.label)}
                            disabled={updating}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:16,marginTop:24,paddingBottom:16}}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="ap-btn ap-btn--ghost ap-btn--sm"
                >
                  ← Prev
                </button>
                <div style={{fontSize:14,color:'var(--text-primary)'}}>
                  Page {page} of {totalPages}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="ap-btn ap-btn--ghost ap-btn--sm"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div style={{
          position:'fixed',inset:0,background:'rgba(0,0,0,0.8)',
          zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',
          padding:20,backdropFilter:'blur(5px)'
        }} onClick={()=>setSelectedOrder(null)}>
          <div style={{
            background:'var(--bg-card)',border:'1px solid var(--border-color)',
            borderRadius:12,padding:32,width:'100%',maxWidth:560,
            maxHeight:'85vh',overflowY:'auto',position:'relative'
          }} onClick={e=>e.stopPropagation()}>
            <button onClick={()=>setSelectedOrder(null)} style={{
              position:'absolute',top:14,right:14,width:30,height:30,
              borderRadius:'50%',background:'var(--bg-card2)',border:'1px solid var(--border-color2)',
              cursor:'pointer',color:'var(--text-secondary)',fontSize:13,
              display:'flex',alignItems:'center',justifyContent:'center'
            }}>✕</button>

            <h2 style={{fontFamily:'Cormorant Garamond,serif',fontSize:24,fontWeight:300,color:'var(--text-primary)',marginBottom:4}}>
              Order Details
            </h2>
            <div style={{fontSize:13,color:'var(--gold)',marginBottom:24,fontFamily:'monospace'}}>
              {selectedOrder.orderNumber}
            </div>

            {/* Customer */}
            <div style={{background:'var(--bg-card2)',borderRadius:8,padding:'14px 16px',marginBottom:16}}>
              <div style={{fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:8}}>Customer</div>
              <div style={{fontWeight:600,color:'var(--text-primary)'}}>{selectedOrder.user?.name}</div>
              <div style={{fontSize:12,color:'var(--text-secondary)'}}>{selectedOrder.user?.email}</div>
              <div style={{fontSize:12,color:'var(--gold)'}}>{selectedOrder.user?.membershipId}</div>
            </div>

            {/* Books */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:10}}>Books Ordered</div>
              {selectedOrder.items.map((item,i) => (
                <div key={i} style={{display:'flex',gap:12,alignItems:'center',padding:'10px 0',borderBottom:'1px solid var(--border-color2)'}}>
                  <div style={{width:36,height:48,borderRadius:4,overflow:'hidden',background:'linear-gradient(135deg,#1a1a3a,#2a2a6a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>
                    {item.coverImage ? <img src={item.coverImage} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : '📖'}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:500,color:'var(--text-primary)',fontSize:14}}>{item.title}</div>
                    <div style={{fontSize:12,color:'var(--text-secondary)'}}>by {item.author}</div>
                  </div>
                  <div style={{color:'var(--gold)',fontWeight:600}}>₹{item.price}</div>
                </div>
              ))}
            </div>

            {/* Delivery Address */}
            {selectedOrder.deliveryAddress?.street && (
              <div style={{background:'var(--bg-card2)',borderRadius:8,padding:'14px 16px',marginBottom:16}}>
                <div style={{fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:8}}>Delivery Address</div>
                <div style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.7}}>
                  {selectedOrder.deliveryAddress.fullName}<br/>
                  {selectedOrder.deliveryAddress.street}<br/>
                  {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} — {selectedOrder.deliveryAddress.pincode}<br/>
                  📞 {selectedOrder.deliveryAddress.phone}
                </div>
              </div>
            )}

            {/* Payment Details */}
            <div style={{background:'var(--bg-card2)',borderRadius:8,padding:'14px 16px',marginBottom:16}}>
              <div style={{fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--text-muted)',marginBottom:8}}>Payment Details</div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontSize:13,color:'var(--text-secondary)'}}>Method</span>
                <span style={{fontSize:13,color:'var(--text-primary)',textTransform:'capitalize',fontWeight:500}}>{selectedOrder.paymentMethod === 'qr' ? 'Direct UPI (QR)' : selectedOrder.paymentMethod}</span>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                  <span style={{fontSize:13,color:'var(--text-secondary)'}}>Status</span>
                  <span className={`ap-badge ${selectedOrder.paymentStatus==='paid'?'ap-badge--green':'ap-badge--red'}`} style={{fontSize:10}}>{selectedOrder.paymentStatus}</span>
              </div>
              {selectedOrder.upiTransactionId && (
                <div style={{display:'flex',justifyContent:'space-between',marginTop:6,paddingTop:6,borderTop:'1px solid var(--border-color)'}}>
                  <span style={{fontSize:13,color:'var(--text-secondary)'}}>UTR / Trans ID</span>
                  <span style={{fontSize:12,color:'var(--text-primary)',fontFamily:'monospace',fontWeight:600}}>{selectedOrder.upiTransactionId}</span>
                </div>
              )}
            </div>

            {/* Summary */}
            <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderTop:'1px solid var(--border-color)',marginBottom:20}}>
              <span style={{fontSize:14,color:'var(--text-secondary)'}}>Total Amount</span>
              <strong style={{fontSize:18,color:'var(--gold)'}}>₹{selectedOrder.totalAmount}</strong>
            </div>

            {/* Action Buttons */}
            {NEXT_ACTIONS[selectedOrder.orderStatus] && (
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                {NEXT_ACTIONS[selectedOrder.orderStatus].map((action,i) => (
                  <button
                    key={i}
                    className={`ap-btn ${action.status==='cancelled'?'ap-btn--danger':'ap-btn--gold'}`}
                    onClick={()=>handleStatus(selectedOrder._id, action.status, action.label)}
                    disabled={updating}
                    style={{flex:1}}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
