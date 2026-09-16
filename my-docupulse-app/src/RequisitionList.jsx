import React from 'react';
import { History, CheckCircle2, Trash2 } from 'lucide-react';

export default function RequisitionList({ requisitions = [], onSelectRequisition, onClearAll }) {
  if (requisitions.length === 0) {
    return (
      <section className="history-section">
        <div className="history-header">
          <h3><History size={18} /> Submitted Requisitions Audit Log</h3>
        </div>
        <div className="empty-history-state">
          No requisitions have been digitally submitted yet in this session.
        </div>
      </section>
    );
  }

  return (
    <section className="history-section">
      <div className="history-header">
        <h3><History size={18} /> Submitted Requisitions Audit Log ({requisitions.length})</h3>
        {onClearAll && (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClearAll}>
            <Trash2 size={14} /> Clear Cache
          </button>
        )}
      </div>

      <div className="line-items-wrapper" style={{ margin: 0 }}>
        <table className="line-items-table">
          <thead>
            <tr>
              <th>Requisition ID</th>
              <th>Title</th>
              <th>Requestor</th>
              <th>Submitted At</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {requisitions.map((req) => (
              <tr key={req.requisitionId}>
                <td>
                  <span className="receipt-id-badge" style={{ fontSize: '0.8rem' }}>
                    {req.requisitionId}
                  </span>
                </td>
                <td>
                  <strong>{req.title}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                    {req.department} &bull; {req.category}
                  </div>
                </td>
                <td>{req.requestor.name}</td>
                <td>
                  <span className="receipt-timestamp" style={{ fontSize: '0.75rem' }}>
                    {req.submittedAtFormatted}
                  </span>
                </td>
                <td><span className="currency-amount">${req.totalAmount.toFixed(2)}</span></td>
                <td>
                  <span className="badge badge-authorized" style={{ fontSize: '0.65rem' }}>
                    <CheckCircle2 size={10} /> {req.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectRequisition(req)}
                  >
                    View Receipt
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}