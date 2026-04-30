import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';

const WASTE_TYPES = [
  { id: 'bio', label: 'Bio / Organic', icon: '🌱', desc: 'Kitchen waste, food scraps, garden waste', points: 50 },
  { id: 'plastic', label: 'Plastic Waste', icon: '♻️', desc: 'Bottles, bags, packaging material', points: 75 },
  { id: 'e-waste', label: 'E-Waste', icon: '💻', desc: 'Electronics, batteries, cables', points: 100 },
  { id: 'dry', label: 'Dry Waste', icon: '📦', desc: 'Paper, cardboard, metal, glass', points: 40 },
];

const TIME_SLOTS = ['7:00 AM – 9:00 AM', '9:00 AM – 11:00 AM', '11:00 AM – 1:00 PM', '2:00 PM – 4:00 PM', '4:00 PM – 6:00 PM'];

export default function BookPickup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ wasteType: '', date: '', timeSlot: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const minDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/bookings', form);
      setSuccess(res.data.booking);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1>Book a Pickup</h1>
            <p className="page-subtitle">Schedule your waste collection in 3 easy steps</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="stepper">
          {['Choose Waste', 'Select Slot', 'Confirm'].map((s, i) => (
            <div key={i} className={`step ${step > i + 1 ? 'done' : step === i + 1 ? 'active' : ''}`}>
              <div className="step-num">{step > i + 1 ? '✓' : i + 1}</div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Step 1: Waste Type */}
        {step === 1 && (
          <div className="book-step">
            <h2>What type of waste do you have?</h2>
            <div className="waste-grid">
              {WASTE_TYPES.map(w => (
                <button key={w.id} id={`waste-${w.id}`}
                  className={`waste-card ${form.wasteType === w.id ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, wasteType: w.id })}>
                  <span className="waste-emoji">{w.icon}</span>
                  <h3>{w.label}</h3>
                  <p>{w.desc}</p>
                  <div className="waste-pts">+{w.points} pts</div>
                </button>
              ))}
            </div>
            <button className="btn btn-primary" disabled={!form.wasteType} onClick={() => setStep(2)}>
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Date & Slot */}
        {step === 2 && (
          <div className="book-step">
            <h2>Pick a date and time slot</h2>
            <div className="slot-section">
              <div className="form-group">
                <label>Preferred Date</label>
                <input type="date" id="pickup-date" min={minDate} value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Select Time Slot</label>
                <div className="slot-grid">
                  {TIME_SLOTS.map(slot => (
                    <button key={slot} id={`slot-${slot.replace(/\s/g, '-')}`}
                      className={`slot-btn ${form.timeSlot === slot ? 'selected' : ''}`}
                      onClick={() => setForm({ ...form, timeSlot: slot })}>
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Additional Notes (optional)</label>
                <textarea placeholder="Any special instructions..." value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}></textarea>
              </div>
            </div>
            <div className="btn-row">
              <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-primary" disabled={!form.date || !form.timeSlot} onClick={handleSubmit}>
                {loading ? <span className="spinner-sm"></span> : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && success && (
          <div className="book-step confirm-step">
            <div className="confirm-icon">✅</div>
            <h2>Booking Confirmed!</h2>
            <p>Your pickup has been successfully scheduled.</p>
            <div className="confirm-details">
              <div><span>Waste Type</span><strong>{success.wasteType}</strong></div>
              <div><span>Date</span><strong>{new Date(success.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong></div>
              <div><span>Time Slot</span><strong>{success.timeSlot}</strong></div>
              <div><span>Status</span><span className="badge badge-info">{success.status}</span></div>
              <div><span>Booking ID</span><strong className="mono">#{success._id?.slice(-8).toUpperCase()}</strong></div>
            </div>
            <div className="btn-row">
              <button className="btn btn-outline" onClick={() => navigate('/bookings')}>View All Bookings</button>
              <button className="btn btn-primary" onClick={() => { setStep(1); setForm({ wasteType: '', date: '', timeSlot: '', notes: '' }); setSuccess(null); }}>
                Book Another
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
