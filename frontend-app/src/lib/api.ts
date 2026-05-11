const API_BASE = '';

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiError extends Error {
  status: number;
  detail: string;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(endpoint: string, opts: ApiOptions = {}): Promise<T> {
  const token = localStorage.getItem('access_token');
  const headers: Record<string, string> = {
    ...opts.headers,
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (opts.body && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body instanceof FormData ? opts.body : opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
    throw new ApiError(res.status, 'No autorizado');
  }

  if (res.status === 402) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(402, data.detail || 'Payment Required');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data.detail || 'Error en la solicitud');
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

// ── Auth ──
export const auth = {
  login: (email: string, password: string) =>
    request<{ access_token: string; tenant_id: number; role: string; tenant_slug: string }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  register: (data: { barberName: string; barberEmail: string; barberPassword: string; barberWhatsapp: string; subscriptionProofUrl?: string }) =>
    request('/api/auth/register', { method: 'POST', body: data }),
};

// ── Tenant Admin ──
export const tenant = {
  get: (id: number) => request(`/api/tenant/${id}`),
  getPublic: (slug: string) => request(`/api/public/${slug}`),
  
  services: {
    list: (id: number) => request(`/api/tenant/${id}/services`),
    create: (id: number, data: unknown) => request(`/api/tenant/${id}/services`, { method: 'POST', body: data }),
    delete: (id: number, serviceId: number) => request(`/api/tenant/${id}/services/${serviceId}`, { method: 'DELETE' }),
  },

  appointments: {
    list: (id: number) => request(`/api/tenant/${id}/appointments`),
    updateStatus: (id: number, appointmentId: number, status: string) =>
      request(`/api/tenant/${id}/appointments/${appointmentId}/status`, { method: 'PUT', body: { status } }),
  },

  staff: {
    list: (id: number) => request(`/api/tenant/${id}/staff`),
    create: (id: number, data: unknown) => request(`/api/tenant/${id}/staff`, { method: 'POST', body: data }),
  },

  expenses: {
    list: (id: number) => request(`/api/tenant/${id}/expenses`),
    create: (id: number, data: unknown) => request(`/api/tenant/${id}/expenses`, { method: 'POST', body: data }),
  },

  settings: {
    update: (id: number, data: unknown) => request(`/api/tenant/${id}/settings`, { method: 'PUT', body: data }),
  },
};

// ── Public ──
export const publicApi = {
  tenant: (slug: string) => request(`/api/public/${slug}`),
  services: (slug: string) => request(`/api/public/${slug}/services`),
  staff: (slug: string) => request(`/api/public/${slug}/staff`),
  bookedTimes: (slug: string, date: string) => request(`/api/public/${slug}/booked-times?date=${date}`),
  createAppointment: (slug: string, data: unknown) =>
    request(`/api/public/${slug}/appointments`, { method: 'POST', body: data }),
};

// ── Super Admin ──
export const superAdmin = {
  tenants: () => request('/api/sinaptix-master-admin/tenants'),
  updateStatus: (id: number, data: unknown) =>
    request(`/api/sinaptix-master-admin/tenants/${id}/status`, { method: 'PUT', body: data }),
};

// ── Upload ──
export const upload = async (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return request<{ url: string }>('/api/upload', { method: 'POST', body: fd });
};

export { ApiError };
