import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import RequisitionForm from './components/RequisitionForm';
import ConfirmationModal from './components/ConfirmationModal';
import RequisitionList from './components/RequisitionList';

function Dashboard() {
  const [submittedRequisitions, setSubmittedRequisitions] = useState([]);
  const [activeModalData, setActiveModalData] = useState(null);

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
    <div style={{ width: '100%', minHeight: '100vh', background: '#e2e8f0' }}>
      <main style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <RequisitionForm onSubmissionSuccess={handleSubmissionSuccess} />

        <div style={{ width: '100%', maxWidth: '900px', padding: '0 1rem 3rem' }}>
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
      </main>

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
      <Dashboard />
    </AuthProvider>
  );
}