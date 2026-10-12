// Central API client. Same-origin by default (Express or Vercel serves both);
// set VITE_API_URL only when the API lives on another domain.
import { storage } from './storage';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const request = async (path, options = {}) => {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, options);
  } catch {
    throw new Error('You appear to be offline. Check your connection and try again.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
};

const postJson = (path, body) => request(path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

// Phone photos are often 3–8 MB. Downscale to keep uploads fast on mobile data
// and under serverless body limits (~4.5 MB on Vercel).
const compressImage = (file, maxSide = 1800, quality = 0.85) => new Promise((resolve) => {
  if (!file.type.startsWith('image/') || file.size < 700 * 1024) return resolve(file);
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => resolve(blob && blob.size < file.size
      ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
      : file), 'image/jpeg', quality);
  };
  img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
  img.src = url;
});

export const MAX_UPLOAD_MB = 4;

export const api = {
  health: () => request('/api/health'),
  chat: (message, history) => postJson('/api/chat', { message, history, profile: storage.getProfile() }),
  workflow: (workflow, context) => postJson('/api/workflow', { workflow, context, profile: storage.getProfile() }),
  schemes: (profile) => postJson('/api/schemes', { profile }),
  services: () => request('/api/services'),
  draftTypes: () => request('/api/drafts/types'),
  draft: (type, details) => postJson('/api/drafts', { type, details, profile: storage.getProfile() }),
  analyzeDocument: async (rawFile) => {
    const file = await compressImage(rawFile);
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`File is too large. Please upload a file under ${MAX_UPLOAD_MB} MB.`);
    const form = new FormData();
    form.append('file', file);
    form.append('profile', JSON.stringify(storage.getProfile()));
    return request('/api/document/analyze', { method: 'POST', body: form });
  }
};
