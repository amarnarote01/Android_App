import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { getMe } from '../services/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStoredAuth();
    }, []);

    const loadStoredAuth = async () => {
        try {
            const storedToken = await SecureStore.getItemAsync('authToken');
            if (storedToken) {
                setToken(storedToken);
                const response = await getMe();
                setUser(response.data.user);
            }
        } catch (err) {
            console.log('Auth load failed, clearing token');
            await SecureStore.deleteItemAsync('authToken');
        } finally {
            setLoading(false);
        }
    };

    const login = async (authToken, userData) => {
        await SecureStore.setItemAsync('authToken', authToken);
        setToken(authToken);
        setUser(userData);
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('authToken');
        setToken(null);
        setUser(null);
    };

    const updateUser = (userData) => {
        setUser(prev => ({ ...prev, ...userData }));
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}
