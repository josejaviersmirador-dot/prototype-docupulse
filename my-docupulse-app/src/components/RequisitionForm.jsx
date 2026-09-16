import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Send, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

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
  const { currentUser, isAuthorized } = useAuth();

  const [reqType, setReqType] = useState('PURCHASE');
  const [dateNeeded, setDateNeeded] = useState('');
  const [department, setDepartment] = useState('');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser?.department && !department && currentUser.authorized) {
      setDepartment(currentUser.department);
    }
  }, [currentUser]);

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), quantity: '', particulars: '', unitCost: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const totalCost = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const cost = Number(item.unitCost) || 0;
    return sum + qty * cost;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthorized) {
      setErrors({ auth: 'Unauthorized: You must be an authorized requestor to submit.' });
      return;
    }

    const filledItems = items.filter(
      (item) => item.particulars.trim() !== '' || item.quantity !== '' || item.unitCost !== ''
    );

    const validationErrors = {};
    if (!department.trim()) validationErrors.department = 'Charge to (Department/Unit) is required.';
    if (!dateNeeded) validationErrors.dateNeeded = 'Date Needed is required.';
    if (!remarks.trim() || remarks.trim().length < 5) {
      validationErrors.remarks = 'Remarks / Business justification is required (minimum 5 characters).';
    }
    if (filledItems.length === 0) {
      validationErrors.items = 'At least one line item is required.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      const requisitionId = generateRequisitionId();
      const submissionDate = new Date();
      const submissionTimestamp = submissionDate.toISOString();
      const formattedTimestamp = submissionDate.toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium'
      });

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

      const record = {
        requisitionId,
        title: `${reqType} Requisition - ${department}`,
        department: department.trim(),
        category: reqType,
        priority: 'Medium',
        justification: remarks.trim(),
        currency: 'PHP',
        items: processedItems,
        totalAmount: +(totalCost.toFixed(2)),
        status: 'Submitted',
        submittedAt: submissionTimestamp,
        submittedAtFormatted: formattedTimestamp,
        requestor: {
          id: currentUser.id,
          name: currentUser.name,
          department: currentUser.department,
          role: currentUser.role
        }
      };

      const existing = JSON.parse(localStorage.getItem('docupulse_requisitions') || '[]');
      localStorage.setItem('docupulse_requisitions', JSON.stringify([record, ...existing]));

      setIsSubmitting(false);

      if (onSubmissionSuccess) {
        onSubmissionSuccess({
          success: true,
          message: `Requisition ${requisitionId} has been successfully submitted and logged into DocuPulse.`,
          requisition: record
        });
      }

      setItems(INITIAL_ITEMS);
      setRemarks('');
      setDateNeeded('');
      setErrors({});
    } catch (err) {
      setIsSubmitting(false);
      setErrors({ submit: err.message });
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="paper-form-wrapper">
      {!isAuthorized && (
        <div className="unauthorized-banner">
          <ShieldAlert size={22} />
          <div>
            <strong>Submission Restricted to Authorized Requestors</strong>
            <p>Your current profile is not authorized. Switch user in the top right to submit.</p>
          </div>
        </div>
      )}

      {errors.auth && (
        <div className="unauthorized-banner">
          <AlertCircle size={20} />
          <span>{errors.auth}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="paper-sheet" noValidate>
        <div className="paper-header">
          <div className="paper-brand-center">
            <div className="org-emblem">
              <svg width="46" height="46" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="46" stroke="#1e293b" strokeWidth="4" fill="#f8fafc" />
                <circle cx="50" cy="50" r="38" stroke="#2563eb" strokeWidth="2" />
                <path d="M50 20 L65 75 L35 75 Z" fill="#1e3a8a" />
                <circle cx="50" cy="46" r="10" fill="#f59e0b" />
              </svg>
            </div>
            <h2 className="org-name">DocuPulse &bull; Asia Pacific College</h2>
            <h1 className="doc-main-title">REQUISITION FORM</h1>

            <div className="req-type-radios">
              <label className="type-checkbox-label">
                <input
                  type="radio"
                  name="reqType"
                  value="PAYMENT"
                  checked={reqType === 'PAYMENT'}
                  onChange={() => setReqType('PAYMENT')}
                  disabled={!isAuthorized}
                />
                <strong>[ &nbsp; ] PAYMENT</strong>
              </label>

              <label className="type-checkbox-label">
                <input
                  type="radio"
                  name="reqType"
                  value="PURCHASE"
                  checked={reqType === 'PURCHASE'}
                  onChange={() => setReqType('PURCHASE')}
                  disabled={!isAuthorized}
                />
                <strong>[ &nbsp; ] PURCHASE</strong>
              </label>
            </div>
          </div>

          <div className="paper-meta-box">
            <div className="meta-line">
              <span className="meta-title">Control No.:</span>
              <span className="meta-value pending-id">[ Auto-Assigned ]</span>
            </div>
            <div className="meta-line">
              <span className="meta-title">Date Filed:</span>
              <span className="meta-value date-filed">{currentDate}</span>
            </div>
            <div className="meta-line">
              <span className="meta-title">
                Date Needed: <span className="req-star">*</span>
              </span>
              <input
                type="date"
                className={`paper-inline-input ${errors.dateNeeded ? 'input-error' : ''}`}
                value={dateNeeded}
                onChange={(e) => setDateNeeded(e.target.value)}
                disabled={!isAuthorized}
              />
            </div>
            {errors.dateNeeded && <span className="cell-error">{errors.dateNeeded}</span>}
          </div>
        </div>

        <div className="paper-table-wrapper">
          <table className="paper-table">
            <thead>
              <tr>
                <th style={{ width: '65px', textAlign: 'center' }}>QTY</th>
                <th>Particulars / Purpose <span className="req-star">*</span></th>
                <th style={{ width: '150px', textAlign: 'right' }}>Unit Cost (₱)</th>
                <th style={{ width: '150px', textAlign: 'right' }}>Total Cost (₱)</th>
                <th style={{ width: '45px' }}></th>
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
                        className="cell-input center"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        disabled={!isAuthorized}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="Specify item description or purpose..."
                        className="cell-input"
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
                        className="cell-input right"
                        value={item.unitCost}
                        onChange={(e) => handleItemChange(idx, 'unitCost', e.target.value)}
                        disabled={!isAuthorized}
                      />
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, paddingRight: '0.75rem' }}>
                      {qty > 0 && cost > 0 ? `₱${rowTotal}` : '—'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {items.length > 1 && (
                        <button
                          type="button"
                          className="btn-icon-delete"
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
                <td colSpan={3} className="total-label-cell">
                  TOTAL:
                </td>
                <td className="total-value-cell">
                  ₱{totalCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style={{ marginTop: '0.35rem', marginBottom: '1rem' }}>
          <button
            type="button"
            className="btn-add-line"
            onClick={handleAddItem}
            disabled={!isAuthorized}
          >
            <Plus size={14} /> Add Particulars Line
          </button>
        </div>

        <div className="paper-fields-grid">
          <div className="paper-form-row">
            <label className="paper-label">
              Remarks: <span className="req-star">*</span>
            </label>
            <textarea
              rows={2}
              className={`paper-textarea ${errors.remarks ? 'input-error' : ''}`}
              placeholder="State purpose, account codes, or business justification..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={!isAuthorized}
            />
            {errors.remarks && <span className="cell-error">{errors.remarks}</span>}
          </div>

          <div className="paper-form-row inline">
            <label className="paper-label">
              Charge to (Department/Unit): <span className="req-star">*</span>
            </label>
            <input
              type="text"
              className={`paper-input-underline ${errors.department ? 'input-error' : ''}`}
              placeholder="e.g. Operations, IT, Finance"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={!isAuthorized}
            />
            {errors.department && <span className="cell-error">{errors.department}</span>}
          </div>
        </div>

        <div className="paper-signatures-grid">
          <div className="signature-box">
            <span className="sig-title">Requested by:</span>
            <div className="sig-content">
              <div className="sig-name">{currentUser.name}</div>
              <div className="sig-meta">{currentUser.role} &bull; {currentUser.department}</div>
              <div className="digital-sig-stamp">
                <CheckCircle2 size={12} color="#059669" /> Digital ID Verified
              </div>
            </div>
            <span className="sig-footer-label">Signature over Printed Name / Date</span>
          </div>

          <div className="signature-box">
            <span className="sig-title">Verified by:</span>
            <div className="sig-content">
              <div className="sig-pending-text">[ System Routing upon Submit ]</div>
            </div>
            <span className="sig-footer-label">Signature over Printed Name / Date</span>
          </div>

          <div className="signature-box">
            <span className="sig-title">Funding Assured by:</span>
            <div className="sig-content">
              <div className="sig-pending-text">[ Finance & Accounting Unit ]</div>
            </div>
            <span className="sig-footer-label">Signature over Printed Name / Date</span>
          </div>

          <div className="signature-box">
            <span className="sig-title">Approved by:</span>
            <div className="sig-content">
              <div className="sig-pending-text">[ Department Head Approval ]</div>
            </div>
            <span className="sig-footer-label">Signature over Printed Name / Date</span>
          </div>

          <div className="signature-box po-box">
            <span className="sig-title">For Purchase, related PO number:</span>
            <div className="sig-content">
              <div className="sig-pending-text">Generated after approval</div>
            </div>
          </div>
        </div>

        <div className="paper-footer-tag">
          LOGIS-PMP1 &bull; V4.0 &bull; DocuPulse Certified Digital System
        </div>

        <div className="form-submit-bar" style={{ justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={!isAuthorized || isSubmitting}
          >
            <Send size={18} />
            {isSubmitting ? 'Submitting Form...' : 'Submit Digital Requisition'}
          </button>
        </div>
      </form>
    </div>
  );
}