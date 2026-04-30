import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

const wasteIcon = { bio: '🌱', plastic: '♻️', 'e-waste': '💻', dry: '📦' };
const statusColors = { pending: 'badge-warning', confirmed: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger' };

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    api.get('/bookings').then(r => setBookings(r.data.bookings)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(id);
    try {
      const res = await api.patch(`/bookings/${id}/cancel`);
      setBookings(prev => prev.map(b => b._id === id ? res.data.booking : b));
    } catch (err) {
      alert(err.response?.data?.message || 'Cancel failed');
    } finally {
      setCancelling(null);
    }
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  if (loading) return <div className="page-loading"><span className="spinner"></span></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1>My Bookings</h1>
            <p className="page-subtitle">Track and manage all your waste pickups</p>
          </div>
          <Link to="/book" className="btn btn-primary">+ New Booking</Link>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
            <button key={f} id={`filter-${f}`} className={`tab-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)} {f === 'all' ? `(${bookings.length})` : `(${bookings.filter(b => b.status === f).length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-page">
            <span>📭</span>
            <h3>No bookings found</h3>
            <p>{filter === 'all' ? 'You have not made any bookings yet.' : `No ${filter} bookings.`}</p>
            <Link to="/book" className="btn btn-primary">Book a Pickup</Link>
          </div>
        ) : (
          <div className="bookings-list">
            {filtered.map(b => (
              <div key={b._id} className="booking-card">
                <div className="booking-card-icon">{wasteIcon[b.wasteType] || '🗑️'}</div>
                <div className="booking-card-body">
                  <div className="booking-card-top">
                    <h3>{b.wasteType.charAt(0).toUpperCase() + b.wasteType.slice(1)} Waste</h3>
                    <span className={`badge ${statusColors[b.status]}`}>{b.status}</span>
                  </div>
                  <div className="booking-meta">
                    <span>📅 {new Date(b.date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span>🕐 {b.timeSlot}</span>
                    <span>🏠 {b.address?.ward}, {b.address?.district}</span>
                    <span className="mono">#{b._id?.slice(-8).toUpperCase()}</span>
                  </div>
                  {b.status === 'completed' && <p className="pts-earned">+{b.rewardPointsEarned} green points earned ✨</p>}
                  {b.notes && <p className="booking-notes">💬 {b.notes}</p>}
                </div>
                <div className="booking-card-actions">
                  {(b.status === 'pending' || b.status === 'confirmed') && (
                    <button className="btn btn-sm btn-danger" disabled={cancelling === b._id} onClick={() => handleCancel(b._id)}>
                      {cancelling === b._id ? '...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
