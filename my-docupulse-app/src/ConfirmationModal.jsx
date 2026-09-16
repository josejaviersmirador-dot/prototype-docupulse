import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, Printer, Calendar, Hash, User, DollarSign } from 'lucide-react';

export default function ConfirmationModal({ requisition, message, onClose, onResetForm }) {
  const [copied, setCopied] = useState(false);

  if (!requisition) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(requisition.requisitionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-content">
        <div className="modal-header-accent">
          <div className="modal-check-icon">
            <CheckCircle2 size={36} strokeWidth={2.5} />
          </div>
          <h3>Requisition Submitted Successfully!</h3>
          <p>{message}</p>
        </div>

        <div className="modal-body">
          <div className="receipt-grid">
            <div className="receipt-row">
              <span className="receipt-row-label">
                <Hash size={14} style={{ display: 'inline', marginRight: 4 }} />
                Requisition ID
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="receipt-id-badge" data-testid="assigned-req-id">
                  {requisition.requisitionId}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopyId}
                  title="Copy Requisition ID"
                  style={{ padding: '0.25rem 0.5rem' }}
                >
                  {copied ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="receipt-row">
              <span className="receipt-row-label">
                <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
                Submission Timestamp
              </span>
              <span className="receipt-timestamp" data-testid="submission-timestamp">
                {requisition.submittedAtFormatted} ({requisition.submittedAt})
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-row-label">
                <User size={14} style={{ display: 'inline', marginRight: 4 }} />
                Authorized Requestor
              </span>
              <span className="receipt-row-value">
                {requisition.requestor.name} &bull; {requisition.requestor.department}
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-row-label">Title</span>
              <span className="receipt-row-value">{requisition.title}</span>
            </div>

            <div className="receipt-row" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem' }}>
              <span className="receipt-row-label">
                <DollarSign size={14} style={{ display: 'inline', marginRight: 4 }} />
                Total Authorized Value
              </span>
              <span className="currency-amount" style={{ fontSize: '1.25rem', color: 'var(--primary-700)' }}>
                ${requisition.totalAmount.toFixed(2)} {requisition.currency}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print Receipt
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              onClose();
              if (onResetForm) onResetForm();
            }}
          >
            New Requisition
          </button>
        </div>
      </div>
    </div>
  );
}