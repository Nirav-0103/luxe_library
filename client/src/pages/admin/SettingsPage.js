import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API from '../../api';

export default function SettingsPage() {
  const { user } = useAuth();
  const token = localStorage.getItem('lib_token'); // FIX 1: was 'token'

  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passwords, setPasswords] = useState({ oldPassword: '', newPassword: '', confirm: '' });
  const [siteSettings, setSiteSettings] = useState({
    libraryName: 'Luxe Library',
    libraryPhone: '+91 96246 07410',
    libraryEmail: 'niravahir448@gmail.com',
    libraryAddress: 'Kapodara, Surat, Gujarat',
    chatbotEnabled: true,
    maintenanceMode: false,
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [msg, setMsg] = useState('');

  // FIX 2: Load site settings from backend on mount
  useEffect(() => {
    API.get('/settings')
      .then(r => {
        const d = r.data.data;
        setSiteSettings({
          libraryName:     d.libraryName     || 'Luxe Library',
          libraryPhone:    d.libraryPhone    || '',
          libraryEmail:    d.libraryEmail    || '',
          libraryAddress:  d.libraryAddress  || '',
          chatbotEnabled:  d.chatbotEnabled  !== undefined ? d.chatbotEnabled  : true,
          maintenanceMode: d.maintenanceMode !== undefined ? d.maintenanceMode : false,
        });
      })
      .catch(() => {})
      .finally(() => setSettingsLoading(false));
  }, []);

  const showMsg = (text, isErr) => {
    setMsg({ text, isErr });
    setTimeout(() => setMsg(''), 3500);
  };

  const saveProfile = async () => {
    setSaving('profile');
    try {
      const res = await API.put('/auth/profile', { name: profile.name, phone: profile.phone });
      if (res.data.success) showMsg('✅ Profile updated!');
      else throw new Error(res.data.message);
    } catch (e) { showMsg('❌ ' + (e.response?.data?.message || e.message), true); }
    setSaving('');
  };

  const changePassword = async () => {
    if (passwords.newPassword !== passwords.confirm) return showMsg('❌ Passwords do not match', true);
    if (passwords.newPassword.length < 6) return showMsg('❌ Min 6 characters', true);
    setSaving('pass');
    try {
      const res = await API.put('/auth/change-password', {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });
      if (res.data.success) {
        showMsg('✅ Password changed!');
        setPasswords({ oldPassword: '', newPassword: '', confirm: '' });
      } else throw new Error(res.data.message);
    } catch (e) { showMsg('❌ ' + (e.response?.data?.message || e.message), true); }
    setSaving('');
  };

  // FIX 2: Save site settings to backend
  const saveSiteSettings = async () => {
    setSaving('site');
    try {
      const res = await API.put('/settings', {
        libraryName:     siteSettings.libraryName,
        libraryPhone:    siteSettings.libraryPhone,
        libraryEmail:    siteSettings.libraryEmail,
        libraryAddress:  siteSettings.libraryAddress,
        chatbotEnabled:  siteSettings.chatbotEnabled,
        maintenanceMode: siteSettings.maintenanceMode,
      });
      if (res.data.success) showMsg('✅ Site settings saved!');
      else throw new Error(res.data.message);
    } catch (e) { showMsg('❌ ' + (e.response?.data?.message || e.message), true); }
    setSaving('');
  };

  const s = {
    page: { padding: '32px', maxWidth: 800 },
    h1: { fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: 'var(--gold)', marginBottom: 8 },
    sub: { color: 'var(--text2)', fontSize: 13, marginBottom: 36 },
    section: { background: 'var(--dark)', border: '1px solid var(--border)', borderRadius: 8, padding: 28, marginBottom: 24 },
    sectionTitle: { fontSize: 13, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 20 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    label: { fontSize: 12, color: 'var(--text2)', marginBottom: 6, display: 'block', letterSpacing: '0.05em', textTransform: 'uppercase' },
    input: { width: '100%', padding: '10px 14px', background: 'var(--dark2)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
    btn: { padding: '10px 24px', background: 'linear-gradient(135deg, #b8960c, #c9a84c)', color: '#000', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', cursor: 'pointer', marginTop: 20 },
    toggle: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
    toggleLabel: { fontSize: 14, color: 'var(--text)' },
    badge: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 },
    msgBox: { padding: '12px 16px', borderRadius: 6, marginBottom: 20, fontSize: 13 },
  };

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Settings</h1>
      <p style={s.sub}>Manage admin profile, security, and site configuration</p>

      {msg && (
        <div style={{ ...s.msgBox, background: msg.isErr ? 'rgba(224,90,90,0.1)' : 'rgba(90,206,160,0.1)', border: `1px solid ${msg.isErr ? 'var(--red)' : 'var(--green)'}`, color: msg.isErr ? 'var(--red)' : 'var(--green)' }}>
          {msg.text}
        </div>
      )}

      {/* Profile */}
      <div style={s.section}>
        <div style={s.sectionTitle}>👤 Admin Profile</div>
        <div style={{ ...s.grid, marginBottom: 0 }}>
          <div>
            <label style={s.label}>Full Name</label>
            <input style={s.input} value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label style={s.label}>Phone</label>
            <input style={s.input} value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
          </div>
          <div>
            <label style={s.label}>Email (read-only)</label>
            <input style={{ ...s.input, opacity: 0.5 }} value={user?.email || ''} readOnly />
          </div>
          <div>
            <label style={s.label}>Role</label>
            <input style={{ ...s.input, opacity: 0.5 }} value={user?.role || ''} readOnly />
          </div>
        </div>
        <button style={s.btn} onClick={saveProfile} disabled={saving === 'profile'}>
          {saving === 'profile' ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Password */}
      <div style={s.section}>
        <div style={s.sectionTitle}>🔐 Change Password</div>
        <div style={s.grid}>
          <div>
            <label style={s.label}>Current Password</label>
            <input type="password" style={s.input} value={passwords.oldPassword} onChange={e => setPasswords(p => ({ ...p, oldPassword: e.target.value }))} />
          </div>
          <div />
          <div>
            <label style={s.label}>New Password</label>
            <input type="password" style={s.input} value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} />
          </div>
          <div>
            <label style={s.label}>Confirm New Password</label>
            <input type="password" style={s.input} value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} />
          </div>
        </div>
        <button style={s.btn} onClick={changePassword} disabled={saving === 'pass'}>
          {saving === 'pass' ? 'Changing...' : 'Change Password'}
        </button>
      </div>

      {/* Site Configuration — FIX 2: Now fully connected to backend */}
      <div style={s.section}>
        <div style={s.sectionTitle}>🌐 Site Configuration</div>
        {settingsLoading ? (
          <div style={{ color: 'var(--text2)', fontSize: 13 }}>Loading settings...</div>
        ) : (
          <>
            <div style={s.grid}>
              {[
                { key: 'libraryName',    label: 'Library Name' },
                { key: 'libraryPhone',   label: 'Phone Number' },
                { key: 'libraryEmail',   label: 'Contact Email' },
                { key: 'libraryAddress', label: 'Address' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label style={s.label}>{label}</label>
                  <input style={s.input} value={siteSettings[key]} onChange={e => setSiteSettings(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24 }}>
              <div style={s.sectionTitle}>⚙️ Features</div>
              {[
                { key: 'chatbotEnabled',  label: 'AI Chatbot',        desc: 'Enable Groq AI chatbot for users' },
                { key: 'maintenanceMode', label: 'Maintenance Mode',   desc: 'Show maintenance banner on site' },
              ].map(({ key, label, desc }) => (
                <div key={key} style={{ ...s.toggle, marginBottom: 20 }}>
                  <div
                    onClick={() => setSiteSettings(p => ({ ...p, [key]: !p[key] }))}
                    style={{
                      width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                      background: siteSettings[key] ? 'var(--gold)' : 'var(--dark3)',
                      position: 'relative', transition: 'background 0.3s',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3, left: siteSettings[key] ? 22 : 3,
                      width: 18, height: 18, borderRadius: '50%', background: '#fff',
                      transition: 'left 0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }} />
                  </div>
                  <div>
                    <div style={s.toggleLabel}>{label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{desc}</div>
                  </div>
                  <span style={{ ...s.badge, background: siteSettings[key] ? 'rgba(90,206,160,0.1)' : 'rgba(107,99,88,0.2)', color: siteSettings[key] ? 'var(--green)' : 'var(--text3)' }}>
                    {siteSettings[key] ? 'ON' : 'OFF'}
                  </span>
                </div>
              ))}
            </div>

            <button style={s.btn} onClick={saveSiteSettings} disabled={saving === 'site'}>
              {saving === 'site' ? 'Saving...' : 'Save Settings'}
            </button>
          </>
        )}
      </div>

      {/* API Keys */}
      <div style={s.section}>
        <div style={s.sectionTitle}>🔑 API Keys & Integration</div>
        <div style={s.grid}>
          <div>
            <label style={s.label}>Razorpay Key ID</label>
            <input style={{ ...s.input, opacity: 0.6 }} value="Configured in server/.env" readOnly />
          </div>
          <div>
            <label style={s.label}>AI Model</label>
            <input style={{ ...s.input, opacity: 0.6 }} value="Groq LLaMA 3.1 (Active)" readOnly />
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 12 }}>
          ⚠️ API keys (Razorpay, Groq, Email) are stored in <code>server/.env</code>. Edit that file directly to change them.
        </p>
      </div>
    </div>
  );
}
