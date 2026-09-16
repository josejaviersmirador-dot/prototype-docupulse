import React from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

export default function LineItemsTable({
  items,
  onChange,
  onAddItem,
  onRemoveItem,
  currency,
  rowErrors = [],
  disabled = false
}) {
  const handleItemFieldChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    onChange(updated);
  };

  return (
    <div>
      <div className="line-items-wrapper">
        <table className="line-items-table">
          <thead>
            <tr>
              <th style={{ width: '45px' }}>#</th>
              <th>Item Description <span className="req-star">*</span></th>
              <th style={{ width: '130px' }}>Quantity <span className="req-star">*</span></th>
              <th style={{ width: '160px' }}>Unit Price ({currency}) <span className="req-star">*</span></th>
              <th style={{ width: '150px' }}>Line Total</th>
              <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const qty = Number(item.quantity) || 0;
              const price = Number(item.unitPrice) || 0;
              const lineTotal = (qty * price).toFixed(2);
              const err = rowErrors[idx] || {};

              return (
                <tr key={item.id || idx}>
                  <td>
                    <span className="item-index-badge">{idx + 1}</span>
                  </td>
                  <td>
                    <input
                      type="text"
                      className={`form-input ${err.description ? 'has-error' : ''}`}
                      placeholder="e.g. 27-inch 4K Monitor"
                      value={item.description}
                      disabled={disabled}
                      onChange={(e) => handleItemFieldChange(idx, 'description', e.target.value)}
                    />
                    {err.description && (
                      <span className="error-hint" style={{ marginTop: '0.25rem' }}>
                        <AlertCircle size={12} /> {err.description}
                      </span>
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className={`form-input ${err.quantity ? 'has-error' : ''}`}
                      value={item.quantity}
                      disabled={disabled}
                      onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                    />
                    {err.quantity && (
                      <span className="error-hint" style={{ marginTop: '0.25rem' }}>
                        <AlertCircle size={12} /> {err.quantity}
                      </span>
                    )}
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={`form-input ${err.unitPrice ? 'has-error' : ''}`}
                      value={item.unitPrice}
                      disabled={disabled}
                      onChange={(e) => handleItemFieldChange(idx, 'unitPrice', e.target.value)}
                    />
                    {err.unitPrice && (
                      <span className="error-hint" style={{ marginTop: '0.25rem' }}>
                        <AlertCircle size={12} /> {err.unitPrice}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="currency-amount">${lineTotal}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="btn btn-danger-ghost"
                      onClick={() => onRemoveItem(idx)}
                      disabled={items.length <= 1 || disabled}
                      title={items.length <= 1 ? 'At least one item is required' : 'Remove item'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onAddItem}
          disabled={disabled}
        >
          <Plus size={15} /> Add Line Item
        </button>
      </div>
    </div>
  );
}