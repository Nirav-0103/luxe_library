import React, { useEffect, useState, useCallback } from 'react';
import { getRefundsAPI, initiateRefundAPI, getAdminOrdersAPI } from '../../api';
import toast from 'react-hot-toast';
import './AdminPanel.css';

const STATUS_COLORS = {
  paid:           { bg: 'rgba(90,206,160,0.12)', color: '#5acea0' },
  pending:        { bg: 'rgba(201,168,76,0.12)',  color: '#c9a84c' },
  refunded:       { bg: 'rgba(90,156,224,0.12)',  color: '#5a9ce0' },
  refund_pending: { bg: 'rgba(201,168,76,0.12)',  color: '#c9a84c' },
  failed:         { bg: 'rgba(224,90,90,0.12)',   color: '#e05a5a' },
  processed:      { bg: 'rgba(90,206,160,0.12)',  color: '#5acea0' },
};

function Badge({ label }) {
  const s = STATUS_COLORS[label] || { bg: 'rgba(255,255,255,0.05)', color: '#aaa' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px',
      borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: s.bg, color: s.color, textTransform: 'capitalize',
    }}>
      {label?.replace('_', ' ')}
    </span>
  );
}

// ── Refund Modal ─────────────────────────────────────────────────────────────
function RefundModal({ order, onClose, onDone }) {
  const [amount, setAmount]   = useState(order.totalAmount || 0);
  const [note, setNote]       = useState('');
  const [loading, setLoading] = useState(false);

  const handleRefund = async () => {
    if (!amount || amount <= 0) return toast.error('Enter a valid refund amount');
    if (amount > order.totalAmount) return toast.error(`Max refund is ₹${order.totalAmount}`);
    setLoading(true);
    try {
      await initiateRefundAPI({ orderId: order._id, amount: Number(amount), note });
      toast.success(`Refund of ₹${amount} initiated!`);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ap-modal-overlay" onClick={onClose}>
      <div className="ap-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <h2 className="ap-modal-title">💳 Initiate Refund</h2>

        {/* Order summary */}
        <div style={{ background: 'var(--dark2)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>{order.orderNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</span>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{order.user?.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid Amount</span>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>₹{order.totalAmount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Razorpay ID</span>
            <span style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'monospace' }}>
              {order.razorpayPaymentId || <em style={{ color: 'var(--red)' }}>Not available</em>}
            </span>
          </div>
        </div>

        {!order.razorpayPaymentId ? (
          <div style={{ background: 'rgba(224,90,90,0.1)', border: '1px solid rgba(224,90,90,0.3)', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13, color: '#e05a5a' }}>
            ⚠️ This order has no Razorpay payment ID. It may have been paid via COD or is a legacy order. Automatic refund is not possible — process manually.
          </div>
        ) : (
          <div className="ap-form">
            <div className="ap-form-group">
              <label className="ap-form-label">Refund Amount (₹) *</label>
              <input
                type="number" className="ap-form-input"
                value={amount} max={order.totalAmount} min={1}
                onChange={e => setAmount(e.target.value)}
                placeholder={`Max ₹${order.totalAmount}`}
              />
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Leave as full amount for complete refund</span>
            </div>
            <div className="ap-form-group">
              <label className="ap-form-label">Reason / Note</label>
              <input
                className="ap-form-input" value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Customer requested cancellation"
              />
            </div>
          </div>
        )}

        <div className="ap-form-actions" style={{ marginTop: 20 }}>
          <button className="ap-btn ap-btn--ghost" onClick={onClose}>Cancel</button>
          {order.razorpayPaymentId && (
            <button
              className="ap-btn ap-btn--gold"
              onClick={handleRefund}
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? '⏳ Processing...' : `↩️ Refund ₹${amount}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Refunds Page ─────────────────────────────────────────────────────────
export default function RefundsPage() {
  const [tab, setTab]             = useState('eligible');  // 'eligible' | 'history'
  const [eligible, setEligible]   = useState([]);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);   // order for refund modal

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [eligRes, histRes] = await Promise.all([
        // Eligible: paid online orders not yet refunded
        getAdminOrdersAPI({ paymentStatus: 'paid' }),
        // History: already refunded orders
        getRefundsAPI(),
      ]);
      const allPaid = (eligRes.data.data || []).filter(o =>
        o.paymentStatus === 'paid' && o.paymentMethod === 'razorpay' && o.refundStatus !== 'processed'
      );
      setEligible(allPaid);
      setHistory(histRes.data.data || []);
    } catch {
      toast.error('Failed to load refund data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows  = tab === 'eligible' ? eligible : history;
  const filtered = rows.filter(o =>
    !search ||
    o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-enter">
      <div className="ap-header">
        <h1 className="ap-title">💳 Refund Management</h1>
        <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={load}>⟳ Refresh</button>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { icon: '⏳', label: 'Eligible', value: eligible.length, color: '#c9a84c' },
          { icon: '✅', label: 'Refunded', value: history.filter(o => o.refundStatus === 'processed').length, color: '#5acea0' },
          { icon: '❌', label: 'Failed',   value: history.filter(o => o.refundStatus === 'failed').length,   color: '#e05a5a' },
          {
            icon: '₹',
            label: 'Total Refunded',
            value: `₹${history.filter(o => o.refundStatus === 'processed').reduce((s, o) => s + (o.refundAmount || 0), 0).toLocaleString('en-IN')}`,
            color: '#5a9ce0',
          },
        ].map((c, i) => (
          <div key={i} style={{
            background: 'var(--dark)', border: '1px solid var(--border2)',
            borderTop: `2px solid ${c.color}`, borderRadius: 14, padding: '18px 16px',
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            <span style={{ fontSize: 22 }}>{c.icon}</span>
            <span style={{ fontSize: 28, fontWeight: 300, color: c.color, fontFamily: 'Cormorant Garamond, serif' }}>{c.value}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[
          { id: 'eligible', label: `⏳ Eligible (${eligible.length})` },
          { id: 'history',  label: `📋 Refund History (${history.length})` },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500,
              background: tab === t.id ? 'var(--gold)' : 'var(--dark2)',
              color:      tab === t.id ? '#000' : 'var(--text2)',
              transition: 'all 0.2s',
            }}
          >{t.label}</button>
        ))}
      </div>

      <div className="ap-table-box">
        <div className="ap-table-top">
          <input
            className="ap-search"
            placeholder="🔍 Search by order no. or customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="ap-count">{filtered.length} records</span>
        </div>

        {loading ? (
          <div className="ap-loading">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="ap-empty">
            <div className="ap-empty-icon">{tab === 'eligible' ? '✅' : '📋'}</div>
            <p>{tab === 'eligible' ? 'No orders eligible for refund' : 'No refund history yet'}</p>
          </div>
        ) : (
          <table className="ap-table">
            <thead>
              <tr>
                <th>ORDER NO.</th>
                <th>CUSTOMER</th>
                <th>AMOUNT</th>
                {tab === 'history' && <th>REFUND AMT</th>}
                <th>PAYMENT STATUS</th>
                {tab === 'history' && <th>REFUND STATUS</th>}
                <th>RAZORPAY ID</th>
                <th>DATE</th>
                {tab === 'eligible' && <th>ACTION</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o._id}>
                  <td><strong style={{ color: 'var(--gold)', fontFamily: 'monospace', fontSize: 12 }}>{o.orderNumber}</strong></td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{o.user?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{o.user?.email}</div>
                  </td>
                  <td><strong>₹{o.totalAmount?.toLocaleString('en-IN')}</strong></td>
                  {tab === 'history' && (
                    <td>
                      {o.refundAmount ? (
                        <strong style={{ color: '#5a9ce0' }}>₹{o.refundAmount?.toLocaleString('en-IN')}</strong>
                      ) : '—'}
                    </td>
                  )}
                  <td><Badge label={o.paymentStatus} /></td>
                  {tab === 'history' && (
                    <td>
                      <Badge label={o.refundStatus} />
                      {o.refundNote && (
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{o.refundNote}</div>
                      )}
                    </td>
                  )}
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: o.razorpayPaymentId ? 'var(--text2)' : 'var(--text3)' }}>
                      {o.razorpayPaymentId
                        ? o.razorpayPaymentId.slice(0, 18) + '...'
                        : <em>Not available</em>}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {new Date(tab === 'history' ? (o.refundedAt || o.updatedAt) : o.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  {tab === 'eligible' && (
                    <td>
                      <button
                        className="ap-btn ap-btn--gold ap-btn--sm"
                        onClick={() => setSelected(o)}
                        title={!o.razorpayPaymentId ? 'No Razorpay payment ID — manual refund needed' : 'Initiate refund'}
                      >
                        ↩️ Refund
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Refund modal */}
      {selected && (
        <RefundModal
          order={selected}
          onClose={() => setSelected(null)}
          onDone={() => { setSelected(null); load(); }}
        />
      )}
    </div>
  );
}
