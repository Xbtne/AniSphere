import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('anisphere_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('anisphere_users');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('anisphere_users', JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('anisphere_current_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('anisphere_current_user');
      }
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  const register = (username, password) => {
    if (!username || !password) {
      return { success: false, error: 'Username and password required' };
    }
    
    if (users[username]) {
      return { success: false, error: 'Username already exists' };
    }

    const newUser = {
      username,
      password, // In production, this should be hashed
      createdAt: Date.now(),
    };

    setUsers(prev => ({
      ...prev,
      [username]: newUser
    }));

    // Auto-login after registration
    setUser({ username });

    return { success: true };
  };

  const login = (username, password) => {
    const storedUser = users[username];
    
    if (!storedUser || storedUser.password !== password) {
      return { success: false, error: 'Invalid username or password' };
    }

    setUser({ username });
    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  const getUserData = (username) => {
    return users[username] || null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        register,
        login,
        logout,
        getUserData,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
