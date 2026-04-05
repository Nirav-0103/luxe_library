import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { registerAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isValidPhone = (v) => !v || /^[+]?[\d\s\-()]{8,15}$/.test(v);

export default function SignupPage() {
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(p => ({...p, [e.target.name]:''}));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email) e.email = 'Email is required';
    else if (!isValidEmail(form.email)) e.email = 'Please enter a valid email address';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (form.phone && !isValidPhone(form.phone)) e.phone = 'Enter valid phone with country code (e.g. +91 9876543210)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      setLoading(true);
      const res = await registerAPI(form);
      login(res.data.user, res.data.token);
      toast.success(`Welcome to Luxe Library, ${res.data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const strength = form.password.length >= 8 ? 'strong' : form.password.length >= 6 ? 'medium' : 'weak';
  const strengthColor = { strong:'var(--green)', medium:'var(--gold)', weak:'var(--red)' }[strength];

  return (
    <div className="auth">
      <div className="auth__panel">
        <div className="auth__panel-bg" />
        <div className="auth__panel-content">
          <Link to="/" className="auth__logo"><span className="auth__logo-star">✦</span>LUXE LIBRARY</Link>
          <div className="auth__panel-quote">
            <p>"The more that you read, the more things you will know."</p>
            <span>— Dr. Seuss</span>
          </div>
          <div className="auth__panel-deco">
            {['🌟','📚','🎓','🌍'].map((e,i)=><div key={i} className="auth__panel-icon" style={{'--i':i}}>{e}</div>)}
          </div>
        </div>
      </div>

      <div className="auth__form-panel">
        <div className="auth__form-wrap page-enter">
          <div className="auth__header">
            <p className="auth__sub">Start your journey</p>
            <h1 className="auth__title">Create Account</h1>
          </div>

          <form onSubmit={handleSubmit} className="auth__form" noValidate>
            <div className="auth__row">
              <div className="auth__field">
                <label className="auth__label">Full Name *</label>
                <input className={`auth__input ${errors.name?'auth__input--error':''}`} name="name" value={form.name} onChange={handleChange} placeholder="Your full name"/>
                {errors.name && <div className="auth__error">⚠️ {errors.name}</div>}
              </div>
              <div className="auth__field">
                <label className="auth__label">Phone <span style={{fontSize:10,color:'var(--text-muted)'}}>(with country code)</span></label>
                <input className={`auth__input ${errors.phone?'auth__input--error':''}`} name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9876543210"/>
                {errors.phone && <div className="auth__error">⚠️ {errors.phone}</div>}
              </div>
            </div>

            <div className="auth__field">
              <label className="auth__label">Email Address *</label>
              <input className={`auth__input ${errors.email?'auth__input--error':''}`} type="email" name="email" value={form.email} onChange={handleChange} placeholder="your@email.com"/>
              {errors.email && <div className="auth__error">⚠️ {errors.email}</div>}
            </div>

            <div className="auth__field">
              <label className="auth__label">Password *</label>
              <div className="auth__input-wrap">
                <input className={`auth__input ${errors.password?'auth__input--error':''}`} type={showPass?'text':'password'} name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters"/>
                <button type="button" className="auth__eye" onClick={()=>setShowPass(!showPass)}>{showPass?'🙈':'👁️'}</button>
              </div>
              {errors.password && <div className="auth__error">⚠️ {errors.password}</div>}
              {form.password && (
                <div className="auth__strength">
                  <div className="auth__strength-bar" style={{width:strength==='strong'?'100%':strength==='medium'?'60%':'30%',background:strengthColor}}/>
                </div>
              )}
            </div>

            <div className="auth__terms">
              <input type="checkbox" id="terms" required/>
              <label htmlFor="terms">I agree to the <span className="auth__switch-link">Terms of Service</span></label>
            </div>

            <button type="submit" className="auth__submit" disabled={loading}>
              {loading?<span className="auth__spinner"/>:'Create Account'}
            </button>
          </form>

          <p className="auth__switch">Already have an account? <Link to="/login" className="auth__switch-link">Sign In →</Link></p>
        </div>
      </div>
    </div>
  );
}