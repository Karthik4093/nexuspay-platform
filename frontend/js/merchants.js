const _user = JSON.parse(localStorage.getItem('nexus_user') || '{}');
const _isAdmin    = _user.role === 'ADMIN';
const _isMerchant = _user.role === 'MERCHANT';

document.addEventListener('DOMContentLoaded', () => {
  // Hide "New Merchant" for non-admin (only ADMIN can create merchants)
  if (!_isAdmin) {
    const btn = document.getElementById('createMerchantBtn');
    if (btn) btn.style.display = 'none';
  }

  if (_isMerchant) {
    loadOwnMerchant();
  } else if (_isAdmin) {
    loadMerchants();
    initModal();
  } else {
    // SUPPORT role has no merchant access
    document.getElementById('merchantsGrid').innerHTML =
      '<div class="loading-placeholder">Your role does not have access to merchant management.</div>';
  }
});

// ── Admin: list all merchants ─────────────────────────────────────────────

async function loadMerchants(page = 1) {
  const status = document.getElementById('statusFilter')?.value;
  const search = document.getElementById('searchInput')?.value;
  const params = { page, limit: 12 };
  if (status) params.status = status;
  if (search)  params.search = search;

  try {
    const res = await NexusAPI.merchants.list(params);
    const grid = document.getElementById('merchantsGrid');
    if (!res?.success || !res.data?.length) {
      grid.innerHTML = '<div class="loading-placeholder">No merchants found</div>';
      return;
    }
    grid.innerHTML = res.data.map(m => merchantCard(m)).join('');
    renderPagination(res.meta, loadMerchants);
  } catch (err) {
    document.getElementById('merchantsGrid').innerHTML =
      `<div class="loading-placeholder">${err.error?.message || 'Failed to load'}</div>`;
  }
}

// ── Merchant role: own merchant only ─────────────────────────────────────

async function loadOwnMerchant() {
  const grid = document.getElementById('merchantsGrid');
  if (!_user.merchantId) {
    grid.innerHTML = '<div class="loading-placeholder">No merchant account linked to your user.</div>';
    return;
  }
  try {
    const res = await NexusAPI.merchants.get(_user.merchantId);
    if (!res?.success) {
      grid.innerHTML = '<div class="loading-placeholder">Merchant not found.</div>';
      return;
    }
    grid.innerHTML = merchantCard(res.data);
    initModal(); // merchant can edit own record
  } catch (err) {
    grid.innerHTML = `<div class="loading-placeholder">${err.error?.message || 'Failed to load'}</div>`;
  }
}

// ── Card HTML ─────────────────────────────────────────────────────────────

function merchantCard(m) {
  return `
    <div class="merchant-card">
      <h4>${m.name}</h4>
      <div class="meta">${m.email}<br/>${m.country} · ${m.currency}</div>
      <span class="status-${m.status}">${m.status}</span>
      <div class="actions" style="margin-top:.75rem;display:flex;gap:.5rem;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" onclick="openEditModal('${m.id}')">Edit</button>
        ${_isAdmin && m.status === 'PENDING'   ? `<button class="btn btn-secondary btn-sm" onclick="activateMerchant('${m.id}')">Activate</button>` : ''}
        ${_isAdmin && m.status === 'ACTIVE'    ? `<button class="btn btn-danger btn-sm"    onclick="suspendMerchant('${m.id}')">Suspend</button>` : ''}
        ${_isAdmin && m.status === 'SUSPENDED' ? `<button class="btn btn-secondary btn-sm" onclick="activateMerchant('${m.id}')">Reactivate</button>` : ''}
      </div>
    </div>
  `;
}

// ── Modal ────────────────────────────────────────────────────────────────

let _editingId = null;

function initModal() {
  document.getElementById('createMerchantBtn')?.addEventListener('click', openCreateModal);
  document.getElementById('modalCancelBtn')?.addEventListener('click', closeModal);
  document.getElementById('merchantModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('merchantModal')) closeModal();
  });
  document.getElementById('merchantForm')?.addEventListener('submit', handleSubmit);
}

