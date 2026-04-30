import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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
          <div className="feature-item"><span>♻️</span><p>Book waste pickups easily</p></div>
          <div className="feature-item"><span>🏆</span><p>Earn green reward points</p></div>
          <div className="feature-item"><span>🔔</span><p>Real-time notifications</p></div>
          <div className="feature-item"><span>📊</span><p>Track your impact</p></div>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your EcoManage account</p>
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input id="email" type="email" placeholder="citizen@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input id="password" type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="spinner-sm"></span> : 'Sign In'}
            </button>
          </form>
          <p className="auth-switch">Don't have an account? <Link to="/register">Register here</Link></p>
          <div className="demo-creds">
            <p><strong>Demo:</strong> admin@eco.gov / admin123 (Admin)</p>
            <p>citizen@test.com / test123 (Citizen)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
