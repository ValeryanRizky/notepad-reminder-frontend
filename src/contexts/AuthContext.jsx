import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await api.get('/auth/me');
                setUser(response.data.user);
            } catch (error) {
                localStorage.removeItem('token');
                setUser(null);
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            setUser(user);
            toast.success('Login berhasil!');
            return { success: true };
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Login gagal';
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    const register = async (email, password, username) => {
        try {
            const response = await api.post('/auth/register', { email, password, username });

            // Jika perlu verifikasi email
            if (response.data.needVerification) {
                toast.success('Registrasi berhasil! Silahkan cek email untuk verifikasi.');
                return { success: true, needVerification: true };
            }

            // Registrasi berhasil tapi TIDAK LANGSUNG LOGIN
            // HAPUS token jika terlanjut dikirim dari backend
            localStorage.removeItem('token');
            setUser(null);

            toast.success('Registrasi berhasil! Silahkan login dengan akun Anda.');
            return { success: true, needLogin: true };

        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Registrasi gagal';
            toast.error(errorMsg);
            return { success: false, error: errorMsg };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        toast.success('Logout berhasil!');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};