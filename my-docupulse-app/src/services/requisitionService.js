const STORAGE_KEY = 'docupulse_requisitions';

export function generateRequisitionId(existingList = []) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const existingIds = new Set(existingList.map((r) => r.requisitionId));
  let requisitionId = '';
  let attempts = 0;

  do {
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    requisitionId = `REQ-${dateStr}-${randomChars.padEnd(4, 'X')}`;
    attempts++;
    if (attempts > 50) {
      const timeHex = Date.now().toString(16).slice(-4).toUpperCase();
      requisitionId = `REQ-${dateStr}-${timeHex}`;
      break;
    }
  } while (existingIds.has(requisitionId));

  return requisitionId;
}

export function validateRequisitionInput(formData) {
  const errors = {};

  if (!formData.title || !formData.title.trim()) {
    errors.title = 'Requisition Title is required.';
  }

  if (!formData.department || !formData.department.trim()) {
    errors.department = 'Requesting Department is required.';
  }

  if (!formData.category || !formData.category.trim()) {
    errors.category = 'Category is required.';
  }

  const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
  if (!formData.priority || !validPriorities.includes(formData.priority)) {
    errors.priority = 'Priority is required.';
  }

  if (!formData.justification || formData.justification.trim().length < 5) {
    errors.justification = 'Business Justification is required (at least 5 characters).';
  }

  if (!Array.isArray(formData.items) || formData.items.length === 0) {
    errors.items = 'At least one line item is required.';
  } else {
    const itemErrors = [];
    formData.items.forEach((item, index) => {
      const fieldErrors = {};
      if (!item.description || !item.description.trim()) {
        fieldErrors.description = 'Description is required.';
      }
      const qty = Number(item.quantity);
      if (isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
        fieldErrors.quantity = 'Quantity must be a positive integer.';
      }
      const price = Number(item.unitPrice);
      if (isNaN(price) || price < 0) {
        fieldErrors.unitPrice = 'Unit price must be >= 0.';
      }
      if (Object.keys(fieldErrors).length > 0) {
        itemErrors[index] = fieldErrors;
      }
    });

    if (itemErrors.length > 0) {
      errors.itemRows = itemErrors;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

export function getStoredRequisitions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function clearStoredRequisitions() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function submitRequisition(formData, requestor) {
  if (!requestor || !requestor.authorized) {
    throw new Error('Unauthorized: You must be an authorized requestor logged into DocuPulse.');
  }

  const validation = validateRequisitionInput(formData);
  if (!validation.isValid) {
    const error = new Error('Form validation failed');
    error.errors = validation.errors;
    throw error;
  }

  const existingList = getStoredRequisitions();
  const requisitionId = generateRequisitionId(existingList);
  const submissionDate = new Date();
  const submissionTimestamp = submissionDate.toISOString();
  const formattedTimestamp = submissionDate.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  });

  let totalAmount = 0;
  const processedItems = formData.items.map((item, idx) => {
    const qty = parseInt(item.quantity, 10);
    const unitPrice = parseFloat(item.unitPrice);
    const lineTotal = +(qty * unitPrice).toFixed(2);
    totalAmount += lineTotal;
    return {
      lineNumber: idx + 1,
      description: item.description.trim(),
      quantity: qty,
      unitPrice: unitPrice,
      lineTotal: lineTotal
    };
  });

  const requisitionRecord = {
    requisitionId,
    title: formData.title.trim(),
    department: formData.department.trim(),
    category: formData.category.trim(),
    priority: formData.priority,
    justification: formData.justification.trim(),
    currency: formData.currency || 'USD',
    items: processedItems,
    totalAmount: +(totalAmount.toFixed(2)),
    status: 'Submitted',
    submittedAt: submissionTimestamp,
    submittedAtFormatted: formattedTimestamp,
    requestor: {
      id: requestor.id,
      name: requestor.name,
      email: requestor.email,
      department: requestor.department,
      role: requestor.role
    }
  };

  const updatedList = [requisitionRecord, ...existingList];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  const confirmationMessage = `Requisition ${requisitionId} has been successfully submitted and logged into DocuPulse.`;

  return {
    success: true,
    message: confirmationMessage,
    requisition: requisitionRecord
  };
}