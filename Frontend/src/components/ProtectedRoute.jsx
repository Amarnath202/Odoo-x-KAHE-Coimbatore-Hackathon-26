import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, module }) {
  const { user, hasPermission } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (module && !hasPermission(module)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
