import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Send, AlertCircle, ShieldAlert, Upload, X, CheckCircle2 } from 'lucide-react';

function generateRequisitionId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REQ-${dateStr}-${randomHex}`;
}

const INITIAL_ITEMS = [
  { id: 1, quantity: 1, particulars: '', unitCost: '' },
  { id: 2, quantity: '', particulars: '', unitCost: '' },
  { id: 3, quantity: '', particulars: '', unitCost: '' },
  { id: 4, quantity: '', particulars: '', unitCost: '' }
];

export default function RequisitionForm({ onSubmissionSuccess }) {
  const authContext = useAuth ? useAuth() : null;
  const currentUser = authContext?.currentUser || {
    id: 'usr_ops_01',
    name: 'Jane Doe',
    department: 'Operations',
    role: 'Senior Operations Lead',
    authorized: true
  };
  const isAuthorized = authContext ? authContext.isAuthorized : true;

  const [reqType, setReqType] = useState('PURCHASE');
  const [dateNeeded, setDateNeeded] = useState('');
  const [department, setDepartment] = useState('');
  const [remarks, setRemarks] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [errors, setErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [dateFiled, setDateFiled] = useState(
    new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setDateFiled(
        new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      );
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const [signatures, setSignatures] = useState({
    requestedBy: { name: '', image: null },
    verifiedBy: { name: '', image: null },
    fundingAssuredBy: { name: '', image: null },
    approvedBy: { name: '', image: null }
  });

  useEffect(() => {
    if (currentUser?.authorized) {
      if (!department && currentUser.department) setDepartment(currentUser.department);
      setSignatures((prev) => ({
        ...prev,
        requestedBy: {
          ...prev.requestedBy,
          name: prev.requestedBy.name || currentUser.name || ''
        }
      }));
    }
  }, [currentUser]);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
    setDuplicateWarning('');
    if (errors.items) setErrors((prev) => ({ ...prev, items: null }));
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), quantity: '', particulars: '', unitCost: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
    setDuplicateWarning('');
  };

  const handleSignatureNameChange = (roleKey, value) => {
    setSignatures((prev) => ({
      ...prev,
      [roleKey]: { ...prev[roleKey], name: value }
    }));
    if (errors[`sig_${roleKey}`]) {
      setErrors((prev) => ({ ...prev, [`sig_${roleKey}`]: null }));
    }
  };

  const handleSignatureImageUpload = (roleKey, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setSignatures((prev) => ({
        ...prev,
        [roleKey]: { ...prev[roleKey], image: e.target.result }
      }));
      if (errors[`sig_${roleKey}`]) {
        setErrors((prev) => ({ ...prev, [`sig_${roleKey}`]: null }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignatureImage = (roleKey) => {
    setSignatures((prev) => ({
      ...prev,
      [roleKey]: { ...prev[roleKey], image: null }
    }));
  };

  const totalCost = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const cost = Number(item.unitCost) || 0;
    return sum + qty * cost;
  }, 0);

  const validateForm = (filledItems) => {
    const validationErrors = {};

    if (!department.trim()) {
      validationErrors.department = 'Charge to (Department/Unit) is required.';
    }
    if (!dateNeeded) {
      validationErrors.dateNeeded = 'Date Needed is required.';
    }
    if (!remarks.trim() || remarks.trim().length < 5) {
      validationErrors.remarks = 'Remarks / Business justification is required (minimum 5 characters).';
    }
    if (filledItems.length === 0) {
      validationErrors.items = 'At least one complete line item (particulars, qty > 0, unit cost >= 0) is required.';
    } else {
      filledItems.forEach((item, index) => {
        if (!item.particulars.trim()) {
          validationErrors[`item_${index}_particulars`] = 'Particulars description is required.';
        }
        if (!item.quantity || Number(item.quantity) <= 0) {
          validationErrors[`item_${index}_quantity`] = 'Qty must be > 0.';
        }
        if (item.unitCost === '' || Number(item.unitCost) < 0) {
          validationErrors[`item_${index}_unitCost`] = 'Unit cost must be >= 0.';
        }
      });
    }

    if (!signatures.requestedBy.name.trim()) {
      validationErrors.sig_requestedBy = 'Requestor printed name is required.';
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const checkForDuplicates = (processedItems) => {
    try {
      const existing = JSON.parse(localStorage.getItem('docupulse_requisitions') || '[]');
      const isDuplicate = existing.some((req) => {
        const sameDept = req.department?.toLowerCase() === department.trim().toLowerCase();
        const sameType = req.category === reqType;
        const sameTotal = Number(req.totalAmount) === Number(totalCost.toFixed(2));
        const sameRemarks = req.justification?.toLowerCase() === remarks.trim().toLowerCase();

        const sameItems =
          req.items?.length === processedItems.length &&
          req.items.every(
            (item, idx) =>
              item.description?.toLowerCase() === processedItems[idx]?.description?.toLowerCase() &&
              Number(item.quantity) === Number(processedItems[idx]?.quantity)
          );

        return sameDept && sameType && sameTotal && sameRemarks && sameItems;
      });

      if (isDuplicate) {
        setDuplicateWarning('Duplicate Submission Flagged: An identical requisition has already been submitted to DocuPulse.');
        return true;
      }
    } catch (e) {
      console.error('Error reading localStorage for duplicate verification:', e);
    }
    setDuplicateWarning('');
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthorized) {
      setErrors({ auth: 'Unauthorized: You must be an authorized requestor to submit.' });
      return;
    }

    const filledItems = items.filter(
      (item) => item.particulars.trim() !== '' || item.quantity !== '' || item.unitCost !== ''
    );

    const isValid = validateForm(filledItems);
    if (!isValid) return;

    const processedItems = filledItems.map((item, idx) => {
      const qty = parseInt(item.quantity, 10) || 1;
      const price = parseFloat(item.unitCost) || 0;
      return {
        lineNumber: idx + 1,
        description: item.particulars.trim(),
        quantity: qty,
        unitPrice: price,
        lineTotal: +(qty * price).toFixed(2)
      };
    });

    const isDup = checkForDuplicates(processedItems);
    if (isDup) return;

    try {
      setIsSubmitting(true);

      const requisitionId = generateRequisitionId();
      const submissionDate = new Date();
      const submissionTimestamp = submissionDate.toISOString();
      const formattedTimestamp = submissionDate.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium'
      });

      const record = {
        requisitionId,
        title: `${reqType} Requisition - ${department}`,
        department: department.trim(),
        category: reqType,
        priority: 'Medium',
        justification: remarks.trim(),
        poNumber: poNumber.trim(),
        dateFiled,
        dateNeeded,
        currency: 'PHP',
        items: processedItems,
        totalAmount: +(totalCost.toFixed(2)),
        status: 'Pending Department Head Approval',
        currentApprover: 'Department Head',
        submittedAt: submissionTimestamp,
        submittedAtFormatted: formattedTimestamp,
        requestor: {
          id: currentUser.id,
          name: signatures.requestedBy.name || currentUser.name,
          department: currentUser.department,
          role: currentUser.role
        },
        signatories: signatures,
        history: [
          {
            stage: 'Submission',
            status: 'Submitted',
            by: signatures.requestedBy.name || currentUser.name,
            timestamp: submissionTimestamp,
            note: 'Form validated automatically and routed for Department Head Review.'
          }
        ]
      };

      const existing = JSON.parse(localStorage.getItem('docupulse_requisitions') || '[]');
      localStorage.setItem('docupulse_requisitions', JSON.stringify([record, ...existing]));

      setIsSubmitting(false);

      if (onSubmissionSuccess) {
        onSubmissionSuccess({
          success: true,
          message: `Requisition ${requisitionId} validated and routed to your Department Head for approval.`,
          requisition: record
        });
      }

      setItems(INITIAL_ITEMS);
      setRemarks('');
      setDateNeeded('');
      setPoNumber('');
      setSignatures({
        requestedBy: { name: currentUser.name || '', image: null },
        verifiedBy: { name: '', image: null },
        fundingAssuredBy: { name: '', image: null },
        approvedBy: { name: '', image: null }
      });
      setErrors({});
      setDuplicateWarning('');
    } catch (err) {
      setIsSubmitting(false);
      setErrors({ submit: err.message });
    }
  };

  return (
    <div className="apc-paper-container">
      <style>{`
        .apc-paper-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1rem 0 3rem;
          background: #e2e8f0;
          font-family: Arial, Helvetica, sans-serif;
          color: #0f172a;
        }

        .apc-paper-sheet {
          background: #ffffff;
          width: 100%;
          max-width: 900px;
          border: 1px solid #475569;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          padding: 2.5rem 3rem;
          box-sizing: border-box;
          margin-bottom: 2rem;
        }

        .apc-doc-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          gap: 1.5rem;
        }

        .apc-brand-center {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .apc-org-emblem {
          margin-bottom: 0.35rem;
        }

        .apc-org-name {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
          color: #1e293b;
          letter-spacing: 0.04em;
        }

        .apc-form-title {
          font-size: 1.45rem;
          font-weight: 800;
          margin: 0.25rem 0 0.75rem;
          color: #0f172a;
          letter-spacing: 0.08em;
        }

        .apc-req-type-row {
          display: flex;
          gap: 2.5rem;
          align-items: center;
          margin-top: 0.25rem;
        }

        .apc-type-option {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
        }

        .apc-type-option input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .apc-meta-box {
          border: 1px solid #1e293b;
          padding: 0.65rem 0.85rem;
          min-width: 250px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          box-sizing: border-box;
        }

        .apc-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.825rem;
        }

        .apc-meta-title {
          font-weight: 700;
          color: #1e293b;
        }

        .apc-meta-pending {
          font-family: monospace;
          color: #2563eb;
          font-weight: 700;
          font-size: 0.8rem;
        }

        .apc-meta-date {
          font-family: monospace;
          font-weight: 600;
        }

        .apc-meta-date-input {
          border: 1px solid #cbd5e1;
          border-bottom: 1px solid #1e293b;
          padding: 0.15rem 0.25rem;
          font-family: monospace;
          font-size: 0.825rem;
          outline: none;
          width: 130px;
        }

        .apc-meta-date-input.has-error {
          border: 1px solid #ef4444;
          background-color: #fef2f2;
        }

        .apc-table-wrap {
          margin-top: 0.5rem;
          width: 100%;
        }

        .apc-table {
          width: 100%;
          border-collapse: collapse;
          border: 2px solid #000000;
        }

        .apc-table th {
          border: 1px solid #000000;
          padding: 0.5rem 0.65rem;
          background: #f1f5f9;
          font-size: 0.85rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .apc-table td {
          border: 1px solid #000000;
          padding: 0.35rem 0.5rem;
          vertical-align: middle;
        }

        .apc-cell-input {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.9rem;
          padding: 0.25rem;
          box-sizing: border-box;
        }

        .apc-cell-input.has-error {
          border: 1px solid #ef4444;
          background-color: #fef2f2;
        }

        .apc-cell-input:focus {
          background: #eff6ff;
        }

        .apc-total-label {
          text-align: right;
          font-weight: 800;
          font-size: 0.95rem;
          padding: 0.65rem 1rem !important;
          background: #f8fafc;
        }

        .apc-total-val {
          text-align: right;
          font-family: monospace;
          font-size: 1.1rem;
          font-weight: 800;
          color: #1e3a8a;
          padding-right: 0.75rem !important;
          background: #eff6ff;
        }

        .apc-btn-add-line {
          margin-top: 0.4rem;
          background: #ffffff;
          border: 1px dashed #64748b;
          color: #1e293b;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.35rem 0.75rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          border-radius: 4px;
        }

        .apc-btn-add-line:hover {
          background: #f1f5f9;
          color: #2563eb;
          border-color: #2563eb;
        }

        .apc-btn-del-row {
          background: transparent;
          border: none;
          color: #ef4444;
          font-size: 1.25rem;
          cursor: pointer;
          line-height: 1;
        }

        .apc-fields-box {
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .apc-field-title {
          font-size: 0.85rem;
          font-weight: 700;
          font-style: italic;
          display: block;
          margin-bottom: 0.25rem;
        }

        .apc-remarks-textarea {
          width: 100%;
          border: 1px solid #000000;
          padding: 0.5rem 0.75rem;
          font-size: 0.9rem;
          box-sizing: border-box;
          outline: none;
          font-family: inherit;
        }

        .apc-remarks-textarea.has-error {
          border-color: #ef4444;
          background-color: #fef2f2;
        }

        .apc-charge-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .apc-charge-input {
          flex: 1;
          border: none;
          border-bottom: 1px solid #000000;
          padding: 0.25rem 0.5rem;
          font-size: 0.9rem;
          outline: none;
        }

        .apc-charge-input.has-error {
          border-bottom: 2px solid #ef4444;
          background-color: #fef2f2;
        }

        .apc-signatures-grid {
          margin-top: 1.5rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1px solid #000000;
        }

        .apc-sig-cell {
          border-right: 1px solid #000000;
          border-bottom: 1px solid #000000;
          padding: 0.65rem 0.85rem;
          min-height: 110px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
        }

        .apc-sig-cell:nth-child(2n) {
          border-right: none;
        }

        .apc-sig-cell.po-cell {
          grid-column: 1 / -1;
          border-bottom: none;
          min-height: 50px;
        }

        .apc-sig-header {
          font-size: 0.8rem;
          font-weight: 800;
          font-style: italic;
        }

        .apc-sig-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0.25rem 0;
          min-height: 50px;
        }

        .apc-sig-img-wrap {
          position: relative;
          display: inline-block;
        }

        .apc-sig-img {
          max-height: 48px;
          max-width: 200px;
          object-fit: contain;
          display: block;
        }

        .apc-sig-del-btn {
          position: absolute;
          top: -6px;
          right: -8px;
          background: #ef4444;
          color: white;
          border: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .apc-sig-upload-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #1e3a8a;
          background: #eff6ff;
          border: 1px dashed #3b82f6;
          padding: 0.35rem 0.65rem;
          border-radius: 4px;
          cursor: pointer;
        }

        .apc-sig-upload-btn:hover {
          background: #dbeafe;
        }

        .apc-sig-name-input {
          width: 100%;
          border: none;
          border-bottom: 1px dotted #64748b;
          text-align: center;
          font-weight: 700;
          font-size: 0.85rem;
          outline: none;
          padding: 0.2rem 0;
          background: transparent;
        }

        .apc-sig-name-input.has-error {
          border-bottom: 2px solid #ef4444;
          background-color: #fef2f2;
        }

        .apc-sig-name-input:focus {
          border-bottom: 1px solid #1e3a8a;
          background: #eff6ff;
        }

        .apc-sig-footer-text {
          font-size: 0.675rem;
          color: #475569;
          border-top: 1px dotted #94a3b8;
          padding-top: 0.2rem;
          text-align: left;
        }

        .apc-actions-bar {
          margin-top: 1.5rem;
          padding-top: 1.25rem;
          border-top: 1px solid #cbd5e1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .apc-workflow-badge {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          color: #047857;
          background: #ecfdf5;
          padding: 0.4rem 0.75rem;
          border-radius: 4px;
          border: 1px solid #a7f3d0;
          font-weight: 600;
        }

        .apc-submit-btn {
          background: #1e3a8a;
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 700;
          padding: 0.75rem 1.75rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .apc-submit-btn:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .apc-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .apc-error-msg {
          color: #dc2626;
          font-size: 0.75rem;
          font-weight: 700;
          display: block;
          margin-top: 0.25rem;
        }

        .apc-unauth-banner {
          background: #fee2e2;
          border: 1px solid #ef4444;
          color: #991b1b;
          padding: 0.75rem 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          width: 100%;
          max-width: 900px;
          box-sizing: border-box;
        }

        .apc-error-summary {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          padding: 0.85rem 1.25rem;
          border-radius: 6px;
          margin-bottom: 1.25rem;
          color: #991b1b;
          width: 100%;
          max-width: 900px;
          box-sizing: border-box;
        }

        .apc-error-summary-title {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 800;
          font-size: 0.9rem;
        }

        .apc-error-summary-list {
          margin: 0.4rem 0 0 1.25rem;
          font-size: 0.825rem;
        }
      `}</style>

      {!isAuthorized && (
        <div className="apc-unauth-banner">
          <ShieldAlert size={22} />
          <div>
            <strong>Submission Restricted to Authorized Requestors</strong>
            <p style={{ margin: 0 }}>Switch user in the top right to submit.</p>
          </div>
        </div>
      )}

      {errors.auth && (
        <div className="apc-unauth-banner">
          <AlertCircle size={20} />
          <span>{errors.auth}</span>
        </div>
      )}

      {(Object.keys(errors).length > 0 || duplicateWarning) && (
        <div className="apc-error-summary">
          <div className="apc-error-summary-title">
            <AlertCircle size={18} />
            <span>Form Submission Validation Issues</span>
          </div>
          {duplicateWarning ? (
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem' }}>{duplicateWarning}</p>
          ) : (
            <ul className="apc-error-summary-list">
              {Object.values(errors).map(
                (err, idx) => err && <li key={idx}>{err}</li>
              )}
            </ul>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="apc-paper-sheet" noValidate>
        <div className="apc-doc-header">
          <div className="apc-brand-center">
            <div className="apc-org-emblem">
              <img
                src="/apc-logo.png"
                alt="Asia Pacific College Seal"
                style={{ width: '68px', height: '68px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
              />
            </div>
            <h2 className="apc-org-name">Asia Pacific College</h2>
            <h1 className="apc-form-title">REQUISITION FORM</h1>

            <div className="apc-req-type-row">
              <label className="apc-type-option">
                <input
                  type="radio"
                  name="reqType"
                  value="PAYMENT"
                  checked={reqType === 'PAYMENT'}
                  onChange={() => {
                    setReqType('PAYMENT');
                    setDuplicateWarning('');
                  }}
                  disabled={!isAuthorized}
                />
                [ &nbsp; ] PAYMENT
              </label>

              <label className="apc-type-option">
                <input
                  type="radio"
                  name="reqType"
                  value="PURCHASE"
                  checked={reqType === 'PURCHASE'}
                  onChange={() => {
                    setReqType('PURCHASE');
                    setDuplicateWarning('');
                  }}
                  disabled={!isAuthorized}
                />
                [ &nbsp; ] PURCHASE
              </label>
            </div>
          </div>

          <div className="apc-meta-box">
            <div className="apc-meta-row">
              <span className="apc-meta-title">Control No.:</span>
              <span className="apc-meta-pending">[ Auto-Assigned ]</span>
            </div>
            <div className="apc-meta-row">
              <span className="apc-meta-title">Date Filed:</span>
              <span className="apc-meta-date">{dateFiled}</span>
            </div>
            <div className="apc-meta-row">
              <span className="apc-meta-title">Date Needed: *</span>
              <input
                type="date"
                className={`apc-meta-date-input ${errors.dateNeeded ? 'has-error' : ''}`}
                value={dateNeeded}
                onChange={(e) => {
                  setDateNeeded(e.target.value);
                  setErrors((prev) => ({ ...prev, dateNeeded: null }));
                }}
                disabled={!isAuthorized}
              />
            </div>
            {errors.dateNeeded && <span className="apc-error-msg">{errors.dateNeeded}</span>}
          </div>
        </div>

        <div className="apc-table-wrap">
          <table className="apc-table">
            <thead>
              <tr>
                <th style={{ width: '65px', textAlign: 'center' }}>QTY</th>
                <th style={{ textAlign: 'left' }}>Particulars / Purpose *</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Unit Cost (₱)</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Total Cost (₱)</th>
                <th style={{ width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const qty = Number(item.quantity) || 0;
                const cost = Number(item.unitCost) || 0;
                const rowTotal = (qty * cost).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                });

                return (
                  <tr key={item.id || idx}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="number"
                        min="1"
                        placeholder="1"
                        className={`apc-cell-input ${errors[`item_${idx}_quantity`] ? 'has-error' : ''}`}
                        style={{ textAlign: 'center' }}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        disabled={!isAuthorized}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Specify item description or purpose..."
                        className={`apc-cell-input ${errors[`item_${idx}_particulars`] ? 'has-error' : ''}`}
                        value={item.particulars}
                        onChange={(e) => handleItemChange(idx, 'particulars', e.target.value)}
                        disabled={!isAuthorized}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        className={`apc-cell-input ${errors[`item_${idx}_unitCost`] ? 'has-error' : ''}`}
                        style={{ textAlign: 'right' }}
                        value={item.unitCost}
                        onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                        disabled={!isAuthorized}
                      />
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, paddingRight: '0.75rem' }}>
                      {qty > 0 && cost > 0 ? `₱${rowTotal}` : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {items.length > 1 && (
                        <button
                          type="button"
                          className="apc-btn-del-row"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={!isAuthorized}
                        >
                          &times;
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="apc-total-label">
                  TOTAL:
                </td>
                <td className="apc-total-val">
                  ₱{totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div>
          <button
            type="button"
            className="apc-btn-add-line"
            onClick={handleAddItem}
            disabled={!isAuthorized}
          >
            <Plus size={14} /> Add Particulars Line
          </button>
        </div>

        <div className="apc-fields-box">
          <div>
            <label className="apc-field-title">Remarks: *</label>
            <textarea
              rows={2}
              className={`apc-remarks-textarea ${errors.remarks ? 'has-error' : ''}`}
              placeholder="State purpose, account codes, or business justification..."
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                setDuplicateWarning('');
                setErrors((prev) => ({ ...prev, remarks: null }));
              }}
              disabled={!isAuthorized}
            />
            {errors.remarks && <span className="apc-error-msg">{errors.remarks}</span>}
          </div>

          <div className="apc-charge-row">
            <label className="apc-field-title" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
              Charge to (Department/Unit): *
            </label>
            <input
              type="text"
              className={`apc-charge-input ${errors.department ? 'has-error' : ''}`}
              placeholder="e.g. Operations, IT, Finance"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setDuplicateWarning('');
                setErrors((prev) => ({ ...prev, department: null }));
              }}
              disabled={!isAuthorized}
            />
          </div>
          {errors.department && <span className="apc-error-msg">{errors.department}</span>}
        </div>

        <div className="apc-signatures-grid">
          <div className="apc-sig-cell">
            <span className="apc-sig-header">Requested by:</span>
            <div className="apc-sig-body">
              {signatures.requestedBy.image ? (
                <div className="apc-sig-img-wrap">
                  <img src={signatures.requestedBy.image} alt="Signature" className="apc-sig-img" />
                  <button
                    type="button"
                    className="apc-sig-del-btn"
                    onClick={() => handleRemoveSignatureImage('requestedBy')}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="apc-sig-upload-btn">
                  <Upload size={13} />
                  <span>Upload Signature</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleSignatureImageUpload('requestedBy', e.target.files[0])}
                    disabled={!isAuthorized}
                  />
                </label>
              )}
            </div>
            <input
              type="text"
              className={`apc-sig-name-input ${errors.sig_requestedBy ? 'has-error' : ''}`}
              value={signatures.requestedBy.name}
              onChange={(e) => handleSignatureNameChange('requestedBy', e.target.value)}
              placeholder="Type Requestor Name *"
              disabled={!isAuthorized}
            />
            {errors.sig_requestedBy && <span className="apc-error-msg">{errors.sig_requestedBy}</span>}
            <span className="apc-sig-footer-text">Signature over Printed Name / Date</span>
          </div>

          <div className="apc-sig-cell">
            <span className="apc-sig-header">Verified by:</span>
            <div className="apc-sig-body">
              {signatures.verifiedBy.image ? (
                <div className="apc-sig-img-wrap">
                  <img src={signatures.verifiedBy.image} alt="Signature" className="apc-sig-img" />
                  <button
                    type="button"
                    className="apc-sig-del-btn"
                    onClick={() => handleRemoveSignatureImage('verifiedBy')}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="apc-sig-upload-btn">
                  <Upload size={13} />
                  <span>Upload Signature</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleSignatureImageUpload('verifiedBy', e.target.files[0])}
                    disabled={!isAuthorized}
                  />
                </label>
              )}
            </div>
            <input
              type="text"
              className="apc-sig-name-input"
              value={signatures.verifiedBy.name}
              onChange={(e) => handleSignatureNameChange('verifiedBy', e.target.value)}
              placeholder="Type Verifier Name"
              disabled={!isAuthorized}
            />
            <span className="apc-sig-footer-text">Signature over Printed Name / Date</span>
          </div>

          <div className="apc-sig-cell">
            <span className="apc-sig-header">Funding Assured by:</span>
            <div className="apc-sig-body">
              {signatures.fundingAssuredBy.image ? (
                <div className="apc-sig-img-wrap">
                  <img src={signatures.fundingAssuredBy.image} alt="Signature" className="apc-sig-img" />
                  <button
                    type="button"
                    className="apc-sig-del-btn"
                    onClick={() => handleRemoveSignatureImage('fundingAssuredBy')}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="apc-sig-upload-btn">
                  <Upload size={13} />
                  <span>Upload Signature</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleSignatureImageUpload('fundingAssuredBy', e.target.files[0])}
                    disabled={!isAuthorized}
                  />
                </label>
              )}
            </div>
            <input
              type="text"
              className="apc-sig-name-input"
              value={signatures.fundingAssuredBy.name}
              onChange={(e) => handleSignatureNameChange('fundingAssuredBy', e.target.value)}
              placeholder="Type Finance Name"
              disabled={!isAuthorized}
            />
            <span className="apc-sig-footer-text">Signature over Printed Name / Date</span>
          </div>

          <div className="apc-sig-cell">
            <span className="apc-sig-header">Approved by:</span>
            <div className="apc-sig-body">
              {signatures.approvedBy.image ? (
                <div className="apc-sig-img-wrap">
                  <img src={signatures.approvedBy.image} alt="Signature" className="apc-sig-img" />
                  <button
                    type="button"
                    className="apc-sig-del-btn"
                    onClick={() => handleRemoveSignatureImage('approvedBy')}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label className="apc-sig-upload-btn">
                  <Upload size={13} />
                  <span>Upload Signature</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleSignatureImageUpload('approvedBy', e.target.files[0])}
                    disabled={!isAuthorized}
                  />
                </label>
              )}
            </div>
            <input
              type="text"
              className="apc-sig-name-input"
              value={signatures.approvedBy.name}
              onChange={(e) => handleSignatureNameChange('approvedBy', e.target.value)}
              placeholder="Type Approver Name"
              disabled={!isAuthorized}
            />
            <span className="apc-sig-footer-text">Signature over Printed Name / Date</span>
          </div>

          <div className="apc-sig-cell po-cell">
            <span className="apc-sig-header">For Purchase, related PO number:</span>
            <input
              type="text"
              className="apc-sig-name-input"
              style={{ textAlign: 'left', marginTop: '0.2rem' }}
              placeholder="Enter reference PO Number if available"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              disabled={!isAuthorized}
            />
          </div>
        </div>

        <div className="apc-actions-bar">
          <div className="apc-workflow-badge">
            <CheckCircle2 size={16} />
            <span>Target Workflow: <strong>Department Head Approval</strong></span>
          </div>

          <button
            type="submit"
            className="apc-submit-btn"
            disabled={!isAuthorized || isSubmitting}
          >
            <Send size={18} />
            {isSubmitting ? 'Validating Submission...' : 'Submit Digital Requisition'}
          </button>
        </div>
      </form>
    </div>
  );
}