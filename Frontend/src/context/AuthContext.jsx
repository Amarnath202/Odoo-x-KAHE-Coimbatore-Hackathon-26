import React, { createContext, useContext, useState } from 'react';
import { authApi, setToken, getToken } from '../utils/api';

const AuthContext = createContext(null);

// Role names as returned by the backend (matches Prisma Role enum)
export const ROLES = {
  ADMIN: 'ADMIN',
  BUSINESS_OWNER: 'BUSINESS_OWNER',
  SALES_USER: 'SALES_USER',
  PURCHASE_USER: 'PURCHASE_USER',
  MANUFACTURING_USER: 'MANUFACTURING_USER',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ['users', 'dashboard', 'products', 'sales', 'purchase', 'manufacturing', 'bom', 'inventory', 'audit', 'customers', 'vendors'],
  [ROLES.BUSINESS_OWNER]: ['users', 'dashboard', 'products', 'sales', 'purchase', 'manufacturing', 'bom', 'inventory', 'audit', 'customers', 'vendors'],
  [ROLES.SALES_USER]: ['dashboard', 'sales', 'customers'],
  [ROLES.PURCHASE_USER]: ['dashboard', 'purchase', 'vendors'],
  [ROLES.MANUFACTURING_USER]: ['dashboard', 'manufacturing', 'bom'],
  [ROLES.INVENTORY_MANAGER]: ['dashboard', 'inventory', 'products'],
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

  /**
   * login — calls the backend, stores token + user info
   * Returns { success, error }
   */
  const login = async (email, password) => {
    try {
      const res = await authApi.login(email, password);
      // Backend returns { data: { accessToken, user } }
      const { accessToken, user: userData } = res.data ?? res;
      setToken(accessToken);
      const userObj = { ...userData, loginTime: new Date().toISOString() };
      localStorage.setItem('erp_user', JSON.stringify(userObj));
      setUser(userObj);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  /**
   * loginWithUserData — used to directly set user after external auth (kept for compatibility)
   */
  const loginWithUserData = (userData, accessToken) => {
    if (accessToken) setToken(accessToken);
    const userObj = { ...userData, loginTime: new Date().toISOString() };
    localStorage.setItem('erp_user', JSON.stringify(userObj));
    setUser(userObj);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore errors on logout
    }
    setToken(null);
    localStorage.removeItem('erp_user');
    setUser(null);
  };

  const hasPermission = (module) => {
    if (!user) return false;
    const perms = ROLE_PERMISSIONS[user.role] || [];
    return perms.includes(module);
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithUserData, logout, hasPermission, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
