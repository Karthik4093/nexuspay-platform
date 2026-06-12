/**
 * Payments page JavaScript
 */

let currentPage = 1;
const limit = 20;

document.addEventListener('DOMContentLoaded', () => {
  loadPayments();
  setupModal();
  setupFilters();
});

async function loadPayments(page = 1) {
  currentPage = page;
  const status = document.getElementById('statusFilter')?.value;
  const startDate = document.getElementById('startDate')?.value;
  const endDate = document.getElementById('endDate')?.value;

  const params = { page, limit };
  if (status) params.status = status;
  if (startDate) params.startDate = new Date(startDate).toISOString();
  if (endDate) params.endDate = new Date(endDate + 'T23:59:59').toISOString();

  try {
    const res = await NexusAPI.payments.list(params);
    if (!res?.success) return;
    renderPayments(res.data);
    renderPagination(res.meta);
  } catch (err) {
    document.getElementById('paymentsTableBody').innerHTML =
      `<tr><td colspan="8" class="text-center text-muted">${err.error?.message || 'Failed to load payments'}</td></tr>`;
  }
}

function renderPayments(payments) {
  const tbody = document.getElementById('paymentsTableBody');
  if (!payments?.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No payments found</td></tr>';
    return;
  }

  tbody.innerHTML = payments.map(p => `
    <tr>
      <td><code title="${p.id}">${p.id.slice(0, 8)}...</code></td>
      <td>${formatCurrency(p.amount, p.currency)}</td>
      <td>${p.currency}</td>
      <td><span class="status-${p.status}">${p.status}</span></td>
      <td>${p.paymentMethod?.replace(/_/g, ' ')}</td>
      <td>${truncate(p.merchantId, 8)}</td>
      <td>${formatDate(p.createdAt)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="viewPayment('${p.id}')">View</button>
        ${p.status === 'PENDING' ? `<button class="btn btn-danger btn-sm" onclick="cancelPayment('${p.id}')">Cancel</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function renderPagination(meta) {
  const container = document.getElementById('pagination');
  if (!meta || meta.totalPages <= 1) { container.innerHTML = ''; return; }

  let html = `<button class="page-btn" onclick="loadPayments(${meta.page - 1})" ${meta.page <= 1 ? 'disabled' : ''}>‹</button>`;
  for (let i = 1; i <= meta.totalPages; i++) {
    if (Math.abs(i - meta.page) <= 2 || i === 1 || i === meta.totalPages) {
      html += `<button class="page-btn ${i === meta.page ? 'active' : ''}" onclick="loadPayments(${i})">${i}</button>`;
    } else if (Math.abs(i - meta.page) === 3) {
      html += `<span style="padding:0 .5rem;color:var(--text-muted)">...</span>`;
    }
  }
  html += `<button class="page-btn" onclick="loadPayments(${meta.page + 1})" ${meta.page >= meta.totalPages ? 'disabled' : ''}>›</button>`;
  container.innerHTML = html;
}

function setupFilters() {
  document.getElementById('applyFilters')?.addEventListener('click', () => loadPayments(1));
  document.getElementById('resetFilters')?.addEventListener('click', () => {
    document.getElementById('statusFilter').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    loadPayments(1);
  });
}

function setupModal() {
  document.getElementById('createPaymentBtn')?.addEventListener('click', () => {
    document.getElementById('createPaymentModal')?.classList.remove('hidden');
  });
  document.getElementById('closeModal')?.addEventListener('click', () => {
    document.getElementById('createPaymentModal')?.classList.add('hidden');
  });

  document.getElementById('createPaymentForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('payAmount').value);
    const currency = document.getElementById('payCurrency').value;
    const paymentMethod = document.getElementById('payMethod').value;
    const description = document.getElementById('payDescription').value;
    const idempotencyKey = 'idem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);

    try {
      const res = await NexusAPI.payments.create({ amount, currency, paymentMethod, description, idempotencyKey });
      if (res?.success) {
        showToast('Payment created successfully!');
        document.getElementById('createPaymentModal').classList.add('hidden');
        document.getElementById('createPaymentForm').reset();
        loadPayments(1);
      }
    } catch (err) {
      showToast(err.error?.message || 'Failed to create payment', 'error');
    }
  });
}

async function viewPayment(id) {
  showToast(`Payment ${id.slice(0, 8)}... selected`);
}

async function cancelPayment(id) {
  if (!confirm('Cancel this payment?')) return;
  try {
    await NexusAPI.payments.cancel(id, 'Cancelled by user');
    showToast('Payment cancelled');
    loadPayments(currentPage);
  } catch (err) {
    showToast(err.error?.message || 'Failed to cancel', 'error');
  }
}
