document.addEventListener('DOMContentLoaded', () => loadMerchants());

async function loadMerchants(page = 1) {
  const status = document.getElementById('statusFilter')?.value;
  const search = document.getElementById('searchInput')?.value;
  const params = { page, limit: 12 };
  if (status) params.status = status;
  if (search) params.search = search;

  try {
    const res = await NexusAPI.merchants.list(params);
    const grid = document.getElementById('merchantsGrid');
    if (!res?.success || !res.data?.length) {
      grid.innerHTML = '<div class="loading-placeholder">No merchants found</div>';
      return;
    }
    grid.innerHTML = res.data.map(m => `
      <div class="merchant-card">
        <h4>${m.name}</h4>
        <div class="meta">${m.email}<br/>${m.country} · ${m.currency}</div>
        <span class="status-${m.status}">${m.status}</span>
        <div class="actions" style="margin-top:.75rem">
          ${m.status === 'PENDING' ? `<button class="btn btn-secondary btn-sm" onclick="activateMerchant('${m.id}')">Activate</button>` : ''}
          ${m.status === 'ACTIVE' ? `<button class="btn btn-danger btn-sm" onclick="suspendMerchant('${m.id}')">Suspend</button>` : ''}
        </div>
      </div>
    `).join('');
    renderPagination(res.meta, loadMerchants);
  } catch (err) {
    document.getElementById('merchantsGrid').innerHTML = `<div class="loading-placeholder">${err.error?.message || 'Failed to load'}</div>`;
  }
}

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

function renderPagination(meta, loadFn) {
  const container = document.getElementById('pagination');
  if (!container || !meta || meta.totalPages <= 1) return;
  let html = '';
  for (let i = 1; i <= meta.totalPages; i++) {
    html += `<button class="page-btn ${i === meta.page ? 'active' : ''}" onclick="(${loadFn.name})(${i})">${i}</button>`;
  }
  container.innerHTML = html;
}

document.getElementById('applyFilters')?.addEventListener('click', () => loadMerchants(1));
