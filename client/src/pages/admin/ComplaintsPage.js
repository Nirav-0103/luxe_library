import React, { useEffect, useState, useCallback } from 'react';
import { getAdminComplaintsAPI, getComplaintStatsAPI, updateComplaintAPI } from '../../api';
import toast from 'react-hot-toast';
import './AdminPanel.css';

const STATUS_COLORS = {
  open: { bg: 'rgba(90,156,224,0.12)', color: '#5a9ce0' },
  in_progress: { bg: 'rgba(201,168,76,0.12)', color: '#c9a84c' },
  resolved: { bg: 'rgba(90,206,160,0.12)', color: '#5acea0' },
  closed: { bg: 'rgba(136,136,136,0.12)', color: '#888' },
};

const PRIORITY_COLORS = {
  low: { bg: 'rgba(90,156,224,0.12)', color: '#5a9ce0' },
  medium: { bg: 'rgba(201,168,76,0.12)', color: '#c9a84c' },
  high: { bg: 'rgba(224,90,90,0.12)', color: '#e05a5a' },
};

function Badge({ label, type = 'status' }) {
  const colors = type === 'priority' ? PRIORITY_COLORS : STATUS_COLORS;
  const s = colors[label] || { bg: 'rgba(255,255,255,0.05)', color: '#aaa' };
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

// ── Response Modal ──────────────────────────────────────────────────────────
function ResponseModal({ complaint, onClose, onDone }) {
  const [status, setStatus] = useState(complaint.status);
  const [response, setResponse] = useState(complaint.adminResponse || '');
  const [priority, setPriority] = useState(complaint.priority);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await updateComplaintAPI(complaint._id, { status, adminResponse: response, priority });
      toast.success('Complaint updated!');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ap-modal-overlay" onClick={onClose}>
      <div className="ap-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <h2 className="ap-modal-title">📝 Respond to Complaint</h2>

        {/* Complaint info */}
        <div style={{ background: 'var(--dark2)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold)' }}>{complaint.orderNumber}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</span>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>{complaint.user?.name}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</span>
            <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{complaint.subject}</span>
          </div>
          <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--dark)', borderRadius: 8, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
            {complaint.description}
          </div>
        </div>

        <div className="ap-form">
          <div className="ap-form-grid">
            <div className="ap-form-group">
              <label className="ap-form-label">Status</label>
              <select className="ap-form-input" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="open">🔵 Open</option>
                <option value="in_progress">🟡 In Progress</option>
                <option value="resolved">✅ Resolved</option>
                <option value="closed">⬜ Closed</option>
              </select>
            </div>
            <div className="ap-form-group">
              <label className="ap-form-label">Priority</label>
              <select className="ap-form-input" value={priority} onChange={e => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="ap-form-group">
            <label className="ap-form-label">Admin Response</label>
            <textarea
              className="ap-form-input"
              value={response}
              onChange={e => setResponse(e.target.value)}
              placeholder="Write your response to the customer..."
              rows={4}
              style={{ resize: 'vertical', fontFamily: 'Jost, sans-serif' }}
            />
          </div>
        </div>

        <div className="ap-form-actions" style={{ marginTop: 20 }}>
          <button className="ap-btn ap-btn--ghost" onClick={onClose}>Cancel</button>
          <button className="ap-btn ap-btn--gold" onClick={handleSubmit} disabled={loading}>
            {loading ? '⏳ Saving...' : '✅ Update Complaint'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Complaints Page ─────────────────────────────────────────────────────
export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [compRes, statsRes] = await Promise.all([
        getAdminComplaintsAPI({ status: statusFilter }),
        getComplaintStatsAPI(),
      ]);
      setComplaints(compRes.data.data || []);
      setStats(statsRes.data.data);
    } catch {
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const filtered = complaints.filter(c =>
    !search ||
    c.subject?.toLowerCase().includes(search.toLowerCase()) ||
    c.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
    c.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-enter">
      <div className="ap-header">
        <h1 className="ap-title">📝 Complaints</h1>
        <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={load}>⟳ Refresh</button>
      </div>

      {/* Summary strip */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { icon: '📝', label: 'Total', value: stats.total, color: '#5a9ce0' },
            { icon: '🔵', label: 'Open', value: stats.open, color: '#5a9ce0' },
            { icon: '🟡', label: 'In Progress', value: stats.inProgress, color: '#c9a84c' },
            { icon: '✅', label: 'Resolved', value: stats.resolved, color: '#5acea0' },
            { icon: '⬜', label: 'Closed', value: stats.closed, color: '#888' },
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
      )}

      {/* Open complaints alert */}
      {stats && stats.open > 0 && (
        <div style={{
          background: 'rgba(90,156,224,0.08)', border: '1px solid rgba(90,156,224,0.25)',
          borderRadius: 'var(--radius-lg)', padding: '14px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <span style={{ fontSize: 20 }}>🔔</span>
          <div>
            <div style={{ fontWeight: 600, color: '#5a9ce0', fontSize: 14 }}>
              {stats.open} Open Complaint{stats.open > 1 ? 's' : ''} Need Attention
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>
              Respond to customer complaints promptly for better satisfaction
            </div>
          </div>
          <button className="ap-btn ap-btn--sm" style={{ marginLeft: 'auto', background: 'rgba(90,156,224,0.15)', color: '#5a9ce0', border: '1px solid rgba(90,156,224,0.3)' }}
            onClick={() => setStatusFilter('open')}>
            View Open
          </button>
        </div>
      )}

      <div className="ap-table-box">
        <div className="ap-table-top">
          <input
            className="ap-search"
            placeholder="🔍 Search by subject, order, customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="ap-search" style={{ width: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Complaints</option>
            <option value="open">🔵 Open</option>
            <option value="in_progress">🟡 In Progress</option>
            <option value="resolved">✅ Resolved</option>
            <option value="closed">⬜ Closed</option>
          </select>
          <span className="ap-count">{filtered.length} complaints</span>
        </div>

        {loading ? (
          <div className="ap-loading"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="ap-empty">
            <div className="ap-empty-icon">📝</div>
            <p>No complaints found</p>
          </div>
        ) : (
          <table className="ap-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c._id} style={c.status === 'open' ? { background: 'rgba(90,156,224,0.03)' } : {}}>
                  <td>
                    <strong style={{ color: 'var(--gold)', fontFamily: 'monospace', fontSize: 12 }}>
                      {c.orderNumber}
                    </strong>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{c.user?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.user?.email}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.subject}
                    </div>
                    {c.description && (
                      <div style={{ fontSize: 11, color: 'var(--text3)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                        {c.description}
                      </div>
                    )}
                  </td>
                  <td><Badge label={c.priority} type="priority" /></td>
                  <td><Badge label={c.status} /></td>
                  <td style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {new Date(c.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td>
                    <div className="ap-actions">
                      <button className="ap-btn ap-btn--gold ap-btn--sm" onClick={() => setSelected(c)}>
                        💬 Respond
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Response modal */}
      {selected && (
        <ResponseModal
          complaint={selected}
          onClose={() => setSelected(null)}
          onDone={() => { setSelected(null); load(); }}
        />
      )}
    </div>
  );
}
