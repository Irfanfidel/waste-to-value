import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

const WASTE_META = {
  bio:      { label: 'Bio / Organic', icon: '🌱', color: '#22c55e' },
  plastic:  { label: 'Plastic',       icon: '♻️', color: '#3b82f6' },
  'e-waste':{ label: 'E-Waste',       icon: '💻', color: '#f59e0b' },
  dry:      { label: 'Dry Waste',     icon: '📦', color: '#a78bfa' },
};
const PERIODS = [
  { value: 'lastMonth',   label: 'Last Month' },
  { value: 'last3Months', label: 'Last 3 Months' },
  { value: 'last6Months', label: 'Last 6 Months' },
  { value: 'lastYear',    label: 'Last Year' },
  { value: 'allTime',     label: 'All Time' },
];
const STATUS_COLORS = { pending:'badge-warning', confirmed:'badge-info', completed:'badge-success', cancelled:'badge-danger' };

function ProgressBar({ value, max, color }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="prog-wrap">
      <div className="prog-bar" style={{ width: `${pct}%`, background: color }}></div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab]     = useState('overview');
  const [stats,     setStats]         = useState(null);
  const [bookings,  setBookings]      = useState([]);
  const [users,     setUsers]         = useState([]);
  const [analytics, setAnalytics]     = useState(null);
  const [period,    setPeriod]        = useState('lastMonth');
  const [district,  setDistrict]      = useState('');
  const [panchayat, setPanchayat]     = useState('');
  const [loading,   setLoading]       = useState(true);
  const [aLoading,  setALoading]      = useState(false);
  const [completing,setCompleting]    = useState(null);

  // Database viewer state
  const [dbCollection, setDbCollection] = useState('users');
  const [dbData,        setDbData]       = useState([]);
  const [dbTotal,       setDbTotal]      = useState(0);
  const [dbPage,        setDbPage]       = useState(1);
  const [dbTotalPages,  setDbTotalPages] = useState(1);
  const [dbSearch,      setDbSearch]     = useState('');
  const [dbCounts,      setDbCounts]     = useState({});
  const [dbLoading,     setDbLoading]    = useState(false);
  const searchTimer = useRef(null);

  // Load stats + bookings + users once
  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/bookings'), api.get('/admin/users')])
      .then(([s, b, u]) => { setStats(s.data.stats); setBookings(b.data.bookings); setUsers(u.data.users); })
      .catch(console.error).finally(() => setLoading(false));
  }, []);

  // Load database records
  const loadDatabase = useCallback((col, search, page) => {
    setDbLoading(true);
    api.get(`/admin/database?collection=${col}&search=${encodeURIComponent(search)}&page=${page}&limit=20`)
      .then(r => {
        setDbData(r.data.data);
        setDbTotal(r.data.total);
        setDbTotalPages(r.data.totalPages);
        setDbCounts(r.data.counts);
      })
      .catch(console.error)
      .finally(() => setDbLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'database') loadDatabase(dbCollection, dbSearch, dbPage);
  }, [activeTab, dbCollection, dbPage]);

  const handleDbSearch = (val) => {
    setDbSearch(val);
    setDbPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadDatabase(dbCollection, val, 1), 400);
  };

  const switchCollection = (col) => {
    setDbCollection(col);
    setDbSearch('');
    setDbPage(1);
  };

  // Load analytics whenever filters change
  const loadAnalytics = useCallback(() => {
    setALoading(true);
    api.get(`/admin/analytics?period=${period}&district=${district}&panchayat=${panchayat}`)
      .then(r => setAnalytics(r.data.analytics))
      .catch(console.error)
      .finally(() => setALoading(false));
  }, [period, district, panchayat]);

  useEffect(() => { if (activeTab === 'analytics') loadAnalytics(); }, [activeTab, loadAnalytics]);

  const completeBooking = async (id) => {
    setCompleting(id);
    try {
      const res = await api.patch(`/admin/bookings/${id}/complete`);
      setBookings(prev => prev.map(b => b._id === id ? res.data.booking : b));
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setCompleting(null); }
  };

  if (loading) return <div className="page-loading"><span className="spinner"></span></div>;

  const maxWaste = stats ? Math.max(...(stats.wasteBreakdown.map(w => w.count)), 1) : 1;

  return (
    <div className="app-layout">
      <Sidebar isAdmin />
      <main className="main-content">
        <div className="page-header">
          <div><h1>Admin Dashboard</h1><p className="page-subtitle">EcoManage Control Center</p></div>
        </div>

        {/* Tabs */}
        <div className="filter-tabs">
          {['overview','analytics'].map(t => (
            <button key={t} id={`admin-tab-${t}`}
              className={`tab-btn ${activeTab === t ? 'active' : ''}`}
              onClick={() => setActiveTab(t)}>
              {{ overview:'📊 Overview', analytics:'📈 Analytics' }[t]}
            </button>
          ))}
        </div>


        {/* ── OVERVIEW ── */}
        {activeTab === 'overview' && stats && (
          <>
            <div className="stats-grid">
              <div className="stat-card stat-blue"><div className="stat-icon">👥</div><div className="stat-info"><h3>{stats.totalUsers}</h3><p>Total Citizens</p></div></div>
              <div className="stat-card stat-green"><div className="stat-icon">📋</div><div className="stat-info"><h3>{stats.totalBookings}</h3><p>Total Bookings</p></div></div>
              <div className="stat-card stat-emerald"><div className="stat-icon">✅</div><div className="stat-info"><h3>{stats.completedBookings}</h3><p>Completed Pickups</p></div></div>
              <div className="stat-card stat-orange"><div className="stat-icon">🏆</div><div className="stat-info"><h3>{stats.totalPointsAwarded}</h3><p>Points Awarded</p></div></div>
            </div>
            <div className="dash-card">
              <h2 className="card-title">Waste Categories Collected (All Time)</h2>
              {stats.wasteBreakdown.map(w => (
                <div key={w._id} className="breakdown-row">
                  <div className="breakdown-label">
                    <span className="breakdown-dot" style={{ background: WASTE_META[w._id]?.color || '#888' }}></span>
                    <span>{WASTE_META[w._id]?.icon} {w._id?.charAt(0).toUpperCase() + w._id?.slice(1)}</span>
                  </div>
                  <ProgressBar value={w.count} max={maxWaste} color={WASTE_META[w._id]?.color || '#888'} />
                  <span className="breakdown-count">{w.count}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── ANALYTICS ── */}
        {activeTab === 'analytics' && (
          <div className="analytics-section">
            {/* Filters */}
            <div className="analytics-filters">
              <div className="form-group">
                <label>Time Period</label>
                <select id="period-select" value={period} onChange={e => { setPeriod(e.target.value); setPanchayat(''); }}>
                  {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>District</label>
                <select id="district-select" value={district} onChange={e => { setDistrict(e.target.value); setPanchayat(''); }}>
                  <option value="">All Districts</option>
                  {analytics?.districts?.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Panchayat / Municipality</label>
                <select id="panchayat-select" value={panchayat} onChange={e => setPanchayat(e.target.value)} disabled={!district}>
                  <option value="">All Panchayats</option>
                  {analytics?.panchayats?.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={loadAnalytics}>
                {aLoading ? <span className="spinner-sm"></span> : '🔍 Apply'}
              </button>
            </div>

            {aLoading && <div className="page-loading" style={{ minHeight: 200 }}><span className="spinner"></span></div>}

            {!aLoading && analytics && (
              <>
                {/* Summary cards */}
                <div className="stats-grid">
                  <div className="stat-card stat-green">
                    <div className="stat-icon">🗑️</div>
                    <div className="stat-info"><h3>{analytics.totalCollected}</h3><p>Total Collected</p></div>
                  </div>
                  <div className="stat-card stat-emerald">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info"><h3>{analytics.totalCompleted}</h3><p>Completed Pickups</p></div>
                  </div>
                  <div className="stat-card stat-blue">
                    <div className="stat-icon">📍</div>
                    <div className="stat-info"><h3>{analytics.districtBreakdown.length}</h3><p>Districts Active</p></div>
                  </div>
                  <div className="stat-card stat-orange">
                    <div className="stat-icon">🏘️</div>
                    <div className="stat-info"><h3>{analytics.panchayatBreakdown.length}</h3><p>Panchayats Active</p></div>
                  </div>
                </div>

                {/* Waste Type Cards */}
                <h2 className="section-title" style={{ marginBottom: '1rem' }}>
                  Waste by Type — {PERIODS.find(p => p.value === period)?.label}
                  {district && ` · ${district}`}{panchayat && ` · ${panchayat}`}
                </h2>
                <div className="waste-type-cards">
                  {['bio','plastic','e-waste','dry'].map(type => {
                    const data = analytics.wasteByType.find(w => w._id === type);
                    const count = data?.count || 0;
                    const done  = data?.completed || 0;
                    const meta  = WASTE_META[type];
                    return (
                      <div key={type} className="waste-type-card" style={{ borderLeftColor: meta.color }}>
                        <div className="wtc-icon">{meta.icon}</div>
                        <div className="wtc-body">
                          <h3>{meta.label}</h3>
                          <div className="wtc-count">{count}</div>
                          <p>pickups · <span style={{ color: meta.color }}>{done} completed</span></p>
                          <ProgressBar value={done} max={count || 1} color={meta.color} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* District breakdown table */}
                <h2 className="section-title" style={{ margin: '2rem 0 1rem' }}>District-wise Breakdown</h2>
                {analytics.districtBreakdown.length === 0
                  ? <div className="empty-state"><span>📭</span><p>No data for selected filters</p></div>
                  : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>District</th>
                          <th>🌱 Bio</th>
                          <th>♻️ Plastic</th>
                          <th>💻 E-Waste</th>
                          <th>📦 Dry</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.districtBreakdown.map(row => {
                          const get = (t) => row.types.find(x => x.type === t)?.count || 0;
                          return (
                            <tr key={row._id}>
                              <td><strong>{row._id || '—'}</strong></td>
                              <td><span style={{ color:'#22c55e' }}>{get('bio')}</span></td>
                              <td><span style={{ color:'#3b82f6' }}>{get('plastic')}</span></td>
                              <td><span style={{ color:'#f59e0b' }}>{get('e-waste')}</span></td>
                              <td><span style={{ color:'#a78bfa' }}>{get('dry')}</span></td>
                              <td><strong>{row.total}</strong></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Panchayat breakdown table */}
                <h2 className="section-title" style={{ margin: '2rem 0 1rem' }}>
                  Panchayat / Municipality Breakdown {district && `· ${district}`}
                </h2>
                {analytics.panchayatBreakdown.length === 0
                  ? <div className="empty-state"><span>📭</span><p>No data for selected filters</p></div>
                  : (
                  <div className="admin-table-wrap">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Panchayat / Municipality</th>
                          <th>District</th>
                          <th>🌱 Bio</th>
                          <th>♻️ Plastic</th>
                          <th>💻 E-Waste</th>
                          <th>📦 Dry</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.panchayatBreakdown.map((row, i) => {
                          const get = (t) => row.types.find(x => x.type === t)?.count || 0;
                          return (
                            <tr key={i}>
                              <td><strong>{row._id?.panchayat || '—'}</strong></td>
                              <td>{row._id?.district || '—'}</td>
                              <td><span style={{ color:'#22c55e' }}>{get('bio')}</span></td>
                              <td><span style={{ color:'#3b82f6' }}>{get('plastic')}</span></td>
                              <td><span style={{ color:'#f59e0b' }}>{get('e-waste')}</span></td>
                              <td><span style={{ color:'#a78bfa' }}>{get('dry')}</span></td>
                              <td><strong>{row.total}</strong></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── BOOKINGS ── */}
        {activeTab === 'bookings' && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>ID</th><th>Citizen</th><th>Type</th><th>Date</th><th>Slot</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b._id}>
                    <td className="mono">#{b._id?.slice(-6).toUpperCase()}</td>
                    <td><strong>{b.user?.name}</strong><br /><small>{b.user?.district}</small></td>
                    <td>{WASTE_META[b.wasteType]?.icon} {b.wasteType}</td>
                    <td>{new Date(b.date).toLocaleDateString('en-IN')}</td>
                    <td>{b.timeSlot}</td>
                    <td><span className={`badge ${STATUS_COLORS[b.status]}`}>{b.status}</span></td>
                    <td>
                      {b.status === 'confirmed' && (
                        <button className="btn btn-sm btn-success" disabled={completing === b._id} onClick={() => completeBooking(b._id)}>
                          {completing === b._id ? '…' : 'Mark Done'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === 'users' && (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>District</th><th>Panchayat</th><th>Ward</th><th>Points</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.district}</td>
                    <td>{u.panchayat}</td>
                    <td>{u.ward}</td>
                    <td><span className="pts-green">🏆 {u.rewardPoints}</span></td>
                    <td>{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── DATABASE ── */}
        {activeTab === 'database' && (
          <div className="db-viewer">
            {/* Header */}
            <div className="db-header">
              <div>
                <h2 className="section-title" style={{ marginBottom: '.25rem' }}>🗄️ Database Records</h2>
                <p style={{ fontSize: '.85rem', color: 'var(--text2)' }}>
                  All data stored in the system — admin access only
                </p>
              </div>
              <div className="search-wrap" style={{ width: 320 }}>
                <span className="search-icon">🔍</span>
                <input className="search-input" placeholder="Search records…"
                  value={dbSearch} onChange={e => handleDbSearch(e.target.value)} />
                {dbSearch && <button className="search-clear" onClick={() => handleDbSearch('')}>✕</button>}
              </div>
            </div>

            {/* Collection switcher cards */}
            <div className="db-collection-cards">
              {[
                { key: 'users',         icon: '👥', label: 'Users',         color: '#3b82f6' },
                { key: 'bookings',      icon: '📋', label: 'Bookings',      color: '#22c55e' },
                { key: 'rewards',       icon: '🏆', label: 'Rewards',       color: '#f59e0b' },
                { key: 'notifications', icon: '🔔', label: 'Notifications', color: '#a78bfa' },
              ].map(c => (
                <button key={c.key} id={`db-col-${c.key}`}
                  className={`db-col-card ${dbCollection === c.key ? 'active' : ''}`}
                  style={dbCollection === c.key ? { borderColor: c.color, background: `${c.color}15` } : {}}
                  onClick={() => { switchCollection(c.key); loadDatabase(c.key, '', 1); }}>
                  <span className="db-col-icon">{c.icon}</span>
                  <strong>{c.label}</strong>
                  <span className="db-col-count" style={{ color: c.color }}>
                    {dbCounts[c.key] ?? '—'} records
                  </span>
                </button>
              ))}
            </div>

            {/* Table */}
            {dbLoading
              ? <div className="page-loading" style={{ minHeight: 200 }}><span className="spinner"></span></div>
              : dbData.length === 0
                ? <div className="empty-state"><span>📭</span><p>No records found{dbSearch ? ` for "${dbSearch}"` : ''}</p></div>
                : (
                <div className="admin-table-wrap">
                  {/* ── Users table ── */}
                  {dbCollection === 'users' && (
                    <table className="admin-table">
                      <thead><tr>
                        <th>#</th><th>Name</th><th>Email</th><th>Role</th>
                        <th>District</th><th>Panchayat</th><th>Ward</th>
                        <th>House No.</th><th>Points</th><th>Joined</th>
                      </tr></thead>
                      <tbody>
                        {dbData.map((u, i) => (
                          <tr key={u._id}>
                            <td className="mono" style={{ color: 'var(--text2)', fontSize: '.75rem' }}>
                              {(dbPage - 1) * 20 + i + 1}
                            </td>
                            <td><strong>{u.name}</strong></td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`badge ${u.role === 'admin' ? 'badge-danger' : 'badge-success'}`}>
                                {u.role}
                              </span>
                            </td>
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

                  {/* ── Bookings table ── */}
                  {dbCollection === 'bookings' && (
                    <table className="admin-table">
                      <thead><tr>
                        <th>#</th><th>ID</th><th>User</th><th>Role</th>
                        <th>Waste Type</th><th>Date</th><th>Slot</th>
                        <th>District</th><th>Panchayat</th><th>Status</th><th>Pts Earned</th>
                      </tr></thead>
                      <tbody>
                        {dbData.map((b, i) => (
                          <tr key={b._id}>
                            <td className="mono" style={{ color: 'var(--text2)', fontSize: '.75rem' }}>
                              {(dbPage - 1) * 20 + i + 1}
                            </td>
                            <td className="mono">#{b._id?.slice(-6).toUpperCase()}</td>
                            <td>
                              <strong>{b.user?.name || '—'}</strong><br />
                              <small style={{ color: 'var(--text2)' }}>{b.user?.email}</small>
                            </td>
                            <td>
                              <span className={`badge ${b.user?.role === 'admin' ? 'badge-danger' : 'badge-success'}`}>
                                {b.user?.role || '—'}
                              </span>
                            </td>
                            <td>{WASTE_META[b.wasteType]?.icon} {b.wasteType}</td>
                            <td>{new Date(b.date).toLocaleDateString('en-IN')}</td>
                            <td style={{ fontSize: '.8rem' }}>{b.timeSlot}</td>
                            <td>{b.address?.district}</td>
                            <td>{b.address?.panchayat}</td>
                            <td><span className={`badge ${STATUS_COLORS[b.status]}`}>{b.status}</span></td>
                            <td>{b.rewardPointsEarned > 0
                              ? <span className="pts-green">+{b.rewardPointsEarned}</span>
                              : <span style={{ color: 'var(--text2)' }}>—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* ── Rewards table ── */}
                  {dbCollection === 'rewards' && (
                    <table className="admin-table">
                      <thead><tr>
                        <th>#</th><th>User</th><th>Role</th><th>Type</th>
                        <th>Points</th><th>Reason</th><th>Date</th>
                      </tr></thead>
                      <tbody>
                        {dbData.map((r, i) => (
                          <tr key={r._id}>
                            <td className="mono" style={{ color: 'var(--text2)', fontSize: '.75rem' }}>
                              {(dbPage - 1) * 20 + i + 1}
                            </td>
                            <td>
                              <strong>{r.user?.name || '—'}</strong><br />
                              <small style={{ color: 'var(--text2)' }}>{r.user?.email}</small>
                            </td>
                            <td>
                              <span className={`badge ${r.user?.role === 'admin' ? 'badge-danger' : 'badge-success'}`}>
                                {r.user?.role || '—'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${r.type === 'earned' ? 'badge-success' : 'badge-warning'}`}>
                                {r.type}
                              </span>
                            </td>
                            <td>
                              <span className={r.type === 'earned' ? 'pts-green' : 'pts-red'}>
                                {r.type === 'earned' ? '+' : '-'}{r.points}
                              </span>
                            </td>
                            <td style={{ maxWidth: 260, fontSize: '.82rem' }}>{r.reason}</td>
                            <td>{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* ── Notifications table ── */}
                  {dbCollection === 'notifications' && (
                    <table className="admin-table">
                      <thead><tr>
                        <th>#</th><th>User</th><th>Role</th><th>Type</th>
                        <th>Title</th><th>Message</th><th>Read</th><th>Date</th>
                      </tr></thead>
                      <tbody>
                        {dbData.map((n, i) => (
                          <tr key={n._id}>
                            <td className="mono" style={{ color: 'var(--text2)', fontSize: '.75rem' }}>
                              {(dbPage - 1) * 20 + i + 1}
                            </td>
                            <td>
                              <strong>{n.user?.name || '—'}</strong><br />
                              <small style={{ color: 'var(--text2)' }}>{n.user?.email}</small>
                            </td>
                            <td>
                              <span className={`badge ${n.user?.role === 'admin' ? 'badge-danger' : 'badge-success'}`}>
                                {n.user?.role || '—'}
                              </span>
                            </td>
                            <td><span className="badge badge-info">{n.type}</span></td>
                            <td style={{ fontWeight: 600, fontSize: '.85rem' }}>{n.title}</td>
                            <td style={{ maxWidth: 280, fontSize: '.8rem', color: 'var(--text2)' }}>{n.message}</td>
                            <td>{n.isRead
                              ? <span className="badge badge-success">Read</span>
                              : <span className="badge badge-warning">Unread</span>}
                            </td>
                            <td>{new Date(n.createdAt).toLocaleDateString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )
            }

            {/* Pagination */}
            {dbTotalPages > 1 && (
              <div className="db-pagination">
                <span style={{ color: 'var(--text2)', fontSize: '.85rem' }}>
                  Showing {(dbPage - 1) * 20 + 1}–{Math.min(dbPage * 20, dbTotal)} of {dbTotal} records
                </span>
                <div className="db-page-btns">
                  <button className="btn btn-outline btn-sm" disabled={dbPage === 1}
                    onClick={() => setDbPage(p => p - 1)}>← Prev</button>
                  {Array.from({ length: dbTotalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === dbTotalPages || Math.abs(p - dbPage) <= 1)
                    .reduce((acc, p, idx, arr) => {
                      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) => p === '...'
                      ? <span key={i} style={{ color: 'var(--text2)', padding: '0 .25rem' }}>…</span>
                      : <button key={p} className={`btn btn-sm ${dbPage === p ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => setDbPage(p)}>{p}</button>
                    )}
                  <button className="btn btn-outline btn-sm" disabled={dbPage === dbTotalPages}
                    onClick={() => setDbPage(p => p + 1)}>Next →</button>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

