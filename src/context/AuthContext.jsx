import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: 'Admin',
  SALES: 'Sales User',
  PURCHASE: 'Purchase User',
  MANUFACTURING: 'Manufacturing User',
  INVENTORY: 'Inventory Manager',
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ['dashboard', 'products', 'sales', 'purchase', 'manufacturing', 'bom', 'inventory', 'audit'],
  [ROLES.SALES]: ['dashboard', 'sales'],
  [ROLES.PURCHASE]: ['dashboard', 'purchase'],
  [ROLES.MANUFACTURING]: ['dashboard', 'manufacturing', 'bom'],
  [ROLES.INVENTORY]: ['dashboard', 'inventory', 'products'],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('erp_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = (userData) => {
    const userObj = { ...userData, loginTime: new Date().toISOString() };
    localStorage.setItem('erp_user', JSON.stringify(userObj));
    setUser(userObj);
  };

  const logout = () => {
    localStorage.removeItem('erp_user');
    setUser(null);
  };

  const hasPermission = (module) => {
    if (!user) return false;
    const perms = ROLE_PERMISSIONS[user.role] || [];
    return perms.includes(module);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
