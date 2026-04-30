import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

export default function Dashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/bookings'),
      api.get('/notifications'),
      api.get('/rewards')
    ]).then(([b, n, r]) => {
      setBookings(b.data.bookings);
      setNotifications(n.data.notifications.filter(n => !n.isRead).slice(0, 5));
      setRewards(r.data.rewards.slice(0, 3));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const upcoming = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').slice(0, 3);
  const wasteIcon = { bio: '🌱', plastic: '♻️', 'e-waste': '💻', dry: '📦' };
  const statusColors = { pending: 'badge-warning', confirmed: 'badge-info', completed: 'badge-success', cancelled: 'badge-danger' };

  if (loading) return <div className="page-loading"><span className="spinner"></span></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
            <p className="page-subtitle">Here's your eco-impact summary</p>
          </div>
          <Link to="/book" className="btn btn-primary">+ Book Pickup</Link>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card stat-green">
            <div className="stat-icon">🏆</div>
            <div className="stat-info">
              <h3>{user?.rewardPoints || 0}</h3>
              <p>Green Points</p>
            </div>
          </div>
          <div className="stat-card stat-blue">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <h3>{bookings.filter(b => b.status === 'confirmed').length}</h3>
              <p>Upcoming Pickups</p>
            </div>
          </div>
          <div className="stat-card stat-emerald">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{bookings.filter(b => b.status === 'completed').length}</h3>
              <p>Completed Pickups</p>
            </div>
          </div>
          <div className="stat-card stat-orange">
            <div className="stat-icon">🔔</div>
            <div className="stat-info">
              <h3>{notifications.length}</h3>
              <p>Unread Alerts</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Upcoming Bookings */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2>Upcoming Pickups</h2>
              <Link to="/bookings" className="link-sm">View all →</Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="empty-state">
                <span>📭</span>
                <p>No upcoming pickups. <Link to="/book">Book one now!</Link></p>
              </div>
            ) : upcoming.map(b => (
              <div key={b._id} className="booking-item">
                <div className="booking-icon">{wasteIcon[b.wasteType] || '🗑️'}</div>
                <div className="booking-info">
                  <h4>{b.wasteType.charAt(0).toUpperCase() + b.wasteType.slice(1)} Waste</h4>
                  <p>{new Date(b.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} · {b.timeSlot}</p>
                </div>
                <span className={`badge ${statusColors[b.status]}`}>{b.status}</span>
              </div>
            ))}
          </div>

          {/* Recent Notifications */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2>Notifications</h2>
              <Link to="/notifications" className="link-sm">View all →</Link>
            </div>
            {notifications.length === 0 ? (
              <div className="empty-state"><span>🔕</span><p>No new notifications</p></div>
            ) : notifications.map(n => (
              <div key={n._id} className="notif-item">
                <div className="notif-dot"></div>
                <div>
                  <h4>{n.title}</h4>
                  <p>{n.message}</p>
                  <span className="time-ago">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Reward Summary */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h2>Recent Rewards</h2>
              <Link to="/rewards" className="link-sm">Redeem →</Link>
            </div>
            <div className="points-banner">
              <div>
                <h3>{user?.rewardPoints || 0} pts</h3>
                <p>Available to redeem</p>
              </div>
              <span className="points-icon">🌿</span>
            </div>
            {rewards.length === 0 ? (
              <div className="empty-state"><span>🎯</span><p>Complete pickups to earn points!</p></div>
            ) : rewards.map(r => (
              <div key={r._id} className="reward-item">
                <span className={r.type === 'earned' ? 'pts-green' : 'pts-red'}>
                  {r.type === 'earned' ? '+' : '-'}{r.points} pts
                </span>
                <p>{r.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
