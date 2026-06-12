/**
 * Dashboard page JavaScript
 */

document.addEventListener('DOMContentLoaded', async () => {
  updateClock();
  setInterval(updateClock, 1000);
  await loadDashboardData();
  setInterval(loadDashboardData, 30000);
});

function updateClock() {
  const el = document.getElementById('currentTime');
  if (el) el.textContent = new Date().toLocaleTimeString();
}

async function loadDashboardData() {
  await Promise.allSettled([
    loadPaymentStats(),
    loadRecentPayments(),
    loadServiceHealth(),
  ]);
}

async function loadPaymentStats() {
  try {
    const res = await NexusAPI.payments.stats();
    if (!res?.success) return;

    const stats = res.data;
    const successItem = stats.byStatus?.find(s => s.status === 'SUCCESS');
    const failedItem = stats.byStatus?.find(s => s.status === 'FAILED');

    const totalRevenue = stats.byStatus?.reduce((sum, s) => {
      if (s.status === 'SUCCESS') return sum + Number(s._sum?.amount || 0);
      return sum;
    }, 0) || 0;

    setStatValue('totalRevenue', formatCurrency(totalRevenue));
    setStatValue('totalPayments', stats.total?.toLocaleString() || '0');

    const successCount = successItem?._count?.status || 0;
    const rate = stats.total > 0 ? ((successCount / stats.total) * 100).toFixed(1) : '0.0';
    setStatValue('successRate', rate + '%');
    setStatValue('activeCustomers', '—');

    // Status breakdown
    renderStatusBreakdown(stats.byStatus || []);
  } catch (err) {
    console.error('Stats error:', err);
  }
}

function setStatValue(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
    el.closest('.stat-card')?.classList.remove('loading');
  }
}

async function loadRecentPayments() {
  try {
    const res = await NexusAPI.payments.list({ limit: 5, page: 1 });
    const tbody = document.getElementById('recentPaymentsBody');
    if (!tbody) return;

    if (!res?.success || !res.data?.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No payments found</td></tr>';
      return;
    }

    tbody.innerHTML = res.data.map(p => `
      <tr>
        <td><code>${truncate(p.id, 8)}</code></td>
        <td>${formatCurrency(p.amount, p.currency)}</td>
        <td><span class="status-${p.status}">${p.status}</span></td>
        <td>${p.paymentMethod?.replace('_', ' ')}</td>
        <td>${formatDateShort(p.createdAt)}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Payments error:', err);
  }
}

function renderStatusBreakdown(byStatus) {
  const container = document.getElementById('statusBreakdown');
  if (!container || !byStatus.length) return;

  const total = byStatus.reduce((s, i) => s + (i._count?.status || 0), 0);
  const colorMap = { SUCCESS: 'fill-success', PENDING: 'fill-pending', FAILED: 'fill-failed', PROCESSING: 'fill-pending', REFUNDED: 'fill-success', CANCELLED: 'fill-failed' };

  container.innerHTML = byStatus.map(item => {
    const count = item._count?.status || 0;
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    const cls = colorMap[item.status] || 'fill-pending';
    return `
      <div class="status-bar-item">
        <div class="status-bar-label">
          <span><span class="status-${item.status}">${item.status}</span></span>
          <span>${count} (${pct}%)</span>
        </div>
        <div class="status-bar"><div class="status-bar-fill ${cls}" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join('');
}

async function loadServiceHealth() {
  const services = [
    { name: 'API Gateway', url: 'http://localhost:3000/health' },
    { name: 'Fraud Detection', url: 'http://localhost:8001/health' },
    { name: 'Currency Service', url: 'http://localhost:8002/health' },
    { name: 'Tax Service', url: 'http://localhost:8003/health' },
    { name: 'Notification', url: 'http://localhost:8004/health' },
  ];

  const container = document.getElementById('serviceHealth');
  if (!container) return;

  const results = await Promise.allSettled(
    services.map(s => fetch(s.url, { signal: AbortSignal.timeout(3000) }).then(r => ({ ...s, ok: r.ok })).catch(() => ({ ...s, ok: false })))
  );

  container.innerHTML = results.map(r => {
    const svc = r.value;
    return `
      <div class="service-item">
        <span><span class="service-dot ${svc.ok ? 'online' : 'offline'}"></span>${svc.name}</span>
        <span class="badge badge-${svc.ok ? 'success' : 'danger'}">${svc.ok ? 'Online' : 'Offline'}</span>
      </div>
    `;
  }).join('');
}
