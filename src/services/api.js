// Central API service — all fetch calls go through here
const BASE_URL = 'https://saarthi-3ap6.onrender.com';

const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
};

export const chatApi = {
  send: (message, sessionId) => apiFetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message, sessionId })
  })
};

export const workflowApi = {
  get: (workflow, context) => apiFetch('/api/workflow', {
    method: 'POST',
    body: JSON.stringify({ workflow, context })
  }),
  checkEligibility: (workflow, userDetails) => apiFetch('/api/workflow/eligibility', {
    method: 'POST',
    body: JSON.stringify({ workflow, userDetails })
  })
};

export const memoryApi = {
  getAll: () => apiFetch('/api/memory'),
  getSession: (id) => apiFetch(`/api/memory/${id}`),
  deleteSession: (id) => apiFetch(`/api/memory/${id}`, { method: 'DELETE' })
};

export const documentApi = {
  verify: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${BASE_URL}/api/document/verify`, {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }
};

export const timelineApi = {
  get: () => apiFetch('/api/timeline')
};
