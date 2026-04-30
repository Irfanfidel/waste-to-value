import React, { useEffect, useState, useMemo } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

const POINTS_PER_RUPEE = 5;

const BRANDS = {
  movies: [
    { id: 'bookmyshow', name: 'BookMyShow', logo: '🎬', minPoints: 250 },
    { id: 'pvr',        name: 'PVR Cinemas', logo: '🎥', minPoints: 250 },
    { id: 'inox',       name: 'INOX',        logo: '🍿', minPoints: 250 },
    { id: 'cinepolis',  name: 'Cinepolis',   logo: '🎞️', minPoints: 250 },
  ],
  shopping: [
    { id: 'amazon',   name: 'Amazon',   logo: '📦', minPoints: 500 },
    { id: 'flipkart', name: 'Flipkart', logo: '🛒', minPoints: 500 },
    { id: 'myntra',   name: 'Myntra',   logo: '👗', minPoints: 250 },
    { id: 'meesho',   name: 'Meesho',   logo: '🛍️', minPoints: 250 },
    { id: 'nykaa',    name: 'Nykaa',    logo: '💄', minPoints: 250 },
    { id: 'ajio',     name: 'AJIO',     logo: '🧥', minPoints: 250 },
  ],
  food: [
    { id: 'swiggy',   name: 'Swiggy',    logo: '🛵', minPoints: 150 },
    { id: 'zomato',   name: 'Zomato',    logo: '🍽️', minPoints: 150 },
    { id: 'dominos',  name: "Domino's",  logo: '🍕', minPoints: 150 },
    { id: 'pizzahut', name: 'Pizza Hut', logo: '🍕', minPoints: 150 },
    { id: 'kfc',      name: 'KFC',       logo: '🍗', minPoints: 150 },
  ],
  travel: [
    { id: 'makemytrip', name: 'MakeMyTrip', logo: '✈️', minPoints: 1000 },
    { id: 'redbus',     name: 'RedBus',     logo: '🚌', minPoints: 250  },
    { id: 'yatra',      name: 'Yatra',      logo: '🏨', minPoints: 500  },
    { id: 'oyo',        name: 'OYO',        logo: '🏩', minPoints: 500  },
  ],
};

const CATEGORY_META = {
  all:      { label: '⭐ All'       },
  movies:   { label: '🎬 Movies'   },
  shopping: { label: '🛒 Shopping' },
  food:     { label: '🍽️ Food'     },
  travel:   { label: '✈️ Travel'   },
};

const ALL_BRANDS = Object.entries(BRANDS).flatMap(([cat, list]) =>
  list.map(b => ({ ...b, category: cat }))
);

