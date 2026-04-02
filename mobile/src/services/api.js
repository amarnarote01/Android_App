import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Change this to your Render.com URL in production
const API_BASE = 'http://10.22.231.66:5000/api'; // Changed to your local network IP for Expo Go

const api = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
    const token = await SecureStore.getItemAsync('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 responses
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            await SecureStore.deleteItemAsync('authToken');
        }
        return Promise.reject(error);
    }
);

// ── Auth ──
export const sendOtp = (phone) => api.post('/auth/send-otp', { phone });
export const verifyOtp = (phone, otp) => api.post('/auth/verify-otp', { phone, otp });
export const updateProfile = (data) => api.put('/auth/profile', data);
export const getMe = () => api.get('/auth/me');

// ── Groups ──
export const getGroups = (params) => api.get('/groups', { params });
export const getGroup = (id) => api.get(`/groups/${id}`);
export const createGroup = (data) => api.post('/groups', data);
export const updateGroup = (id, data) => api.put(`/groups/${id}`, data);
export const addMember = (groupId, userId) => api.post(`/groups/${groupId}/members`, { userId });
export const removeMember = (groupId, userId) => api.delete(`/groups/${groupId}/members/${userId}`);

// ── Payments ──
export const initiatePayment = (data) => api.post('/payments/initiate', data);
export const getGroupPayments = (groupId, params) => api.get(`/payments/group/${groupId}`, { params });
export const getUserPayments = (userId) => api.get(`/payments/user/${userId}`);

// ── EMI ──
export const getEmiCycles = (groupId) => api.get(`/emi/group/${groupId}`);
export const getCurrentCycle = (groupId) => api.get(`/emi/current/${groupId}`);

export default api;
