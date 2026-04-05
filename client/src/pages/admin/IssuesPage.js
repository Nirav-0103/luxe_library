import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getIssuesAPI, createIssueAPI, returnBookAPI, deleteIssueAPI, getBooksAPI, getMembersAPI } from '../../api';

export default function IssuesPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [form, setForm] = useState({ bookId: '', memberId: '', dueDate: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [statusFilter]);

  const load = async () => {
    try {
      setLoading(true);
      const r = await getIssuesAPI({ status: statusFilter });
      setIssues(r.data.data);
    } catch { toast.error('Failed to load issues'); }
    finally { setLoading(false); }
  };

  const openModal = async () => {
    try {
      const [br, mr] = await Promise.all([getBooksAPI({}), getMembersAPI({})]);
      setBooks(br.data.data.filter(b => b.availableCopies > 0));
      setMembers(mr.data.data.filter(m => m.isActive));
      const due = new Date();
      due.setDate(due.getDate() + 14);
      setForm({ bookId: '', memberId: '', dueDate: due.toISOString().split('T')[0] });
      setShowModal(true);
    } catch { toast.error('Failed to load data'); }
  };

  const close = () => { setShowModal(false); };
  const hc = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await createIssueAPI(form);
      toast.success('Book issued successfully!');
      close(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error issuing book'); }
    finally { setSaving(false); }
  };

  const handleReturn = async (issue) => {
    // Removed window.confirm
    try {
      const res = await returnBookAPI(issue._id);
      const fine = res.data.data.fine;
      toast.success(fine > 0 ? `Returned! Fine: ₹${fine}` : 'Book returned!');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (issue) => {
    // Removed window.confirm
    try { await deleteIssueAPI(issue._id); toast.success('Deleted!'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Cannot delete'); }
  };

  const statusBadge = (issue) => {
    if (issue.status === 'returned') return <span className="ap-badge ap-badge--green">Returned</span>;
    if (issue.status === 'overdue') return <span className="ap-badge ap-badge--red">Overdue</span>;
    return <span className="ap-badge ap-badge--blue">Issued</span>;
  };

  return (
    <div className="page-enter">
      <div className="ap-header">
        <h1 className="ap-title">🔄 Book Issues</h1>
        <button className="ap-btn ap-btn--gold" onClick={openModal}>+ Issue Book</button>
      </div>

      <div className="ap-table-box">
        <div className="ap-table-top">
          <select className="ap-search" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="issued">Issued</option>
            <option value="overdue">Overdue</option>
            <option value="returned">Returned</option>
          </select>
          <span className="ap-count">{issues.length} records</span>
        </div>

        {loading ? <div className="ap-loading"><div className="spinner" /></div>
          : issues.length === 0 ? <div className="ap-empty"><div className="ap-empty-icon">🔄</div><p>No records found</p></div>
          : (
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Member</th>
                  <th>Issued</th>
                  <th>Due Date</th>
                  <th>Returned</th>
                  <th>Fine</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.map(issue => {
                  const over = issue.status !== 'returned' && new Date(issue.dueDate) < new Date();
                  return (
                    <tr key={issue._id}>
                      <td>
                        <strong>{issue.book?.title}</strong>
                        <br />
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{issue.book?.isbn}</span>
                      </td>
                      <td>
                        <div>{issue.member?.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--gold)' }}>{issue.member?.membershipId}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{new Date(issue.issueDate).toLocaleDateString('en-IN')}</td>
                      <td style={{ fontSize: 12, color: over ? 'var(--red)' : 'var(--text2)' }}>
                        {new Date(issue.dueDate).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                        {issue.returnDate ? new Date(issue.returnDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>
                        {issue.fine > 0
                          ? <span style={{ color: 'var(--red)', fontWeight: 600 }}>₹{issue.fine}</span>
                          : '—'}
                      </td>
                      <td>{statusBadge(issue)}</td>
                      <td>
                        <div className="ap-actions">
                          {issue.status !== 'returned' && (
                            <button className="ap-btn ap-btn--success ap-btn--sm" onClick={() => handleReturn(issue)}>↩️ Return</button>
                          )}
                          {issue.status === 'returned' && (
                            <button className="ap-btn ap-btn--danger ap-btn--sm" onClick={() => handleDelete(issue)}>🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>

      {showModal && (
        <div className="ap-modal-overlay" onClick={close}>
          <div className="ap-modal" onClick={e => e.stopPropagation()}>
            <div className="ap-modal-title">Issue a Book</div>
            <form onSubmit={handleSubmit} className="ap-form">
              <div className="ap-form-group">
                <label className="ap-form-label">Select Book *</label>
                <select className="ap-form-input" name="bookId" value={form.bookId} onChange={hc} required>
                  <option value="">— Choose a book —</option>
                  {books.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.title} by {b.author} (Available: {b.availableCopies})
                    </option>
                  ))}
                </select>
              </div>
              <div className="ap-form-group">
                <label className="ap-form-label">Select Member *</label>
                <select className="ap-form-input" name="memberId" value={form.memberId} onChange={hc} required>
                  <option value="">— Choose a member —</option>
                  {members.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.membershipId})
                    </option>
                  ))}
                </select>
              </div>
              <div className="ap-form-group">
                <label className="ap-form-label">Due Date *</label>
                <input
                  className="ap-form-input"
                  type="date"
                  name="dueDate"
                  value={form.dueDate}
                  onChange={hc}
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div style={{ padding: '12px 14px', background: 'var(--dark2)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text3)' }}>
                ⚠️ Fine of ₹5/day will be charged for late returns
              </div>
              <div className="ap-form-actions">
                <button type="button" className="ap-btn ap-btn--ghost" onClick={close}>Cancel</button>
                <button type="submit" className="ap-btn ap-btn--gold" disabled={saving}>
                  {saving ? 'Issuing...' : 'Issue Book'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
