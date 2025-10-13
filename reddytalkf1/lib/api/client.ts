// API Client for ReddyTalk.ai

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface RequestOptions extends RequestInit {
  token?: string;
}

class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new APIError(
      response.status,
      response.statusText,
      errorData.message || 'An error occurred'
    );
  }

  return response.json();
}

// API Methods
export const api = {
  // Calls
  getCalls: (clinicId: string, filters?: Record<string, string>) =>
    request(`/calls?clinic_id=${clinicId}&${new URLSearchParams(filters)}`),

  getCall: (callId: string) => request(`/calls/${callId}`),

  takeoverCall: (callId: string) =>
    request(`/calls/${callId}/takeover`, { method: 'POST' }),

  addCallNote: (callId: string, note: string) =>
    request(`/calls/${callId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),

  // Appointments
  getAppointments: (clinicId: string, startDate?: string, endDate?: string) =>
    request(
      `/appointments?clinic_id=${clinicId}&start_date=${startDate}&end_date=${endDate}`
    ),

  createAppointment: (data: Record<string, unknown>) =>
    request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAppointment: (appointmentId: string, data: Record<string, unknown>) =>
    request(`/appointments/${appointmentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  cancelAppointment: (appointmentId: string, reason?: string) =>
    request(`/appointments/${appointmentId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    }),

  // Waitlist
  getWaitlist: (clinicId: string) =>
    request(`/waitlist?clinic_id=${clinicId}`),

  addToWaitlist: (data: Record<string, unknown>) =>
    request('/waitlist', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  triggerBackfill: (clinicId: string) =>
    request('/waitlist/trigger-backfill', {
      method: 'POST',
      body: JSON.stringify({ clinic_id: clinicId }),
    }),

  // Analytics
  getKPIs: (clinicId: string) =>
    request(`/analytics/kpis?clinic_id=${clinicId}`),

  getCallVolume: (clinicId: string, period: '24h' | '7d' | '30d') =>
    request(`/analytics/call-volume?clinic_id=${clinicId}&period=${period}`),

  getOutcomes: (clinicId: string, startDate?: string, endDate?: string) =>
    request(
      `/analytics/outcomes?clinic_id=${clinicId}&start_date=${startDate}&end_date=${endDate}`
    ),

  getPeakHours: (clinicId: string) =>
    request(`/analytics/peak-hours?clinic_id=${clinicId}`),

  getCosts: (clinicId: string, month: string) =>
    request(`/analytics/costs?clinic_id=${clinicId}&month=${month}`),

  // Settings
  getSettings: (clinicId: string) =>
    request(`/settings/${clinicId}`),

  updateSettings: (clinicId: string, data: Record<string, unknown>) =>
    request(`/settings/${clinicId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Auth
  login: (email: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    request('/auth/logout', {
      method: 'POST',
    }),

  getCurrentUser: () => request('/auth/me'),
};

export { APIError };
