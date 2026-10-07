// VITE_USE_MOCK=true runs the UI against the in-browser mock (no backend needed).
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
