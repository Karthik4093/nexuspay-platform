/**
 * NexusPay API Client
 * Handles all communication with the API Gateway
 */

const API_BASE =
  (window.NEXUSPAY_CONFIG && window.NEXUSPAY_CONFIG.API_URL) ||
  'http://localhost:3000/api/v1';

const NexusAPI = {
  _token: null,
  _refreshing: null,

  getToken() {
    if (!this._token) this._token = localStorage.getItem('nexus_token');
    return this._token;
  },

  setToken(token) {
    this._token = token;
    localStorage.setItem('nexus_token', token);
  },

  clearToken() {
    this._token = null;
    localStorage.removeItem('nexus_token');
    localStorage.removeItem('nexus_user');
    localStorage.removeItem('nexus_refresh');
  },

  async _tryRefresh() {
    if (this._refreshing) return this._refreshing;
    const refreshToken = localStorage.getItem('nexus_refresh');
    if (!refreshToken) return false;

    this._refreshing = (async () => {
      try {
        const resp = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!resp.ok) return false;
        const data = await resp.json();
        if (data.data?.accessToken) {
          this.setToken(data.data.accessToken);
          if (data.data.refreshToken) {
            localStorage.setItem('nexus_refresh', data.data.refreshToken);
          }
          return true;
        }
        return false;
      } catch {
        return false;
      } finally {
        this._refreshing = null;
      }
    })();

    return this._refreshing;
  },

  async request(method, path, body = null, options = {}) {
    const correlationId = 'req_' + Math.random().toString(36).slice(2, 22);
    const headers = {
      'X-Correlation-ID': correlationId,
    };

    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body && method !== 'GET') {
      headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${API_BASE}${path}`, config);
      const data = await response.json();

      if (response.status === 401 && !options.noRedirect && !options._retry) {
        const refreshed = await this._tryRefresh();
        if (refreshed) {
          return this.request(method, path, body, { ...options, _retry: true });
        }
        this.clearToken();
        window.location.href = '../index.html';
        return null;
      }

      if (!response.ok) {
        throw { status: response.status, ...data };
      }

      return data;
    } catch (err) {
      if (err.status) throw err;
      throw { status: 0, error: { code: 'NETWORK_ERROR', message: 'Network error. Is the API server running?' } };
    }
  },

  // Auth
  auth: {
    login: (email, password) => NexusAPI.request('POST', '/auth/login', { email, password }, { noRedirect: true }),
    logout: () => NexusAPI.request('POST', '/auth/logout'),
    me: () => NexusAPI.request('GET', '/auth/me'),
    refresh: (refreshToken) => NexusAPI.request('POST', '/auth/refresh', { refreshToken }, { noRedirect: true }),
  },

  // Payments
  payments: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return NexusAPI.request('GET', `/payments${q ? '?' + q : ''}`);
    },
    get: (id) => NexusAPI.request('GET', `/payments/${id}`),
    create: (data) => NexusAPI.request('POST', '/payments', data),
    cancel: (id, reason) => NexusAPI.request('POST', `/payments/${id}/cancel`, { reason }),
    stats: () => NexusAPI.request('GET', '/payments/stats'),
  },

  // Merchants
  merchants: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return NexusAPI.request('GET', `/merchants${q ? '?' + q : ''}`);
    },
    get: (id) => NexusAPI.request('GET', `/merchants/${id}`),
    create: (data) => NexusAPI.request('POST', '/merchants', data),
    update: (id, data) => NexusAPI.request('PATCH', `/merchants/${id}`, data),
    activate: (id) => NexusAPI.request('POST', `/merchants/${id}/activate`),
    suspend: (id) => NexusAPI.request('POST', `/merchants/${id}/suspend`),
    rotateKeys: (id) => NexusAPI.request('POST', `/merchants/${id}/rotate-keys`),
    delete: (id) => NexusAPI.request('DELETE', `/merchants/${id}`),
  },

  // Customers
  customers: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return NexusAPI.request('GET', `/customers${q ? '?' + q : ''}`);
    },
    get: (id) => NexusAPI.request('GET', `/customers/${id}`),
    create: (merchantId, data) => NexusAPI.request('POST', `/merchants/${merchantId}/customers`, data),
    update: (id, data) => NexusAPI.request('PATCH', `/customers/${id}`, data),
    delete: (id) => NexusAPI.request('DELETE', `/customers/${id}`),
  },

  // Reports
  reports: {
    list: () => NexusAPI.request('GET', '/reports'),
    generate: (data) => NexusAPI.request('POST', '/reports', data),
  },

  // Audit
  audit: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return NexusAPI.request('GET', `/audit-logs${q ? '?' + q : ''}`);
    },
  },

  // Refunds
  refunds: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return NexusAPI.request('GET', `/refunds${q ? '?' + q : ''}`);
    },
    create: (data) => NexusAPI.request('POST', '/refunds', data),
  },

  // Notifications
  notifications: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return NexusAPI.request('GET', `/notifications${q ? '?' + q : ''}`);
    },
  },
};

// Utilities
function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(dateStr));
}

function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'short' }).format(new Date(dateStr));
}

function truncate(str, n = 8) {
  if (!str) return '—';
  return str.slice(0, n) + '...';
}

function showToast(message, type = 'success') {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;padding:.75rem 1.25rem;background:${type === 'success' ? '#10b981' : '#ef4444'};color:white;border-radius:8px;z-index:1000;font-size:.9rem;box-shadow:0 4px 12px rgba(0,0,0,.3);transition:opacity .3s;`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

window.NexusAPI = NexusAPI;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatDateShort = formatDateShort;
window.truncate = truncate;
window.showToast = showToast;
