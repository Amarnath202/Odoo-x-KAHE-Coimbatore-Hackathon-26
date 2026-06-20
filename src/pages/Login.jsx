import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth, ROLES } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DEMO_USERS = [
  { name: 'Admin User', email: 'admin@shivfurniture.com', password: 'admin123', role: ROLES.ADMIN },
  { name: 'Priya Sharma', email: 'sales@shivfurniture.com', password: 'sales123', role: ROLES.SALES },
  { name: 'Rajesh Kumar', email: 'purchase@shivfurniture.com', password: 'purchase123', role: ROLES.PURCHASE },
  { name: 'Amit Singh', email: 'mfg@shivfurniture.com', password: 'mfg123', role: ROLES.MANUFACTURING },
  { name: 'Sunita Patel', email: 'inventory@shivfurniture.com', password: 'inv123', role: ROLES.INVENTORY },
];

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = React.useState({ email: '', password: '' });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));

    const user = DEMO_USERS.find(u => u.email === form.email && u.password === form.password);
    if (!user) {
      setError('Invalid email or password');
      setLoading(false);
      return;
    }

    login({ name: user.name, email: user.email, role: user.role });
    toast(`Welcome back, ${user.name}! 👋`, 'success');
    navigate('/dashboard');
  };

  const quickLogin = (u) => {
    setForm({ email: u.email, password: u.password });
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4 shadow-glow">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Odoo Mini-ERP</h1>
          <p className="text-sm text-text-muted mt-1">Shiv Furniture Works</p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-lg font-semibold text-text-primary mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="you@shivfurniture.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
            </div>

            {error && (
              <div className="alert alert-danger text-sm">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full justify-center mt-2"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Quick login */}
          <div className="divider" />
          <p className="text-xs text-text-muted mb-3 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Quick login for demo
          </p>
          <div className="grid grid-cols-1 gap-1.5">
            {DEMO_USERS.map(u => (
              <button
                key={u.email}
                onClick={() => quickLogin(u)}
                className="flex items-center justify-between px-3 py-2 rounded-btn bg-bg-light/50 hover:bg-bg-light border border-white/5 text-left transition-colors"
              >
                <div>
                  <p className="text-xs font-medium text-text-primary">{u.name}</p>
                  <p className="text-[10px] text-text-muted">{u.role}</p>
                </div>
                <span className="text-[10px] text-text-muted">{u.email}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
