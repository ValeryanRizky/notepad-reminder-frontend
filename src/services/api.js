import axios from 'axios';

const API_URL = 'https://notepad-reminder-backend-production.up.railway.app/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor untuk menambahkan token ke setiap request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor untuk handle response error
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired atau tidak valid
            localStorage.removeItem('token');
            window.location.href = '/login';
            console.error('Token tidak valid atau sudah kadaluarsa');
        }
        return Promise.reject(error);
    }
);

export default api;