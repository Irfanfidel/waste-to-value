import React from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div><h1>My Profile</h1><p className="page-subtitle">Your account details</p></div>
        </div>
        <div className="profile-card">
          <div className="profile-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <h2>{user?.name}</h2>
          <p className="profile-role">{user?.role}</p>
          <div className="profile-details">
            <div className="profile-row"><span>📧 Email</span><strong>{user?.email}</strong></div>
            <div className="profile-row"><span>🏙️ District</span><strong>{user?.district}</strong></div>
            <div className="profile-row"><span>🏘️ Panchayat</span><strong>{user?.panchayat}</strong></div>
            <div className="profile-row"><span>🏠 Ward</span><strong>{user?.ward}</strong></div>
            <div className="profile-row"><span>🔢 House No.</span><strong>{user?.houseNumber}</strong></div>
            <div className="profile-row"><span>🏆 Green Points</span><strong className="pts-green">{user?.rewardPoints}</strong></div>
          </div>
        </div>
      </main>
    </div>
  );
}
