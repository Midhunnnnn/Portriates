const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export function apiUrl(path) {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function apiFetch(path, options = {}) {
  return fetch(apiUrl(path), {
    credentials: 'include',
    ...options
  });
}

