// Q4 · Clerk login — shared axios instance for every API call.
// baseURL is VITE_API_URL; a request interceptor attaches the Clerk session token as a Bearer header.
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
});

// Attach the Clerk token to every request automatically
api.interceptors.request.use(async (config) => {
    const token = await window.Clerk?.session?.getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
