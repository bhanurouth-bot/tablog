import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios'; // <--- 1. Import Axios

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => {
        return localStorage.getItem('token') || null;
    });

    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('user');
            if (savedUser && savedUser !== "undefined") {
                return JSON.parse(savedUser);
            }
            return null;
        } catch (error) {
            console.error("Error parsing user from localStorage", error);
            return null;
        }
    });

    const login = (data) => {
        const accessToken = data.access;
        const userData = data.user;
        setToken(accessToken);
        setUser(userData);
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Optional: Redirect to login immediately if not using React Router's state change
        window.location.href = '/login'; 
    };

    // --- 2. THE FIX: AXIOS INTERCEPTOR ---
    useEffect(() => {
        // This listens to EVERY response received by the app
        const interceptor = axios.interceptors.response.use(
            (response) => response, // If response is good, do nothing
            (error) => {
                // If the backend says "Unauthorized" (401), the token is dead.
                if (error.response && error.response.status === 401) {
                    console.warn("Token expired. Logging out automatically.");
                    logout(); // <--- Force Logout & Redirect to Login
                }
                return Promise.reject(error);
            }
        );

        // Cleanup when the app closes
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    return (
        <AuthContext.Provider value={{ token, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};