import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On Refresh: Rehydrate the state from storage safely
    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const name = localStorage.getItem('displayName');
        const email = localStorage.getItem('userEmail');

        if (token && role) {
            setUser({ token, role, name, email });
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        // 1. Clear everything to prevent role-bleeding
        localStorage.clear(); 
        
        // 2. Update Memory (State)
        setUser(userData);

        // 3. Update Storage (for refreshes only)
        localStorage.setItem('token', userData.token);
        localStorage.setItem('role', userData.role);
        localStorage.setItem('displayName', userData.name);
        localStorage.setItem('userEmail', userData.email);
    };

    const logout = () => {
        setUser(null);
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children} 
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);