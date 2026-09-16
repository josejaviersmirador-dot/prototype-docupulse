import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import RequisitionForm from './components/RequisitionForm';
import ConfirmationModal from './components/ConfirmationModal';
import RequisitionList from './components/RequisitionList';
import { 
  FileText, 
  Clock, 
  Printer, 
  RotateCcw, 
  ChevronRight 
} from 'lucide-react';
function WebsiteLayout() {
  const { currentUser, isAuthorized, switchUser, availableUsers } = useAuth();
  const [submittedRequisitions, setSubmittedRequisitions] = useState([]);
  const [activeModalData, setActiveModalData] = useState(null);
  const [activeTab, setActiveTab] = useState('new');
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('docupulse_requisitions') || '[]');
      setSubmittedRequisitions(stored);
    } catch (e) {
      setSubmittedRequisitions([]);
    }
  }, []);
  const handleSubmissionSuccess = (result) => {
    setActiveModalData({
      requisition: result.requisition,
      message: result.message
    });
    try {
      const stored = JSON.parse(localStorage.getItem('docupulse_requisitions') || '[]');
      setSubmittedRequisitions(stored);
    } catch (e) {
      setSubmittedRequisitions([]);
    }
  };
  const handleClearHistory = () => {
    if (window.confirm('Clear all submitted requisitions history?')) {
      localStorage.removeItem('docupulse_requisitions');
      setSubmittedRequisitions([]);
    }
  };
  return (
    <div className="site-wrapper">
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          background-color: #f1f5f9;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
        }
        .site-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #f1f5f9;
        }
        .site-nav {
          background-color: #1e293b;
          color: #ffffff;
          padding: 0 1.5rem;
          height: 62px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .site-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .site-brand-logo {
          width: 40px;
          height: 40px;
          object-fit: contain;
          border-radius: 50%;
          background: #ffffff;
          padding: 2px;
        }
        .site-brand-title {
          font-size: 1.15rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .site-brand-sub {
          font-size: 0.7rem;
          background: #334155;
          color: #cbd5e1;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
        }
        .site-links {
          display: flex;
          gap: 0.5rem;
        }
        .site-nav-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          padding: 0.5rem 0.85rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .site-nav-btn:hover {
          color: #ffffff;
          background: #334155;
        }
        .site-nav-btn.active {
          color: #ffffff;
          background: #2563eb;
        }
        .site-user-ctrl {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }
        .site-user-box {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: #0f172a;
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          border: 1px solid #334155;
        }
        .site-avatar {
          width: 30px;
          height: 30px;
          background: #3b82f6;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.75rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .site-user-name {
          font-size: 0.8rem;
          font-weight: 700;
          color: #f8fafc;
        }
        .site-user-dept {
          font-size: 0.7rem;
          color: #94a3b8;
        }
        .site-switch-select {
          background: #1e293b;
          border: 1px solid #475569;
          color: #e2e8f0;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          outline: none;
        }
        .site-subbar {
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          padding: 0.75rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .site-breadcrumbs {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.8rem;
          color: #64748b;
        }
        .site-breadcrumbs strong {
          color: #0f172a;
        }
        .site-subbar-actions {
          display: flex;
          gap: 0.5rem;
        }
        .site-action-btn {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          color: #334155;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .site-action-btn:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }
        .site-main-body {
          flex: 1;
          padding: 2rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .site-footer {
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          padding: 1.25rem 1.5rem;
          font-size: 0.8rem;
          color: #64748b;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
        }
        .site-footer-status {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: #059669;
          font-weight: 600;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
        }
      `}</style>
      <header className="site-nav">
        <div className="site-brand">
          <img 
            src="/apc-logo.png" 
            alt="Asia Pacific College Logo" 
            className="site-brand-logo" 
          />
          <div>
            <div className="site-brand-title">
              Asia Pacific College
              <span className="site-brand-sub">Requisition Portal</span>
            </div>
          </div>
        </div>
        <nav className="site-links">
          <button 
            type="button" 
            className={`site-nav-btn ${activeTab === 'new' ? 'active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            <FileText size={16} />
            Requisition Form
          </button>
          <button 
            type="button" 
            className={`site-nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Clock size={16} />
            Audit History ({submittedRequisitions.length})
          </button>
        </nav>
        <div className="site-user-ctrl">
          <div className="site-user-box">
            <div className="site-avatar">{currentUser.avatar || 'U'}</div>
            <div>
              <div className="site-user-name">{currentUser.name}</div>
              <div className="site-user-dept">{currentUser.department} &bull; {currentUser.role}</div>
            </div>
          </div>
          <select 
            className="site-switch-select"
            value={currentUser.id}
            onChange={(e) => switchUser(e.target.value)}
            title="Switch User Profile"
          >
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.authorized ? 'Authorized' : 'Guest'})
              </option>
            ))}
          </select>
        </div>
      </header>
      <div className="site-subbar">
        <div className="site-breadcrumbs">
          <span>Portal</span>
          <ChevronRight size={13} />
          <span>Procurement & Logistics</span>
          <ChevronRight size={13} />
          <strong>Requisition Form (APC-LOGIS)</strong>
        </div>
        <div className="site-subbar-actions">
          <button type="button" className="site-action-btn" onClick={() => window.print()}>
            <Printer size={14} /> Print Document
          </button>
          {activeTab === 'history' && (
            <button type="button" className="site-action-btn" onClick={handleClearHistory}>
              <RotateCcw size={14} /> Clear Audit History
            </button>
          )}
        </div>
      </div>
      <main className="site-main-body">
        {activeTab === 'new' && (
          <RequisitionForm onSubmissionSuccess={handleSubmissionSuccess} />
        )}
        {activeTab === 'history' && (
          <div style={{ width: '100%', maxWidth: '900px', background: '#ffffff', padding: '1.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <RequisitionList
              requisitions={submittedRequisitions}
              onSelectRequisition={(req) => {
                setActiveModalData({
                  requisition: req,
                  message: `Viewing receipt for Control No. ${req.requisitionId}.`
                });
              }}
              onClearAll={handleClearHistory}
            />
          </div>
        )}
      </main>
      <footer className="site-footer">
        <div>
          &copy; {new Date().getFullYear()} Asia Pacific College &bull; DocuPulse Digital Workflow System. All rights reserved.
        </div>
        <div className="site-footer-status">
          <span className="status-dot"></span>
          System Online &bull; Secure Digital Signature Submissions Active
        </div>
      </footer>
      {activeModalData && (
        <ConfirmationModal
          requisition={activeModalData.requisition}
          message={activeModalData.message}
          onClose={() => setActiveModalData(null)}
        />
      )}
    </div>
  );
}
export default function App() {
  return (
    <AuthProvider>
      <WebsiteLayout />
    </AuthProvider>
  );
}