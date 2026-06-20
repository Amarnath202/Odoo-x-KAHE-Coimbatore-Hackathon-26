import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center gap-4 text-center p-6">
      <p className="text-8xl font-black text-gradient">404</p>
      <h1 className="text-xl font-semibold text-text-primary">Page Not Found</h1>
      <p className="text-sm text-text-muted max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-3 mt-2">
        <button onClick={() => navigate(-1)} className="btn-secondary">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
        <button onClick={() => navigate('/dashboard')} className="btn-primary">
          <Home className="w-4 h-4" /> Dashboard
        </button>
      </div>
    </div>
  );
}
