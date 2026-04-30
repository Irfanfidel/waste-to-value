import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

const WASTE_META = {
  bio:       { label: 'Bio / Organic', icon: '🌱', color: '#22c55e' },
  plastic:   { label: 'Plastic',       icon: '♻️', color: '#3b82f6' },
  'e-waste': { label: 'E-Waste',       icon: '💻', color: '#f59e0b' },
  dry:       { label: 'Dry Waste',     icon: '📦', color: '#a78bfa' },
};
const STATUS_COLORS = {
  pending:   'badge-warning',
  confirmed: 'badge-info',
  completed: 'badge-success',
  cancelled: 'badge-danger',
};

export default function AdminBookings() {
  const [bookings,   setBookings]   = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [completing, setCompleting] = useState(null);
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatus]   = useState('all');

  useEffect(() => {
    api.get('/admin/bookings')
      .then(r => { setBookings(r.data.bookings); setFiltered(r.data.bookings); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let list = bookings;
    if (statusFilter !== 'all') list = list.filter(b => b.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b =>
        b.user?.name?.toLowerCase().includes(q) ||
        b.user?.email?.toLowerCase().includes(q) ||
        b.wasteType?.includes(q) ||
        b.address?.district?.toLowerCase().includes(q) ||
        b.address?.panchayat?.toLowerCase().includes(q)
      );
    }
    setFiltered(list);
  }, [search, statusFilter, bookings]);

  const completeBooking = async (id) => {
    setCompleting(id);
    try {
      const res = await api.patch(`/admin/bookings/${id}/complete`);
      setBookings(prev => prev.map(b => b._id === id ? res.data.booking : b));
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setCompleting(null); }
  };

  const counts = {
    all:       bookings.length,
    pending:   bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  return (
    <div className="app-layout">
      <Sidebar isAdmin />
      <main className="main-content">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1>📋 Bookings</h1>
            <p className="page-subtitle">All waste pickup bookings across all users</p>
          </div>
          <div className="search-wrap" style={{ width: 300 }}>
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search by name, district, type…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="filter-tabs" style={{ marginBottom: '1.25rem' }}>
          {['all','pending','confirmed','completed','cancelled'].map(s => (
            <button key={s} id={`booking-filter-${s}`}
              className={`tab-btn ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatus(s)}>
              {{ all:'📋 All', pending:'⏳ Pending', confirmed:'✅ Confirmed', completed:'🏆 Completed', cancelled:'❌ Cancelled' }[s]}
              <span className="filter-count">{counts[s]}</span>
            </button>
          ))}
        </div>

        {loading
          ? <div className="page-loading"><span className="spinner"></span></div>
          : filtered.length === 0
            ? <div className="empty-state"><span>📭</span><p>No bookings found{search ? ` for "${search}"` : ''}</p></div>
            : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>ID</th>
                  <th>Citizen</th>
                  <th>Waste Type</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>District</th>
                  <th>Panchayat</th>
                  <th>Ward</th>
                  <th>Status</th>
                  <th>Pts Earned</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b, i) => (
                  <tr key={b._id}>
                    <td className="mono" style={{ color: 'var(--text2)', fontSize: '.75rem' }}>{i + 1}</td>
                    <td className="mono">#{b._id?.slice(-6).toUpperCase()}</td>
                    <td>
                      <strong>{b.user?.name || '—'}</strong><br />
                      <small style={{ color: 'var(--text2)' }}>{b.user?.email}</small>
                    </td>
                    <td>
                      <span style={{ color: WASTE_META[b.wasteType]?.color }}>
                        {WASTE_META[b.wasteType]?.icon} {b.wasteType}
                      </span>
                    </td>
                    <td>{new Date(b.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontSize: '.82rem' }}>{b.timeSlot}</td>
                    <td>{b.address?.district || b.user?.district || '—'}</td>
                    <td>{b.address?.panchayat || b.user?.panchayat || '—'}</td>
                    <td>{b.address?.ward || b.user?.ward || '—'}</td>
                    <td><span className={`badge ${STATUS_COLORS[b.status]}`}>{b.status}</span></td>
                    <td>
                      {b.rewardPointsEarned > 0
                        ? <span className="pts-green">+{b.rewardPointsEarned}</span>
                        : <span style={{ color: 'var(--text2)' }}>—</span>}
                    </td>
                    <td>
                      {b.status === 'confirmed' && (
                        <button className="btn btn-sm btn-success"
                          disabled={completing === b._id}
                          onClick={() => completeBooking(b._id)}>
                          {completing === b._id ? '…' : '✅ Mark Done'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>
    </div>
  );
}
