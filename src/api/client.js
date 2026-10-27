export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch {
    throw new ApiError('Could not reach the server. Please check your connection and try again.', 0);
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    // Non-JSON body (e.g. a proxy error page) — fall through to the generic message.
  }

  if (!response.ok) {
    throw new ApiError(data?.error ?? 'Something went wrong. Please try again.', response.status, data?.fields);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  sendEnquiry: (body) => request('/enquiries', { method: 'POST', body: JSON.stringify(body) }),
  createBooking: (body) => request('/bookings', { method: 'POST', body: JSON.stringify(body) }),
};

// Owner-only calls for the admin panel; the session cookie is set by /admin/login.
const query = (params = {}) => {
  const search = new URLSearchParams(Object.entries(params).filter(([, value]) => value));
  return search.size ? `?${search}` : '';
};

export const adminApi = {
  me: () => request('/admin/me'),
  login: (password) => request('/admin/login', { method: 'POST', body: JSON.stringify({ password }) }),
  logout: () => request('/admin/logout', { method: 'POST' }),
  stats: () => request('/admin/stats'),
  submissions: (params) => request(`/admin/submissions${query(params)}`),
  update: (reference, body) => request(`/admin/submissions/${reference}`, { method: 'PATCH', body: JSON.stringify(body) }),
  activity: () => request('/admin/activity'),
  customers: (params) => request(`/admin/customers${query(params)}`),
  analytics: (days) => request(`/admin/analytics?days=${days}`),
  contentSchema: () => request('/admin/content-schema'),
  contentList: (collection) => request(`/admin/content/${collection}`),
  contentCreate: (collection, body) => request(`/admin/content/${collection}`, { method: 'POST', body: JSON.stringify(body) }),
  contentUpdate: (collection, key, body) => request(`/admin/content/${collection}/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify(body) }),
  contentDelete: (collection, key) => request(`/admin/content/${collection}/${encodeURIComponent(key)}`, { method: 'DELETE' }),
  exportUrl: (params) => `/api/admin/export.csv${query(params)}`,
};
