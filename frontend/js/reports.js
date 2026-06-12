document.addEventListener('DOMContentLoaded', () => loadReports());

async function loadReports() {
  try {
    const res = await NexusAPI.reports.list();
    const tbody = document.getElementById('reportsTableBody');
    if (!res?.success || !res.data?.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No reports generated yet</td></tr>';
      return;
    }
    tbody.innerHTML = res.data.map(r => `
      <tr>
        <td>${r.type?.replace(/_/g, ' ')}</td>
        <td><span class="status-${r.status === 'COMPLETED' ? 'SUCCESS' : r.status === 'FAILED' ? 'FAILED' : 'PENDING'}">${r.status}</span></td>
        <td>${formatDateShort(r.startDate)} — ${formatDateShort(r.endDate)}</td>
        <td>${formatDate(r.createdAt)}</td>
        <td>${r.status === 'COMPLETED' ? `<button class="btn btn-secondary btn-sm">Download</button>` : '—'}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Reports error:', err);
  }
}

async function generateReport(type) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endDate = now.toISOString();
  try {
    const res = await NexusAPI.reports.generate({ type, startDate, endDate });
    if (res?.success) {
      showToast(`${type.replace(/_/g, ' ')} report queued`);
      loadReports();
    }
  } catch (err) {
    showToast(err.error?.message || 'Failed to generate report', 'error');
  }
}

window.generateReport = generateReport;
