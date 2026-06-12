document.addEventListener('DOMContentLoaded', () => loadCustomers());

async function loadCustomers(page = 1) {
  const status = document.getElementById('statusFilter')?.value;
  const search = document.getElementById('searchInput')?.value;
  const params = { page, limit: 20 };
  if (status) params.status = status;
  if (search) params.search = search;

  try {
    const res = await NexusAPI.customers.list(params);
    const tbody = document.getElementById('customersTableBody');
    if (!res?.success || !res.data?.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No customers found</td></tr>';
      return;
    }
    tbody.innerHTML = res.data.map(c => `
      <tr>
        <td>${c.firstName} ${c.lastName}</td>
        <td>${c.email}</td>
        <td>${c.country || '—'}</td>
        <td><span class="status-${c.status}">${c.status}</span></td>
        <td>${formatDateShort(c.createdAt)}</td>
        <td><button class="btn btn-ghost btn-sm" onclick="viewCustomer('${c.id}')">View</button></td>
      </tr>
    `).join('');

    // Pagination
    const container = document.getElementById('pagination');
    if (res.meta && res.meta.totalPages > 1) {
      container.innerHTML = `<span style="color:var(--text-muted);font-size:.85rem">Page ${res.meta.page} of ${res.meta.totalPages} · ${res.meta.total} total</span>`;
    }
  } catch (err) {
    document.getElementById('customersTableBody').innerHTML = `<tr><td colspan="6" class="text-center">${err.error?.message || 'Failed to load'}</td></tr>`;
  }
}

function viewCustomer(id) { showToast(`Customer ${id.slice(0, 8)}...`); }

document.getElementById('applyFilters')?.addEventListener('click', () => loadCustomers(1));
