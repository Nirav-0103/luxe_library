import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getUsersAPI, createUserAPI, updateUserAPI, deleteUserAPI, toggleUserAPI, resetUserPasswordAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['admin', 'librarian', 'member'];
const defaultForm = { name: '', email: '', password: '', role: 'member', phone: '' };

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [resetModal, setResetModal] = useState(null);
  const [newPass, setNewPass] = useState('');

  useEffect(() => { load(); }, [search, roleFilter]);

  const load = async () => {
    try { setLoading(true); const r = await getUsersAPI({ search, role: roleFilter }); setUsers(r.data.data); }
    catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditing(null); setForm(defaultForm); setShowModal(true); };
  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '' });
    setShowModal(true);
  };
  const close = () => { setShowModal(false); setEditing(null); setForm(defaultForm); };
  const hc = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing) { await updateUserAPI(editing._id, form); toast.success('User updated!'); }
      else { await createUserAPI(form); toast.success('User created!'); }
      close(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (u) => {
    if (u._id === currentUser?.id) { toast.error('Cannot delete your own account'); return; }
    // Removed window.confirm
    try { await deleteUserAPI(u._id); toast.success('User deleted!'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot delete'); }
  };

  const handleToggle = async (u) => {
    if (u._id === currentUser?.id) { toast.error('Cannot deactivate your own account'); return; }
    try {
      await toggleUserAPI(u._id);
      toast.success(`User ${u.isActive ? 'deactivated' : 'activated'}!`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleResetPassword = async () => {
    if (!newPass || newPass.length < 6) { toast.error('Min 6 characters'); return; }
    try {
      await resetUserPasswordAPI(resetModal._id, { newPassword: newPass });
      toast.success('Password reset successfully!');
      setResetModal(null); setNewPass('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const roleBadge = (r) => r === 'admin' ? 'ap-badge--red' : r === 'librarian' ? 'ap-badge--gold' : 'ap-badge--blue';
  const roleIcon = (r) => r === 'admin' ? '🛡️' : r === 'librarian' ? '📚' : '👤';

  return (
    <div className="page-enter">
      <div className="ap-header">
        <h1 className="ap-title">👥 User Management</h1>
        <button className="ap-btn ap-btn--gold" onClick={openAdd}>+ Add User</button>
      </div>

      {/* Stats row */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        {[
          { label:'Total', value: users.length, color:'var(--gold)' },
          { label:'Admins', value: users.filter(u=>u.role==='admin').length, color:'#e05a5a' },
          { label:'Librarians', value: users.filter(u=>u.role==='librarian').length, color:'var(--gold)' },
          { label:'Members', value: users.filter(u=>u.role==='member').length, color:'#5a9ce0' },
          { label:'Active', value: users.filter(u=>u.isActive).length, color:'#5acea0' },
          { label:'Inactive', value: users.filter(u=>!u.isActive).length, color:'#e05a5a' },
        ].map((s,i) => (
          <div key={i} style={{ background:'var(--bg-card)', border:'1px solid var(--border-color2)', borderRadius:8, padding:'10px 16px', minWidth:80 }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:600, color:s.color, fontFamily:'Cormorant Garamond,serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="ap-table-box">
        <div className="ap-table-top">
          <input className="ap-search" placeholder="Search name, email, member ID..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="ap-search" style={{ width: 150 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{roleIcon(r)} {r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
          <span className="ap-count">{users.length} users</span>
        </div>

        {loading ? <div className="ap-loading"><div className="spinner" /></div>
          : users.length === 0 ? <div className="ap-empty"><div className="ap-empty-icon">👥</div><p>No users found</p></div>
          : (
            <table className="ap-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Member ID</th><th>Phone</th><th>Luxe Points</th><th>Status</th><th>Last Login</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} style={{ opacity: u.isActive ? 1 : 0.6 }}>
                    <td>
                      <strong>{u.name}</strong>
                      {u._id === currentUser?.id && <span style={{ fontSize:10, color:'var(--gold)', marginLeft:6, background:'rgba(201,168,76,0.1)', padding:'1px 6px', borderRadius:10 }}>You</span>}
                    </td>
                    <td style={{ fontSize:13 }}>{u.email}</td>
                    <td>
                      <span className={`ap-badge ${roleBadge(u.role)}`}>{roleIcon(u.role)} {u.role}</span>
                    </td>
                    <td style={{ fontFamily:'monospace', fontSize:12, color:'var(--gold)' }}>{u.membershipId || '—'}</td>
                    <td style={{ fontSize:12, color:'var(--text-secondary)' }}>{u.phone || '—'}</td>
                    <td style={{ fontSize:13, color:'#5acea0', fontWeight:600 }}>{u.luxePoints || 0}</td>
                    <td>
                      <span className={`ap-badge ${u.isActive ? 'ap-badge--green' : 'ap-badge--red'}`}>
                        {u.isActive ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize:11, color:'var(--text-muted)' }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : 'Never'}
                    </td>
                    <td>
                      <div className="ap-actions">
                        <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => openEdit(u)} title="Edit">✏️</button>
                        <button className="ap-btn ap-btn--ghost ap-btn--sm" onClick={() => { setResetModal(u); setNewPass(''); }} title="Reset Password">🔑</button>
                        <button
                          className={`ap-btn ap-btn--sm ${u.isActive ? 'ap-btn--danger' : 'ap-btn--success'}`}
                          onClick={() => handleToggle(u)}
                          disabled={u._id === currentUser?.id}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                        >{u.isActive ? '🚫' : '✅'}</button>
                        <button
                          className="ap-btn ap-btn--danger ap-btn--sm"
                          onClick={() => handleDelete(u)}
                          disabled={u._id === currentUser?.id}
                          title="Delete"
                        >🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="ap-modal-overlay" onClick={close}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <div className="ap-modal-title">{editing ? `Edit — ${editing.name}` : '+ Add New User'}</div>
            <form onSubmit={handleSubmit} className="ap-form">
              <div className="ap-form-grid">
                <div className="ap-form-group ap-form-full">
                  <label className="ap-form-label">Full Name *</label>
                  <input className="ap-form-input" name="name" value={form.name} onChange={hc} required placeholder="Full name" />
                </div>
                <div className="ap-form-group">
                  <label className="ap-form-label">Email *</label>
                  <input className="ap-form-input" type="email" name="email" value={form.email} onChange={hc} required placeholder="email@example.com" />
                </div>
                <div className="ap-form-group">
                  <label className="ap-form-label">Phone</label>
                  <input className="ap-form-input" name="phone" value={form.phone} onChange={hc} placeholder="+91 98765 43210" />
                </div>
                <div className="ap-form-group">
                  <label className="ap-form-label">Role</label>
                  <select className="ap-form-input" name="role" value={form.role} onChange={hc}>
                    {ROLES.map(r => <option key={r} value={r}>{roleIcon(r)} {r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
                <div className="ap-form-group">
                  <label className="ap-form-label">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <input className="ap-form-input" type="password" name="password" value={form.password} onChange={hc}
                    placeholder={editing ? 'Leave blank to keep current' : 'Min 6 characters'} required={!editing} minLength={editing ? 0 : 6} />
                </div>
              </div>
              {form.role === 'admin' && (
                <div style={{ padding:'10px 14px', background:'rgba(224,90,90,0.08)', border:'1px solid rgba(224,90,90,0.2)', borderRadius:8, fontSize:12, color:'var(--red)', marginBottom:12 }}>
                  ⚠️ This user will have full admin access to the system.
                </div>
              )}
              <div className="ap-form-actions">
                <button type="button" className="ap-btn ap-btn--ghost" onClick={close}>Cancel</button>
                <button type="submit" className="ap-btn ap-btn--gold" disabled={saving}>{saving ? 'Saving...' : editing ? 'Update User' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModal && (
        <div className="ap-modal-overlay" onClick={() => setResetModal(null)}>
          <div className="ap-modal" style={{ maxWidth:400 }} onClick={e => e.stopPropagation()}>
            <div className="ap-modal-title">🔑 Reset Password — {resetModal.name}</div>
            <div style={{ padding:'0 0 16px' }}>
              <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:16 }}>
                Set a new password for <strong>{resetModal.email}</strong>
              </p>
              <label className="ap-form-label">New Password *</label>
              <input className="ap-form-input" type="password" value={newPass}
                onChange={e => setNewPass(e.target.value)} placeholder="Min 6 characters" minLength={6} autoFocus/>
            </div>
            <div className="ap-form-actions">
              <button className="ap-btn ap-btn--ghost" onClick={() => setResetModal(null)}>Cancel</button>
              <button className="ap-btn ap-btn--gold" onClick={handleResetPassword}>Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
