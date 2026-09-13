import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const DEFAULT_AVATARS = [
  { id: 'david', name: 'David (Cyberpunk)', url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120377-50mB868V8K2m.jpg' },
  { id: 'denji', name: 'Denji (Chainsaw Man)', url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-Ree2WjhFjv1y.png' },
  { id: 'shadow', name: 'Shadow (Eminence)', url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx130298-bMw5fR7d5r5S.jpg' },
  { id: 'ichigo', name: 'Ichigo (Bleach)', url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx269-d2GmRkJbMopq.png' },
  { id: 'ayanokoji', name: 'Ayanokoji (Elite)', url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx98659-1kwhTfS8S4fH.jpg' },
  { id: 'dandadan', name: 'Momo & Okarun (Dandadan)', url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171018-b7wF95W09U0y.jpg' },
  { id: 'yusuke', name: 'Yusuke (Yu Yu Hakusho)', url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx392-z90299zIvYmx.png' },
  { id: 'goku', name: 'Broly (DBS)', url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx101302-gM2g1VjA92a2.jpg' },
  { id: 'hinata', name: 'Hinata (Haikyuu)', url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx20464-k6n4VvGvD6eX.jpg' },
];

const PRESEEDED_USERS = {
  Xron: {
    username: 'Xron',
    password: 'admin',
    displayName: 'Xron',
    role: 'admin',
    bio: 'AniSphere Founder & Head Administrator. Curating the best English dub streaming platform.',
    avatar: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120377-50mB868V8K2m.jpg',
    favoriteGenre: 'Action',
    joinedAt: Date.now() - 90 * 86400000,
  }
};

export function AuthProvider({ children }) {
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('anisphere_users');
      const parsed = saved ? JSON.parse(saved) : {};
      // Ensure Xron exists with admin role
      if (!parsed.Xron) {
        parsed.Xron = PRESEEDED_USERS.Xron;
      } else {
        parsed.Xron.role = 'admin';
      }
      return parsed;
    } catch {
      return PRESEEDED_USERS;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('anisphere_current_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Auto upgrade Xron to admin
      if (parsed?.username?.toLowerCase() === 'xron') {
        parsed.role = 'admin';
      }
      return parsed;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('anisphere_users', JSON.stringify(users));
    } catch (e) {
      console.error('Failed to persist users:', e);
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
      console.error('Failed to persist current user:', e);
    }
  }, [user]);

  const isAdmin = Boolean(
    user && (user.role === 'admin' || user.username?.toLowerCase() === 'xron')
  );

  const register = (username, password) => {
    const cleanUsername = username?.trim();
    if (!cleanUsername || !password) {
      return { success: false, error: 'Username and password required' };
    }

    // Check case-insensitive existence
    const existingKey = Object.keys(users).find(
      (k) => k.toLowerCase() === cleanUsername.toLowerCase()
    );
    if (existingKey) {
      return { success: false, error: 'Username already exists' };
    }

    const isXron = cleanUsername.toLowerCase() === 'xron';
    const newUser = {
      username: cleanUsername,
      displayName: cleanUsername,
      password,
      role: isXron ? 'admin' : 'member',
      avatar: isXron ? PRESEEDED_USERS.Xron.avatar : DEFAULT_AVATARS[0].url,
      bio: isXron ? PRESEEDED_USERS.Xron.bio : 'Anime lover on AniSphere.',
      favoriteGenre: 'Action',
      joinedAt: Date.now(),
    };

    setUsers((prev) => ({
      ...prev,
      [cleanUsername]: newUser,
    }));

    setUser(newUser);
    return { success: true };
  };

  const login = (username, password) => {
    const cleanUsername = username?.trim();
    const existingKey = Object.keys(users).find(
      (k) => k.toLowerCase() === cleanUsername.toLowerCase()
    );

    const storedUser = existingKey ? users[existingKey] : null;

    if (!storedUser || storedUser.password !== password) {
      return { success: false, error: 'Invalid username or password' };
    }

    // Ensure Xron has admin privileges
    if (storedUser.username?.toLowerCase() === 'xron') {
      storedUser.role = 'admin';
    }

    setUser(storedUser);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  const updateProfile = (updatedFields) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    const cleanUsername = user.username;
    const isXron = cleanUsername.toLowerCase() === 'xron';

    const mergedUser = {
      ...user,
      ...updatedFields,
      // Ensure Xron cannot lose admin
      role: isXron ? 'admin' : (updatedFields.role || user.role || 'member'),
    };

    setUser(mergedUser);
    setUsers((prev) => ({
      ...prev,
      [cleanUsername]: {
        ...(prev[cleanUsername] || {}),
        ...mergedUser,
      },
    }));

    return { success: true, user: mergedUser };
  };

  const getUserData = (targetUsername) => {
    const clean = targetUsername?.trim();
    const existingKey = Object.keys(users).find(
      (k) => k.toLowerCase() === clean.toLowerCase()
    );
    return existingKey ? users[existingKey] : null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        register,
        login,
        logout,
        updateProfile,
        getUserData,
        isAdmin,
        isAuthenticated: !!user,
        defaultAvatars: DEFAULT_AVATARS,
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
