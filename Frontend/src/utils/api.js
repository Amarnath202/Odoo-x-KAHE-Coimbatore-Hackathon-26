/**
 * Central API client for Shiv Furniture Works ERP
 * Attaches JWT Bearer token, handles 401 refresh, and normalises errors.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// ─── Token storage (in-memory + localStorage fallback) ────────────────────────
let _accessToken = null;

export function setToken(token) {
  _accessToken = token;
  if (token) localStorage.setItem('erp_access_token', token);
  else localStorage.removeItem('erp_access_token');
}

export function getToken() {
  if (_accessToken) return _accessToken;
  _accessToken = localStorage.getItem('erp_access_token');
  return _accessToken;
}

// ─── Token refresh concurrency ──────────────────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// ─── Core fetch wrapper ────────────────────────────────────────────────────────
async function request(path, options = {}) {
  let token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include', // send cookies for refresh token
  });

  // Handle 401 Unauthorized (Token Expired)
  if (response.status === 401 && !options._retry && path !== '/auth/login' && path !== '/auth/refresh') {
    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshSubscribers.push((newToken) => {
          options.headers = options.headers || {};
          options.headers['Authorization'] = `Bearer ${newToken}`;
          resolve(request(path, { ...options, _retry: true }));
        });
      });
    }

    options._retry = true;
    isRefreshing = true;

    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      const refreshData = await refreshRes.json();

      if (!refreshRes.ok) throw new Error('Session expired');

      const newToken = refreshData.data?.accessToken || refreshData.accessToken;
      setToken(newToken);
      isRefreshing = false;
      onRefreshed(newToken);

      // Retry original request
      options.headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: options.headers,
        credentials: 'include',
      });
    } catch (err) {
      isRefreshing = false;
      setToken(null);
      localStorage.removeItem('erp_user');
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }
  }

  // Try to parse JSON regardless of status
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    let message = data?.message || data?.error || `HTTP ${response.status}`;
    if (data?.errors && Array.isArray(data.errors)) {
      const detailMessages = data.errors.map(d => `${d.field ? d.field + ': ' : ''}${d.message}`).join(' | ');
      if (detailMessages) message += ` (${detailMessages})`;
    }
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ─── Convenience methods ───────────────────────────────────────────────────────
export const api = {
  get: (path, params) => {
    const url = params
      ? `${path}?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString()}`
      : path;
    return request(url, { method: 'GET' });
  },

  post: (path, body) =>
    request(path, { method: 'POST', body: JSON.stringify(body) }),

  put: (path, body) =>
    request(path, { method: 'PUT', body: JSON.stringify(body) }),

  patch: (path, body) =>
    request(path, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: (path) =>
    request(path, { method: 'DELETE' }),

  download: async (path, params) => {
    let token = getToken();
    const url = params
      ? `${path}?${new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')).toString()}`
      : path;

    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    // Try to get filename from content-disposition
    const disposition = response.headers.get('Content-Disposition');
    let filename = 'download.xlsx';
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
      if (matches != null && matches[1]) {
        filename = matches[1].replace(/['"]/g, '');
      }
    }

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};

// ─── Auth helpers ──────────────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  logout: () =>
    api.post('/auth/logout', {}),

  refresh: () =>
    api.post('/auth/refresh', {}),
};

// ─── Products ──────────────────────────────────────────────────────────────────
export const productsApi = {
  list: (params) => api.get('/products', params),
  getById: (id) => api.get(`/products/${id}`),
  create: (body) => api.post('/products', body),
  update: (id, body) => api.put(`/products/${id}`, body),
  delete: (id) => api.delete(`/products/${id}`),
  export: (params) => api.download('/products/export', params),
};

// ─── BOM ───────────────────────────────────────────────────────────────────────
export const bomsApi = {
  list: (params) => api.get('/boms', params),
  getById: (id) => api.get(`/boms/${id}`),
  create: (body) => api.post('/boms', body),
  update: (id, body) => api.put(`/boms/${id}`, body),
  delete: (id) => api.delete(`/boms/${id}`),
};

// ─── Sales ─────────────────────────────────────────────────────────────────────
export const customersApi = {
  list: (params) => api.get('/customers', params),
  create: (body) => api.post('/customers', body),
  update: (id, body) => api.put(`/customers/${id}`, body),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const salesApi = {
  list: (params) => api.get('/sales-orders', params),
  getById: (id) => api.get(`/sales-orders/${id}`),
  create: (body) => api.post('/sales-orders', body),
  confirm: (id, body) => api.post(`/sales-orders/${id}/confirm`, body),
  deliver: (id, body) => api.post(`/sales-orders/${id}/deliver`, body),
  cancel: (id, body) => api.post(`/sales-orders/${id}/cancel`, body || {}),
  delete: (id) => api.delete(`/sales-orders/${id}`),
  export: (params) => api.download('/sales-orders/export', params),
};

// ─── Purchase ──────────────────────────────────────────────────────────────────
export const vendorsApi = {
  list: (params) => api.get('/vendors', params),
  create: (body) => api.post('/vendors', body),
  update: (id, body) => api.put(`/vendors/${id}`, body),
  delete: (id) => api.delete(`/vendors/${id}`),
};

export const purchaseApi = {
  list: (params) => api.get('/purchase-orders', params),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  create: (body) => api.post('/purchase-orders', body),
  confirm: (id) => api.post(`/purchase-orders/${id}/confirm`, {}),
  receive: (id, body) => api.post(`/purchase-orders/${id}/receive`, body),
  delete: (id) => api.delete(`/purchase-orders/${id}`),
  export: (params) => api.download('/purchase-orders/export', params),
};

// ─── Manufacturing ─────────────────────────────────────────────────────────────
export const manufacturingApi = {
  list: (params) => api.get('/manufacturing-orders', params),
  getById: (id) => api.get(`/manufacturing-orders/${id}`),
  create: (body) => api.post('/manufacturing-orders', body),
  confirm: (id) => api.post(`/manufacturing-orders/${id}/confirm`, {}),
  checkAvailability: (id) => api.post(`/manufacturing-orders/${id}/check-availability`, {}),
  start: (id) => api.post(`/manufacturing-orders/${id}/start`, {}),
  complete: (id) => api.post(`/manufacturing-orders/${id}/complete`, {}),
  delete: (id) => api.delete(`/manufacturing-orders/${id}`),
};

// ─── Inventory ─────────────────────────────────────────────────────────────────
export const inventoryApi = {
  list: (params) => api.get('/inventory', params),
  adjust: (body) => api.post('/inventory/adjust', body),
  export: (params) => api.download('/inventory/export', params),
};

// ─── Stock Ledger ──────────────────────────────────────────────────────────────
export const stockLedgerApi = {
  list: (params) => api.get('/stock-ledger', params),
};

// ─── Audit Logs ────────────────────────────────────────────────────────────────
export const auditLogsApi = {
  list: (params) => api.get('/audit-logs', params),
  export: (params) => api.download('/audit-logs/export', params),
};

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  summary: (params) => api.get('/dashboard/summary', params),
  sales: (params) => api.get('/dashboard/sales', params),
  purchase: (params) => api.get('/dashboard/purchase', params),
  manufacturing: (params) => api.get('/dashboard/manufacturing', params),
  inventory: (params) => api.get('/dashboard/inventory', params),
};

// ─── Warehouses ────────────────────────────────────────────────────────────────
export const warehousesApi = {
  list: (params) => api.get('/warehouses', params),
};

// ─── Units ─────────────────────────────────────────────────────────────────────
export const unitsApi = {
  list: (params) => api.get('/units', params),
};

// ─── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params) => api.get('/users', params),
  getById: (id) => api.get(`/users/${id}`),
  create: (body) => api.post('/users', body),
  update: (id, body) => api.put(`/users/${id}`, body),
  delete: (id) => api.delete(`/users/${id}`),
};

// ─── Password Change ───────────────────────────────────────────────────────────
export const passwordChangeApi = {
  request: (body) => api.post('/password-change/request', body),
  myRequests: () => api.get('/password-change/my-requests'),
  reset: (body) => api.post('/password-change/reset', body),
  adminGetAll: () => api.get('/admin/password-change-requests'),
  adminApprove: (id) => api.put(`/admin/password-change-requests/${id}/approve`, {}),
  adminReject: (id) => api.put(`/admin/password-change-requests/${id}/reject`, {}),
};
