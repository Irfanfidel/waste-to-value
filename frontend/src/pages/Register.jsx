import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DISTRICTS = ['Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam', 'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram', 'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', district: '', panchayat: '', ward: '', houseNumber: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="brand-icon">🌿</div>
          <h1>EcoManage</h1>
          <p>Waste to Value Management System</p>
          <p className="brand-sub">A Government of India Initiative</p>
        </div>
        <div className="auth-features">
          <div className="feature-item"><span>🌍</span><p>Help build a cleaner nation</p></div>
          <div className="feature-item"><span>💰</span><p>Earn points and redeem rewards</p></div>
          <div className="feature-item"><span>📅</span><p>Schedule convenient pickups</p></div>
          <div className="feature-item"><span>🛡️</span><p>Secure government platform</p></div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card register-card">
          <h2>Create Account</h2>
          <p className="auth-subtitle">Join the green revolution today</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" placeholder="Rajesh Kumar" value={form.name} onChange={set('name')} required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>District</label>
                <select value={form.district} onChange={set('district')} required>
                  <option value="">Select District</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Panchayat / Municipality</label>
                <input type="text" placeholder="e.g. Kazhakkoottam" value={form.panchayat} onChange={set('panchayat')} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Ward Number</label>
                <input type="text" placeholder="e.g. Ward 5" value={form.ward} onChange={set('ward')} required />
              </div>
              <div className="form-group">
                <label>House Number</label>
                <input type="text" placeholder="e.g. TC 12/345" value={form.houseNumber} onChange={set('houseNumber')} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="spinner-sm"></span> : 'Create Account'}
            </button>
          </form>
          <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
