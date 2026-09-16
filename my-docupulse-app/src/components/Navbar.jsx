import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const { currentUser, isAuthorized, switchUser, availableUsers } = useAuth();

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand-wrapper">
          <div className="brand-logo-badge">
            <FileText size={22} />
          </div>
          <div className="brand-title-wrap">
            <h1>
              DocuPulse
              <span className="brand-version">React + Vite</span>
            </h1>
            <span className="brand-subtitle">Digital Requisition Portal</span>
          </div>
        </div>

        {/* User Session & Role Switcher (AC 1) */}
        <div className="session-panel">
          <div className="user-avatar-circle" title={currentUser.name}>
            {currentUser.avatar}
          </div>
          <div className="user-info-text">
            <div className="user-name-line">
              <strong>{currentUser.name}</strong>
              {isAuthorized ? (
                <span className="badge badge-authorized">
                  <ShieldCheck size={12} />
                  Authorized Requestor
                </span>
              ) : (
                <span className="badge badge-unauthorized">
                  <ShieldAlert size={12} />
                  Unauthorized
                </span>
              )}
            </div>
            <span className="user-subtext">
              {currentUser.department} &bull; {currentUser.role}
            </span>
          </div>

          <div style={{ marginLeft: '0.5rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '0.75rem' }}>
            <select
              id="user-select"
              className="user-switcher-select"
              value={currentUser.id}
              onChange={(e) => switchUser(e.target.value)}
              title="Switch user profile to test authorization"
            >
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.authorized ? 'Authorized' : 'Unauthorized'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}