export default function Rewards() {
  const { user } = useAuth();
  const [rewards,       setRewards]       = useState([]);
  const [currentPoints, setCurrentPoints] = useState(user?.rewardPoints || 0);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Modal state
  const [modal,         setModal]         = useState(null); // { brand } | null
  const [pointsInput,   setPointsInput]   = useState('');
  const [redeeming,     setRedeeming]      = useState(false);
  const [redeemError,   setRedeemError]   = useState('');
  const [voucherResult, setVoucherResult] = useState(null); // show after success

  useEffect(() => {
    api.get('/rewards')
      .then(r => { setRewards(r.data.rewards); setCurrentPoints(r.data.totalPoints); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredBrands = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_BRANDS.filter(b => {
      const matchCat = activeCategory === 'all' || b.category === activeCategory;
      const matchQ   = !q || b.name.toLowerCase().includes(q) || b.category.includes(q);
      return matchCat && matchQ;
    });
  }, [search, activeCategory]);

  const openModal = (brand) => {
    setModal(brand);
    setPointsInput(String(Math.min(brand.minPoints, currentPoints)));
    setRedeemError('');
  };

  const closeModal = () => { setModal(null); setRedeemError(''); };

  const pts          = parseInt(pointsInput) || 0;
  const rupeesPreview = Math.floor(pts / POINTS_PER_RUPEE);
  const isValid      = modal && pts >= modal.minPoints && pts <= currentPoints;

  const handleRedeem = async () => {
    setRedeemError('');
    setRedeeming(true);
    try {
      const res = await api.post('/rewards/voucher', { brandId: modal.id, points: pts });
      setCurrentPoints(res.data.remainingPoints);
      setVoucherResult({ ...res.data.voucher });
      const r2 = await api.get('/rewards');
      setRewards(r2.data.rewards);
      closeModal();
    } catch (err) {
      setRedeemError(err.response?.data?.message || 'Redemption failed. Try again.');
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) return <div className="page-loading"><span className="spinner"></span></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1>Green Rewards</h1>
            <p className="page-subtitle">Tap a brand → choose points → get voucher instantly</p>
          </div>
        </div>

        {/* Points Hero */}
        <div className="points-hero">
          <div className="points-glow">🏆</div>
          <div>
            <h2>{currentPoints.toLocaleString()}</h2>
            <p>Available Green Points</p>
          </div>
          <div className="pts-conversion">
            <div className="conversion-pill">5 pts = ₹1</div>
            <div className="conversion-value">≈ ₹{Math.floor(currentPoints / POINTS_PER_RUPEE).toLocaleString()} value</div>
          </div>
        </div>

        {/* Voucher Success Banner */}
        {voucherResult && (
          <div className="voucher-success">
            <div className="voucher-success-top">
              <span style={{ fontSize: '2rem' }}>{voucherResult.brandLogo}</span>
              <div>
                <h3>🎉 Voucher Generated!</h3>
                <p>{voucherResult.brand} · ₹{voucherResult.rupeesValue} · {voucherResult.pointsUsed} pts used</p>
              </div>
              <button className="close-btn" onClick={() => setVoucherResult(null)}>✕</button>
            </div>
            <div className="coupon-display">
              <p>Your Coupon Code</p>
              <div className="coupon-code">
                <span style={{ letterSpacing: '0.15em', fontWeight: 700 }}>{voucherResult.couponCode}</span>
                <button onClick={() => { navigator.clipboard.writeText(voucherResult.couponCode); }}>📋 Copy</button>
              </div>
              <p className="coupon-note">📧 Sent to {user?.email} · Valid for 30 days</p>
            </div>
          </div>
        )}

        {/* Search + Filter */}
        <div className="marketplace-controls">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input type="text" className="search-input"
              placeholder="Search brands…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
          </div>
          <div className="cat-tabs">
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <button key={key} className={`cat-tab ${activeCategory === key ? 'active' : ''}`}
                onClick={() => setActiveCategory(key)}>{meta.label}</button>
            ))}
          </div>
        </div>

        {/* Brand Grid */}
        <div className="brand-grid">
          {filteredBrands.map(brand => {
            const canAfford = currentPoints >= brand.minPoints;
            return (
              <div key={brand.id}
                className={`brand-card ${!canAfford ? 'locked' : ''}`}
                onClick={() => canAfford && openModal(brand)}
                style={{ cursor: canAfford ? 'pointer' : 'not-allowed' }}>
                <div className="brand-logo">{brand.logo}</div>
                <h3>{brand.name}</h3>
                <p className="brand-cat">{CATEGORY_META[brand.category]?.label}</p>
                <div className="brand-min">Min {brand.minPoints} pts <span className="brand-min-rs">= ₹{brand.minPoints / POINTS_PER_RUPEE}</span></div>
                {canAfford
                  ? <div className="brand-redeem-btn">Redeem →</div>
                  : <div className="brand-locked">🔒 Need {brand.minPoints - currentPoints} more pts</div>}
              </div>
            );
          })}
        </div>

        {/* Points History */}
        <div className="dash-card" style={{ marginTop: '1.5rem' }}>
          <h2 className="card-title">Points History</h2>
          {rewards.length === 0
            ? <div className="empty-state"><span>📜</span><p>No history yet. Complete pickups to earn points!</p></div>
            : rewards.map(r => (
              <div key={r._id} className="reward-history-item">
                <div className={`reward-type-icon ${r.type === 'earned' ? 'earned' : 'redeemed'}`}>
                  {r.type === 'earned' ? '⬆' : '⬇'}
                </div>
                <div style={{ flex: 1 }}>
                  <p>{r.reason}</p>
                  <span className="time-ago">{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <span className={r.type === 'earned' ? 'pts-green' : 'pts-red'}>
                  {r.type === 'earned' ? '+' : '-'}{r.points} pts
                </span>
              </div>
            ))}
        </div>

      </main>

      {/* ── Redeem Modal ── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            {/* Handle bar (mobile) */}
            <div className="modal-handle"></div>

            <div className="modal-header">
              <span style={{ fontSize: '2.5rem' }}>{modal.logo}</span>
              <div>
                <h2 style={{ margin: 0 }}>Redeem for {modal.name}</h2>
                <p style={{ color: 'var(--text2)', fontSize: '.85rem', margin: 0 }}>{CATEGORY_META[modal.category]?.label} · Min {modal.minPoints} pts</p>
              </div>
              <button className="close-btn" onClick={closeModal}>✕</button>
            </div>

            {redeemError && <div className="alert alert-error">{redeemError}</div>}

            {/* Balance display */}
            <div style={{ background: 'var(--bg)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text2)' }}>Your Balance</span>
              <strong style={{ color: 'var(--green-400)', fontSize: '1.1rem' }}>{currentPoints.toLocaleString()} pts</strong>
            </div>

            {/* Quick select chips */}
            <label style={{ fontSize: '.82rem', color: 'var(--text2)', display: 'block', marginBottom: '.5rem' }}>Quick Select</label>
            <div className="quick-pts" style={{ marginBottom: '1rem' }}>
              {[1, 2, 4, 8].map(m => {
                const p = modal.minPoints * m;
                if (p > currentPoints) return null;
                return (
                  <button key={p} type="button"
                    className={`quick-btn ${pts === p ? 'active' : ''}`}
                    onClick={() => setPointsInput(String(p))}>
                    {p} pts = ₹{p / POINTS_PER_RUPEE}
                  </button>
                );
              })}
            </div>

            {/* Points input */}
            <div className="form-group">
              <label>Enter Points (min {modal.minPoints} · max {currentPoints})</label>
              <input type="number" min={modal.minPoints} max={currentPoints} step={5}
                value={pointsInput}
                onChange={e => setPointsInput(e.target.value)}
                style={{ fontSize: '1.2rem', fontWeight: 700 }} />
            </div>

            {/* Live conversion */}
            <div className="conversion-display" style={{ marginBottom: '1.5rem' }}>
              <div className="conv-row">
                <span>Points Used</span>
                <strong>{pts.toLocaleString()} pts</strong>
              </div>
              <div className="conv-arrow">↓ &nbsp;(5 pts = ₹1)</div>
              <div className="conv-row rupee-row">
                <span>Voucher Value</span>
                <strong className="rupee-val">₹{rupeesPreview.toLocaleString()}</strong>
              </div>
              <p className="conv-note">📧 Coupon sent to {user?.email}</p>
            </div>

            <button className="btn btn-primary btn-full"
              onClick={handleRedeem}
              disabled={redeeming || !isValid}
              style={{ fontSize: '1rem', padding: '1rem' }}>
              {redeeming
                ? <><span className="spinner-sm"></span>&nbsp;Generating…</>
                : `🎁 Get ₹${rupeesPreview} ${modal.name} Voucher`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
