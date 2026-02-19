import React, { createContext, useState, useEffect } from 'react';

// Create the context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(() => {
        return localStorage.getItem('token') || null;
    });

    const [user, setUser] = useState(() => {
        try {
            const savedUser = localStorage.getItem('user');
            // Check if it exists and is NOT the literal string "undefined"
            if (savedUser && savedUser !== "undefined") {
                return JSON.parse(savedUser);
            }
            return null;
        } catch (error) {
            console.error("Error parsing user from localStorage", error);
            return null;
        }
    });

    // 2. Login function
    const login = (data) => {
        // data usually comes from axios.post('.../api/token/')
        // It should contain: { access: "...", user: { role: "admin", ... } }
        
        const accessToken = data.access;
        const userData = data.user;

        setToken(accessToken);
        setUser(userData);

        // Save to browser storage
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    // 3. Logout function
    const logout = () => {
        setToken(null);
        setUser(null);

        // Clear browser storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    // 4. Optional: Token Check
    // You can add logic here to check if a token is expired
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
            logout();
        }
    }, []);

    return (
        <AuthContext.Provider value={{ token, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};