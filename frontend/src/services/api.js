import axios from 'axios';

// In production the frontend is served by the backend, so '/api' works.
// In development the Vite proxy forwards '/api' to the backend.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const updatePassword = (data) => api.put('/auth/password', data);

// Places
export const getPlaces = (params) => api.get('/places', { params });
export const getPlace = (id) => api.get(`/places/${id}`);
export const createPlace = (data) => api.post('/places', data);
export const updatePlace = (id, data) => api.put(`/places/${id}`, data);
export const deletePlace = (id) => api.delete(`/places/${id}`);

// Trips
export const getTrips = () => api.get('/trips');
export const getTrip = (id) => api.get(`/trips/${id}`);
export const createTrip = (data) => api.post('/trips', data);
export const updateTrip = (id, data) => api.put(`/trips/${id}`, data);
export const deleteTrip = (id) => api.delete(`/trips/${id}`);
export const addTripMember = (tripId, data) => api.post(`/trips/${tripId}/members`, data);
export const removeTripMember = (tripId, userId) => api.delete(`/trips/${tripId}/members/${userId}`);
export const addTripPlace = (tripId, placeId) => api.post(`/trips/${tripId}/places`, { placeId });
export const removeTripPlace = (tripId, placeId) => api.delete(`/trips/${tripId}/places/${placeId}`);

// Users
export const searchUsers = (q) => api.get('/users/search', { params: { q } });

export default api;
