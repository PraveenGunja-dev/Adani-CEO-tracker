// Use absolute URL for API calls to the FastAPI backend
export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://agelceotracker.adani.com/api'
  : 'http://localhost:8005';