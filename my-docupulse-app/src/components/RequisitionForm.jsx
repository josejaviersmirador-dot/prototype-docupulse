import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LineItemsTable from './LineItemsTable';
import { validateRequisitionInput, submitRequisition } from '../services/requisitionService';
import { Send, Sparkles, AlertCircle, ShieldAlert, FileCheck } from 'lucide-react';

const INITIAL_FORM_STATE = {
  title: '',
  department: '',
  category: '',
  priority: 'Medium',
  justification: '',
  currency: 'USD',
  items: [{ id: 1, description: '', quantity: 1, unitPrice: '' }]
};

export default function RequisitionForm({ onSubmissionSuccess }) {
  const { currentUser, isAuthorized } = useAuth();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (currentUser && currentUser.department && !formData.department && currentUser.authorized) {
      setFormData((prev) => ({ ...prev, department: currentUser.department }));
    }
  }, [currentUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), description: '', quantity: 1, unitPrice: '' }]
    }));
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleItemsChange = (newItems) => {
    setFormData((prev) => ({ ...prev, items: newItems }));
    if (errors.items || errors.itemRows) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.items;
        delete next.itemRows;
        return next;
      });
    }
  };

  const handleFillSample = () => {
    setFormData({
      title: 'High-Performance Engineering Workstations Refresh',
      department: currentUser.department || 'Information Technology',
      category: 'IT Hardware',
      priority: 'High',
      justification: 'Current developer machines have reached end-of-life, impeding compilation performance.',
      currency: 'USD',
      items: [
        { id: 1, description: 'Apple MacBook Pro 16" M3 Max 36GB', quantity: 2, unitPrice: 3499.00 },
        { id: 2, description: 'Dell UltraSharp 32" 4K USB-C Hub Monitor', quantity: 2, unitPrice: 799.50 }
      ]
    });
    setErrors({});
    setSubmitError(null);
  };

  const grandTotal = formData.items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    if (!isAuthorized) {
      setSubmitError('Unauthorized Requestor: You do not have permission to submit digital requisitions.');
      return;
    }
    const validation = validateRequisitionInput(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await submitRequisition(formData, currentUser);
      setIsSubmitting(false);

      if (onSubmissionSuccess) {
        onSubmissionSuccess(result);
      }

      setFormData({
        ...INITIAL_FORM_STATE,
        department: currentUser.department || ''
      });
      setErrors({});
    } catch (err) {
      setIsSubmitting(false);
      setSubmitError(err.message || 'An error occurred during submission.');
    }
  };

  return (
    <div className="form-card">
      {/* AC 1 Banner */}
      {!isAuthorized && (
        <div className="unauthorized-banner" data-testid="unauthorized-banner">
          <ShieldAlert size={24} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <h4>Submission Restricted to Authorized Requestors</h4>
            <p>
              Your active session (<strong>{currentUser.name}</strong>) is not authorized.
              Please switch to an authorized user from the top header dropdown.
            </p>
          </div>
        </div>
      )}

      {submitError && (
        <div className="unauthorized-banner" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={22} style={{ flexShrink: 0 }} />
          <div>
            <h4>Submission Blocked</h4>
            <p>{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Section 1 */}
        <div className="section-divider">
          <div className="section-header-row">
            <span className="step-indicator">1</span>
            <h3>Requisition Header & Classification</h3>
          </div>

          <div className="grid-2">
            <div className="form-group col-span-full">
              <label className="form-label" htmlFor="title">
                Requisition Title <span className="req-star">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                className={`form-input ${errors.title ? 'has-error' : ''}`}
                placeholder="e.g. Ergonomic Office Chairs Refresh"
                value={formData.title}
                onChange={handleChange}
                disabled={!isAuthorized}
              />
              {errors.title && (
                <span className="error-hint" data-testid="title-error">
                  <AlertCircle size={13} /> {errors.title}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="department">
                Requesting Department <span className="req-star">*</span>
              </label>
              <select
                id="department"
                name="department"
                className={`form-select ${errors.department ? 'has-error' : ''}`}
                value={formData.department}
                onChange={handleChange}
                disabled={!isAuthorized}
              >
                <option value="">Select Department...</option>
                <option value="Operations">Operations</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Finance & Accounting">Finance & Accounting</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Research & Development">Research & Development</option>
              </select>
              {errors.department && (
                <span className="error-hint" data-testid="department-error">
                  <AlertCircle size={13} /> {errors.department}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="category">
                Procurement Category <span className="req-star">*</span>
              </label>
              <select
                id="category"
                name="category"
                className={`form-select ${errors.category ? 'has-error' : ''}`}
                value={formData.category}
                onChange={handleChange}
                disabled={!isAuthorized}
              >
                <option value="">Select Category...</option>
                <option value="IT Hardware">IT Hardware & Accessories</option>
                <option value="Software & Subscriptions">Software & Cloud Licenses</option>
                <option value="Office Equipment">Office Equipment & Ergonomics</option>
                <option value="Professional Services">Professional Consulting</option>
              </select>
              {errors.category && (
                <span className="error-hint" data-testid="category-error">
                  <AlertCircle size={13} /> {errors.category}
                </span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="priority">
                Urgency / Priority <span className="req-star">*</span>
              </label>
              <select
                id="priority"
                name="priority"
                className="form-select"
                value={formData.priority}
                onChange={handleChange}
                disabled={!isAuthorized}
              >
                <option value="Low">Low - Routine stock</option>
                <option value="Medium">Medium - Standard need</option>
                <option value="High">High - Impending milestone</option>
                <option value="Urgent">Urgent - Outage blocker</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="currency">Currency</label>
              <select
                id="currency"
                name="currency"
                className="form-select"
                value={formData.currency}
                onChange={handleChange}
                disabled={!isAuthorized}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
        </div>
        <div className="section-divider">
          <div className="section-header-row">
            <span className="step-indicator">2</span>
            <h3>Requested Line Items</h3>
          </div>

          <LineItemsTable
            items={formData.items}
            onChange={handleItemsChange}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            currency={formData.currency}
            rowErrors={errors.itemRows}
            disabled={!isAuthorized}
          />
          {errors.items && (
            <span className="error-hint" style={{ marginTop: '0.5rem' }} data-testid="items-error">
              <AlertCircle size={13} /> {errors.items}
            </span>
          )}

          <div className="total-summary-card">
            <div className="total-summary-label">Estimated Total Amount</div>
            <div className="total-summary-value" data-testid="grand-total">
              ${grandTotal.toFixed(2)} <span style={{ fontSize: '0.9rem', color: 'var(--slate-500)' }}>{formData.currency}</span>
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div>
          <div className="section-header-row">
            <span className="step-indicator">3</span>
            <h3>Business Justification</h3>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="justification">
              Business Justification <span className="req-star">*</span>
            </label>
            <textarea
              id="justification"
              name="justification"
              rows={3}
              className={`form-textarea ${errors.justification ? 'has-error' : ''}`}
              placeholder="Explain why these items are required..."
              value={formData.justification}
              onChange={handleChange}
              disabled={!isAuthorized}
            />
            {errors.justification && (
              <span className="error-hint" data-testid="justification-error">
                <AlertCircle size={13} /> {errors.justification}
              </span>
            )}
          </div>
        </div>
        <div className="form-actions-bar">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleFillSample}
            disabled={!isAuthorized}
          >
            <Sparkles size={16} /> Fill Sample Data
          </button>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <span className="actions-help-text">
              <FileCheck size={14} /> Assigns unique ID and records timestamp
            </span>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={!isAuthorized || isSubmitting}
              data-testid="submit-requisition-btn"
            >
              <Send size={18} />
              {isSubmitting ? 'Submitting...' : 'Submit Requisition'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}