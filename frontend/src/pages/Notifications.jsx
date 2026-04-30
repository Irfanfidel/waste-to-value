import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

const typeIcon = { booking: '📅', pickup: '🚛', reward: '🏆', system: '🔔' };

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications').then(r => setNotifications(r.data.notifications)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const markAll = async () => {
    await api.patch('/notifications/read-all');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unread = notifications.filter(n => !n.isRead).length;

  if (loading) return <div className="page-loading"><span className="spinner"></span></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1>Notifications {unread > 0 && <span className="badge badge-info">{unread} new</span>}</h1>
            <p className="page-subtitle">Stay updated on your bookings and rewards</p>
          </div>
          {unread > 0 && <button className="btn btn-outline" onClick={markAll}>Mark all read</button>}
        </div>

        {notifications.length === 0 ? (
          <div className="empty-page"><span>🔕</span><h3>No notifications yet</h3><p>We'll notify you when something happens.</p></div>
        ) : (
          <div className="notif-list">
            {notifications.map(n => (
              <div key={n._id} className={`notif-card ${n.isRead ? 'read' : 'unread'}`} onClick={() => !n.isRead && markRead(n._id)}>
                <div className="notif-card-icon">{typeIcon[n.type] || '🔔'}</div>
                <div className="notif-card-body">
                  <div className="notif-top">
                    <h3>{n.title}</h3>
                    {!n.isRead && <span className="unread-dot"></span>}
                  </div>
                  <p>{n.message}</p>
                  <span className="time-ago">{new Date(n.createdAt).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