function openCreateModal() {
  _editingId = null;
  document.getElementById('modalTitle').textContent = 'New Merchant';
  document.getElementById('modalSubmitBtn').textContent = 'Create Merchant';
  clearForm();
  showModal();
}

async function openEditModal(id) {
  try {
    const res = await NexusAPI.merchants.get(id);
    if (!res?.success) return;
    const m = res.data;
    _editingId = id;
    document.getElementById('modalTitle').textContent = 'Edit Merchant';
    document.getElementById('modalSubmitBtn').textContent = 'Save Changes';
    document.getElementById('mName').value         = m.name         || '';
    document.getElementById('mEmail').value        = m.email        || '';
    document.getElementById('mCountry').value      = m.country      || 'US';
    document.getElementById('mCurrency').value     = m.currency     || 'USD';
    document.getElementById('mPhone').value        = m.phone        || '';
    document.getElementById('mWebsite').value      = m.website      || '';
    document.getElementById('mBusinessType').value = m.businessType || '';
    document.getElementById('mWebhookUrl').value   = m.webhookUrl   || '';
    showModal();
  } catch (err) {
    showToast(err.error?.message || 'Failed to load merchant', 'error');
  }
}

function showModal() {
  document.getElementById('merchantModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('merchantModal').style.display = 'none';
  _editingId = null;
  clearForm();
}

function clearForm() {
  ['mName','mEmail','mPhone','mWebsite','mBusinessType','mWebhookUrl'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('mCountry').value  = 'US';
  document.getElementById('mCurrency').value = 'USD';
}

async function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('modalSubmitBtn');
  btn.disabled = true;
  btn.textContent = _editingId ? 'Saving...' : 'Creating...';

  const payload = {
    name:     document.getElementById('mName').value.trim(),
    email:    document.getElementById('mEmail').value.trim(),
    country:  document.getElementById('mCountry').value.trim().toUpperCase()  || 'US',
    currency: document.getElementById('mCurrency').value.trim().toUpperCase() || 'USD',
  };
  const phone      = document.getElementById('mPhone').value.trim();
  const website    = document.getElementById('mWebsite').value.trim();
  const bizType    = document.getElementById('mBusinessType').value.trim();
  const webhookUrl = document.getElementById('mWebhookUrl').value.trim();
  if (phone)      payload.phone        = phone;
  if (website)    payload.website      = website;
  if (bizType)    payload.businessType = bizType;
  if (webhookUrl) payload.webhookUrl   = webhookUrl;

  try {
    if (_editingId) {
      await NexusAPI.merchants.update(_editingId, payload);
      showToast('Merchant updated');
    } else {
      await NexusAPI.merchants.create(payload);
      showToast('Merchant created');
    }
    closeModal();
    _isAdmin ? loadMerchants() : loadOwnMerchant();
  } catch (err) {
    showToast(err.error?.message || 'Operation failed', 'error');
    btn.disabled = false;
    btn.textContent = _editingId ? 'Save Changes' : 'Create Merchant';
  }
}

// ── Admin actions ─────────────────────────────────────────────────────────

async function activateMerchant(id) {
  try {
    await NexusAPI.merchants.activate(id);
    showToast('Merchant activated');
    loadMerchants();
  } catch (err) {
    showToast(err.error?.message || 'Failed to activate', 'error');
  }
}

async function suspendMerchant(id) {
  if (!confirm('Suspend this merchant?')) return;
  try {
    await NexusAPI.merchants.suspend(id);
    showToast('Merchant suspended');
    loadMerchants();
  } catch (err) {
    showToast(err.error?.message || 'Failed to suspend', 'error');
  }
}

// ── Pagination ────────────────────────────────────────────────────────────

function renderPagination(meta, loadFn) {
  const container = document.getElementById('pagination');
  if (!container || !meta || meta.totalPages <= 1) return;
  let html = '';
  for (let i = 1; i <= meta.totalPages; i++) {
    html += `<button class="page-btn ${i === meta.page ? 'active' : ''}" onclick="(${loadFn.name})(${i})">${i}</button>`;
  }
  container.innerHTML = html;
}

document.getElementById('applyFilters')?.addEventListener('click', () => {
  if (_isAdmin) loadMerchants(1);
});
