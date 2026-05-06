import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const name = localStorage.getItem('displayName');
        const email = localStorage.getItem('userEmail');
        const id = localStorage.getItem('userId'); 
        const pfpString = localStorage.getItem('profilePic'); 

        if (token && role) {
            const profilePicArray = pfpString ? pfpString.split(',') : [];
            
            setUser({ 
                token, 
                role, 
                name, 
                email, 
                id, 
                profilePic: profilePicArray 
            });
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
    // 1. Clear previous session
    localStorage.clear(); 

    // 2. Find the ID (from flat object or nested user object)
    const detectedId = userData.id || userData._id || userData.user?._id || userData.user?.id;

    if (!detectedId) {
        console.error("Login failed: No valid User ID detected in response", userData);
        return;
    }

    const name = userData.fullName || userData.name || "";
    const pfpArray = Array.isArray(userData.profilePic) 
        ? userData.profilePic 
        : (userData.profilePic ? [userData.profilePic] : []);

    // 3. Update React State
    const userObj = {
        token: userData.token,
        role: userData.role,
        name: name,
        email: userData.email,
        id: detectedId, // Using the detected ID
        profilePic: pfpArray
    };
    setUser(userObj);

    // 4. Update LocalStorage (Only one setItem per key!)
    localStorage.setItem('token', userData.token);
    localStorage.setItem('role', userData.role);
    localStorage.setItem('displayName', name);
    localStorage.setItem('userEmail', userData.email);
    localStorage.setItem('userId', detectedId); // The important one
    localStorage.setItem('profilePic', pfpArray.join(','));
};

    const updateUser = (updatedData) => {
        setUser(prev => {
            if (!prev) return null;

            const newName = updatedData.fullName || updatedData.name || prev.name;
            const newEmail = updatedData.email || prev.email;
            
            let newPfp = prev.profilePic;
            if (updatedData.profilePic !== undefined) {
                newPfp = Array.isArray(updatedData.profilePic) 
                    ? updatedData.profilePic 
                    : [updatedData.profilePic];
            }

            localStorage.setItem('displayName', newName);
            localStorage.setItem('userEmail', newEmail);
            localStorage.setItem('profilePic', newPfp.join(','));

            return { 
                ...prev, 
                name: newName,
                email: newEmail,
                profilePic: newPfp
            };
        });
    };

    const logout = () => {
        setUser(null);
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, token: user?.token, login, logout, updateUser, loading }}>
            {!loading && children} 
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);