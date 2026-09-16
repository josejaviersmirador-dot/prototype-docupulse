import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import RequisitionForm from './components/RequisitionForm';
import ConfirmationModal from './components/ConfirmationModal';
import RequisitionList from './components/RequisitionList';
import { getStoredRequisitions, clearStoredRequisitions } from './services/requisitionService';
import { CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

function Dashboard() {
  const [submittedRequisitions, setSubmittedRequisitions] = useState([]);
  const [activeModalData, setActiveModalData] = useState(null);

  useEffect(() => {
    setSubmittedRequisitions(getStoredRequisitions());
  }, []);

  const handleSubmissionSuccess = (result) => {
    setActiveModalData({
      requisition: result.requisition,
      message: result.message
    });
    setSubmittedRequisitions(getStoredRequisitions());
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all submitted requisitions history?')) {
      clearStoredRequisitions();
      setSubmittedRequisitions([]);
    }
  };

  return (
    <div>
      <Navbar />

      <main className="main-wrapper">
        <section className="page-intro">
          <div className="intro-text">
            <h2>Digital Requisition Form Submission</h2>
            <p>
              Submit corporate purchasing requisitions digitally to eliminate manual paperwork and email chains.
            </p>
            <div className="ac-tag-list">
              <span className="ac-pill"><ShieldCheck size={14} color="#059669" /> AC 1: Authorized Requestor</span>
              <span className="ac-pill"><CheckCircle2 size={14} color="#2563eb" /> AC 2: Required Fields & Line Items</span>
              <span className="ac-pill"><Clock size={14} color="#7c3aed" /> AC 3: Unique ID & Timestamp Confirmation</span>
            </div>
          </div>
        </section>

        <RequisitionForm onSubmissionSuccess={handleSubmissionSuccess} />

        <RequisitionList
          requisitions={submittedRequisitions}
          onSelectRequisition={(req) => {
            setActiveModalData({
              requisition: req,
              message: `Viewing receipt for Requisition ${req.requisitionId}.`
            });
          }}
          onClearAll={handleClearHistory}
        />
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