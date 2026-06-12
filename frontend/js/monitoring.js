const SERVICES = [
  { name: 'API Gateway', url: 'http://localhost:3000/health', port: 3000 },
  { name: 'Fraud Detection', url: 'http://localhost:8001/health', port: 8001 },
  { name: 'Currency Conversion', url: 'http://localhost:8002/health', port: 8002 },
  { name: 'Tax Calculation', url: 'http://localhost:8003/health', port: 8003 },
  { name: 'Notification', url: 'http://localhost:8004/health', port: 8004 },
  { name: 'Report Generation', url: 'http://localhost:8005/health', port: 8005 },
  { name: 'Analytics', url: 'http://localhost:8006/health', port: 8006 },
  { name: 'Recommendation', url: 'http://localhost:8007/health', port: 8007 },
  { name: 'Inventory Forecast', url: 'http://localhost:8008/health', port: 8008 },
  { name: 'Document Processing', url: 'http://localhost:8009/health', port: 8009 },
  { name: 'AI Scoring', url: 'http://localhost:8010/health', port: 8010 },
];

document.addEventListener('DOMContentLoaded', () => {
  checkAll();
  setInterval(checkAll, 15000);
  document.getElementById('refreshBtn')?.addEventListener('click', checkAll);
});

async function checkAll() {
  await Promise.allSettled([checkAPIHealth(), checkServices()]);
}

async function checkAPIHealth() {
  const start = Date.now();
  try {
    const res = await fetch('http://localhost:3000/health', { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    const ms = Date.now() - start;

    document.getElementById('apiStatusVal').textContent = data.data?.status === 'healthy' ? '✓ Healthy' : '⚠ Degraded';
    document.getElementById('apiStatus')?.classList.toggle('border-success', res.ok);
    document.getElementById('dbStatusVal').textContent = data.data?.checks?.database === 'ok' ? '✓ Connected' : '✗ Error';
    document.getElementById('responseTime').textContent = ms + ' ms';
  } catch {
    document.getElementById('apiStatusVal').textContent = '✗ Offline';
    document.getElementById('dbStatusVal').textContent = '—';
    document.getElementById('responseTime').textContent = '—';
  }
}

async function checkServices() {
  const results = await Promise.allSettled(
    SERVICES.map(s =>
      fetch(s.url, { signal: AbortSignal.timeout(3000) })
        .then(r => ({ ...s, ok: r.ok, status: r.status }))
        .catch(() => ({ ...s, ok: false, status: 0 }))
    )
  );

  const container = document.getElementById('servicesStatus');
  if (!container) return;

  container.innerHTML = results.map(r => {
    const svc = r.value;
    return `
      <div class="service-item">
        <span><span class="service-dot ${svc.ok ? 'online' : 'offline'}"></span>${svc.name}</span>
        <div style="display:flex;align-items:center;gap:.5rem">
          <small style="color:var(--text-muted)">:${svc.port}</small>
          <span class="badge badge-${svc.ok ? 'success' : 'danger'}">${svc.ok ? 'Online' : 'Offline'}</span>
        </div>
      </div>
    `;
  }).join('');

  const online = results.filter(r => r.value?.ok).length;
  document.getElementById('requestsPerSec').textContent = `${online}/${SERVICES.length} up`;
}
