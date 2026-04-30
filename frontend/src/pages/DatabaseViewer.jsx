import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

const STATUS_COLORS = { pending:'badge-warning', confirmed:'badge-info', completed:'badge-success', cancelled:'badge-danger' };
const WASTE_META = {
  bio:       { icon: '🌱', label: 'Bio / Organic', color: '#22c55e' },
  plastic:   { icon: '♻️', label: 'Plastic',       color: '#3b82f6' },
  'e-waste': { icon: '💻', label: 'E-Waste',       color: '#f59e0b' },
  dry:       { icon: '📦', label: 'Dry Waste',     color: '#a78bfa' },
};
const COLLECTIONS = [
  { key: 'users',         icon: '👥', label: 'Users',           color: '#3b82f6' },
  { key: 'bookings',      icon: '📋', label: 'Bookings',        color: '#22c55e' },
  { key: 'rewards',       icon: '🏆', label: 'Rewards',         color: '#f59e0b' },
  { key: 'wasteCollected',icon: '♻️', label: 'Waste Collected', color: '#a78bfa' },
];

export default function DatabaseViewer() {
  const [collection, setCollection] = useState('users');
  const [data,        setData]       = useState([]);
  const [total,       setTotal]      = useState(0);
  const [page,        setPage]       = useState(1);
  const [totalPages,  setTotalPages] = useState(1);
  const [search,      setSearch]     = useState('');
  const [counts,      setCounts]     = useState({});
  const [loading,     setLoading]    = useState(false);
  const timer = useRef(null);

  const load = useCallback((col, q, pg) => {
    setLoading(true);
    api.get(`/admin/database?collection=${col}&search=${encodeURIComponent(q)}&page=${pg}&limit=20`)
      .then(r => {
        setData(r.data.data);
        setTotal(r.data.total);
        setTotalPages(r.data.totalPages);
        setCounts(r.data.counts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(collection, search, page); }, [collection, page]);

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => load(collection, val, 1), 400);
  };

  const switchCol = (col) => {
    setCollection(col);
    setSearch('');
    setPage(1);
  };

  const meta = COLLECTIONS.find(c => c.key === collection);

  return (
    <div className="app-layout">
      <Sidebar isAdmin />
      <main className="main-content">

        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1>🗄️ Database Viewer</h1>
            <p className="page-subtitle">All system records — admin access only</p>
          </div>
          <div className="search-wrap" style={{ width: 320 }}>
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Search records…"
              value={search} onChange={e => handleSearch(e.target.value)} />
            {search && <button className="search-clear" onClick={() => handleSearch('')}>✕</button>}
          </div>
        </div>

        {/* Collection switcher cards */}
        <div className="db-collection-cards" style={{ marginBottom: '1rem' }}>
          {COLLECTIONS.map(c => (
            <button key={c.key} id={`db-col-${c.key}`}
              className={`db-col-card ${collection === c.key ? 'active' : ''}`}
              style={collection === c.key ? { borderColor: c.color, background: `${c.color}15` } : {}}
              onClick={() => switchCol(c.key)}>
              <span className="db-col-icon">{c.icon}</span>
              <strong>{c.label}</strong>
              <span className="db-col-count" style={{ color: c.color }}>
                {counts[c.key] ?? '—'} records
              </span>
            </button>
          ))}
        </div>

        {/* Info bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'.75rem' }}>
          <span style={{ fontSize:'.85rem', color:'var(--text2)' }}>
            {loading ? 'Loading…' : `${total} total records in ${meta?.label}`}
            {search && ` matching "${search}"`}
          </span>
          <button className="btn btn-outline btn-sm" onClick={() => load(collection, search, page)}>
            🔄 Refresh
          </button>
        </div>

        {/* Table */}
        {loading
          ? <div className="page-loading" style={{ minHeight: 200 }}><span className="spinner"></span></div>
          : data.length === 0
            ? <div className="empty-state"><span>📭</span><p>No records found{search ? ` for "${search}"` : ''}</p></div>
            : (
            <div className="admin-table-wrap">

              {/* ── Users ── */}
              {collection === 'users' && (
                <table className="admin-table">
                  <thead><tr>
                    <th>#</th><th>Name</th><th>Email</th><th>Role</th>
                    <th>District</th><th>Panchayat</th><th>Ward</th>
                    <th>House No.</th><th>Points</th><th>Joined</th>
                  </tr></thead>
                  <tbody>
                    {data.map((u, i) => (
                      <tr key={u._id}>
                        <td className="mono" style={{ color:'var(--text2)', fontSize:'.75rem' }}>{(page-1)*20+i+1}</td>
                        <td><strong>{u.name}</strong></td>
                        <td>{u.email}</td>
                        <td><span className={`badge ${u.role === 'admin' ? 'badge-danger' : 'badge-success'}`}>{u.role}</span></td>
                        <td>{u.district}</td>
                        <td>{u.panchayat}</td>
                        <td>{u.ward}</td>
                        <td>{u.houseNumber}</td>
                        <td><span className="pts-green">🏆 {u.rewardPoints}</span></td>
                        <td>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* ── Bookings ── */}
              {collection === 'bookings' && (
                <table className="admin-table">
                  <thead><tr>
                    <th>#</th><th>ID</th><th>User</th><th>Role</th>
                    <th>Waste</th><th>Date</th><th>Slot</th>
                    <th>District</th><th>Panchayat</th><th>Status</th><th>Pts</th>
                  </tr></thead>
                  <tbody>
                    {data.map((b, i) => (
                      <tr key={b._id}>
                        <td className="mono" style={{ color:'var(--text2)', fontSize:'.75rem' }}>{(page-1)*20+i+1}</td>
                        <td className="mono">#{b._id?.slice(-6).toUpperCase()}</td>
                        <td>
                          <strong>{b.user?.name || '—'}</strong><br />
                          <small style={{ color:'var(--text2)' }}>{b.user?.email}</small>
                        </td>
                        <td><span className={`badge ${b.user?.role === 'admin' ? 'badge-danger' : 'badge-success'}`}>{b.user?.role || '—'}</span></td>
                        <td style={{ color: WASTE_META[b.wasteType]?.color }}>{WASTE_META[b.wasteType]?.icon} {b.wasteType}</td>
                        <td>{new Date(b.date).toLocaleDateString('en-IN')}</td>
                        <td style={{ fontSize:'.8rem' }}>{b.timeSlot}</td>
                        <td>{b.address?.district}</td>
                        <td>{b.address?.panchayat}</td>
                        <td><span className={`badge ${STATUS_COLORS[b.status]}`}>{b.status}</span></td>
                        <td>{b.rewardPointsEarned > 0
                          ? <span className="pts-green">+{b.rewardPointsEarned}</span>
                          : <span style={{ color:'var(--text2)' }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* ── Rewards ── */}
              {collection === 'rewards' && (
                <table className="admin-table">
                  <thead><tr>
                    <th>#</th><th>User</th><th>Role</th>
                    <th>Type</th><th>Points</th><th>Reason</th><th>Date</th>
                  </tr></thead>
                  <tbody>
                    {data.map((r, i) => (
                      <tr key={r._id}>
                        <td className="mono" style={{ color:'var(--text2)', fontSize:'.75rem' }}>{(page-1)*20+i+1}</td>
                        <td>
                          <strong>{r.user?.name || '—'}</strong><br />
                          <small style={{ color:'var(--text2)' }}>{r.user?.email}</small>
                        </td>
                        <td><span className={`badge ${r.user?.role === 'admin' ? 'badge-danger' : 'badge-success'}`}>{r.user?.role || '—'}</span></td>
                        <td><span className={`badge ${r.type === 'earned' ? 'badge-success' : 'badge-warning'}`}>{r.type}</span></td>
                        <td><span className={r.type === 'earned' ? 'pts-green' : 'pts-red'}>{r.type === 'earned' ? '+' : '-'}{r.points}</span></td>
                        <td style={{ maxWidth:260, fontSize:'.82rem' }}>{r.reason}</td>
                        <td>{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* ── Waste Collected ── */}
              {collection === 'wasteCollected' && (
                <table className="admin-table">
                  <thead><tr>
                    <th>#</th><th>ID</th><th>Citizen</th>
                    <th>Waste Type</th><th>Date Booked</th><th>Time Slot</th>
                    <th>District</th><th>Panchayat</th><th>Ward</th>
                    <th>Status</th><th>Points Earned</th>
                  </tr></thead>
                  <tbody>
                    {data.map((b, i) => {
                      const wm = WASTE_META[b.wasteType];
                      return (
                        <tr key={b._id}>
                          <td className="mono" style={{ color:'var(--text2)', fontSize:'.75rem' }}>{(page-1)*20+i+1}</td>
                          <td className="mono">#{b._id?.slice(-6).toUpperCase()}</td>
                          <td>
                            <strong>{b.user?.name || '—'}</strong><br />
                            <small style={{ color:'var(--text2)' }}>{b.user?.email}</small>
                          </td>
                          <td>
                            <span style={{ color: wm?.color, fontWeight: 600 }}>
                              {wm?.icon} {wm?.label || b.wasteType}
                            </span>
                          </td>
                          <td>{new Date(b.date).toLocaleDateString('en-IN')}</td>
                          <td style={{ fontSize:'.8rem' }}>{b.timeSlot}</td>
                          <td>{b.address?.district || b.user?.district || '—'}</td>
                          <td>{b.address?.panchayat || b.user?.panchayat || '—'}</td>
                          <td>{b.address?.ward || b.user?.ward || '—'}</td>
                          <td><span className={`badge ${STATUS_COLORS[b.status]}`}>{b.status}</span></td>
                          <td>{b.rewardPointsEarned > 0
                            ? <span className="pts-green">+{b.rewardPointsEarned} pts</span>
                            : <span style={{ color:'var(--text2)' }}>—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

            </div>
          )
        }

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="db-pagination">
            <span style={{ color:'var(--text2)', fontSize:'.85rem' }}>
              Showing {(page-1)*20+1}–{Math.min(page*20, total)} of {total} records
            </span>
            <div className="db-page-btns">
              <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => setPage(p => p-1)}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i+1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p-page) <= 1)
                .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx-1] > 1) acc.push('...'); acc.push(p); return acc; }, [])
                .map((p, i) => p === '...'
                  ? <span key={i} style={{ color:'var(--text2)', padding:'0 .25rem' }}>…</span>
                  : <button key={p} className={`btn btn-sm ${page === p ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPage(p)}>{p}</button>
                )}
              <button className="btn btn-outline btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p+1)}>Next →</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
