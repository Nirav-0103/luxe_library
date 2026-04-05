import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getMembersAPI, createMemberAPI, updateMemberAPI, deleteMemberAPI } from '../../api';

const defaultForm = { name:'', email:'', phone:'', address:'' };

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [search]);

  const load = async () => {
    try { setLoading(true); const r = await getMembersAPI({ search }); setMembers(r.data.data); }
    catch { toast.error('Failed to load members'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditing(null); setForm(defaultForm); setShowModal(true); };
  const openEdit = (m) => { setEditing(m); setForm({ name:m.name, email:m.email, phone:m.phone||'', address:m.address||'' }); setShowModal(true); };
  const close = () => { setShowModal(false); setEditing(null); setForm(defaultForm); };
  const hc = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing) { await updateMemberAPI(editing._id, form); toast.success('Member updated!'); }
      else { await createMemberAPI(form); toast.success('Member registered!'); }
      close(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (m) => {
    // Removed window.confirm
    try { await deleteMemberAPI(m._id); toast.success('Member deleted!'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot delete'); }
  };

  const handleToggle = async (m) => {
    try { await updateMemberAPI(m._id, { isActive: !m.isActive }); toast.success('Status updated!'); load(); }
    catch { toast.error('Failed'); }
  };

  return (
    <div className="page-enter">
      <div className="ap-header">
        <h1 className="ap-title">🪪 Members</h1>
        <button className="ap-btn ap-btn--gold" onClick={openAdd}>+ Add Member</button>
      </div>

      <div className="ap-table-box">
        <div className="ap-table-top">
          <input className="ap-search" placeholder="Search name, email, ID..." value={search} onChange={e => setSearch(e.target.value)} />
          <span className="ap-count">{members.length} members</span>
        </div>

        {loading ? <div className="ap-loading"><div className="spinner" /></div>
          : members.length === 0 ? <div className="ap-empty"><div className="ap-empty-icon">🪪</div><p>No members found</p></div>
          : (
            <table className="ap-table">
              <thead><tr><th>Member ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {members.map(m => (
                  <tr key={m._id}>
                    <td style={{ fontFamily:'monospace', color:'var(--gold)', fontWeight:600 }}>{m.membershipId}</td>
                    <td><strong>{m.name}</strong></td>
                    <td>{m.email}</td>
                    <td>{m.phone || '—'}</td>
                    <td><span className={`ap-badge ${m.isActive ? 'ap-badge--green' : 'ap-badge--red'}`}>{m.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td style={{ fontSize:12, color:'var(--text3)' }}>{new Date(m.createdAt).toLocaleDateString('en-IN')}</td>
                    <td>
                      <div className="ap-actions">
                        <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => openEdit(m)}>✏️</button>
                        <button className={`ap-btn ap-btn--sm ${m.isActive ? 'ap-btn--danger' : 'ap-btn--success'}`} onClick={() => handleToggle(m)}>{m.isActive ? '🚫' : '✅'}</button>
                        <button className="ap-btn ap-btn--danger ap-btn--sm" onClick={() => handleDelete(m)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {showModal && (
        <div className="ap-modal-overlay" onClick={close}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <div className="ap-modal-title">{editing ? 'Edit Member' : 'Register Member'}</div>
            <form onSubmit={handleSubmit} className="ap-form">
              <div className="ap-form-grid">
                <div className="ap-form-group ap-form-full">
                  <label className="ap-form-label">Full Name *</label>
                  <input className="ap-form-input" name="name" value={form.name} onChange={hc} required placeholder="Member's full name" />
                </div>
                <div className="ap-form-group">
                  <label className="ap-form-label">Email *</label>
                  <input className="ap-form-input" type="email" name="email" value={form.email} onChange={hc} required placeholder="email@example.com" />
                </div>
                <div className="ap-form-group">
                  <label className="ap-form-label">Phone</label>
                  <input className="ap-form-input" name="phone" value={form.phone} onChange={hc} placeholder="+91 98765 43210" />
                </div>
                <div className="ap-form-group ap-form-full">
                  <label className="ap-form-label">Address</label>
                  <textarea className="ap-form-input" name="address" value={form.address} onChange={hc} rows="2" placeholder="Address" style={{ resize:'vertical' }} />
                </div>
              </div>
              <div className="ap-form-actions">
                <button type="button" className="ap-btn ap-btn--ghost" onClick={close}>Cancel</button>
                <button type="submit" className="ap-btn ap-btn--gold" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Register'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
