import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkInitialAuth();
    }, []);

    const checkInitialAuth = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token) {
                const response = await api.get('/auth/me');
                setUser(response.data);
            }
        } catch (error) {
            await AsyncStorage.removeItem('userToken');
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = async (idToken) => {
        try {
            const response = await api.post('/auth/google', { idToken });
            const { token, user: userProfile } = response.data;
            await AsyncStorage.setItem('userToken', token);
            setUser(userProfile);
        } catch (error) {
            console.error("Login failed", error);
        }
    };

    const logout = async () => {
        await AsyncStorage.removeItem('userToken');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, isLoading, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};