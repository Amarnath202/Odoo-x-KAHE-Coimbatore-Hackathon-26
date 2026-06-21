import React from 'react';
import { motion } from 'framer-motion';

/**
 * Animated page/section entry wrapper
 * Usage: <PageWrapper><YourContent /></PageWrapper>
 */
export function PageWrapper({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export default PageWrapper;

/**
 * Stagger children with animation
 */
export function StaggerList({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
    >
      {React.Children.map(children, (child) => (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * Empty state component
 */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-bg-light flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-text-muted" />
        </div>
      )}
      <p className="text-sm font-semibold text-text-secondary mb-1">{title}</p>
      {description && <p className="text-xs text-text-muted mb-4">{description}</p>}
      {action}
    </div>
  );
}

/**
 * Stat/KPI card
 */
export function StatCard({ icon: Icon, label, value, trend, color = 'primary', delay = 0 }) {
  const colorMap = {
    primary: 'from-primary/20 to-primary/5 text-primary',
    accent:  'from-accent/20 to-accent/5 text-accent',
    success: 'from-green-500/20 to-green-500/5 text-green-600',
    warning: 'from-amber-500/20 to-amber-500/5 text-amber-600',
    danger:  'from-red-500/20 to-red-500/5 text-red-600',
    info:    'from-blue-500/20 to-blue-500/5 text-blue-600',
    purple:  'from-violet-500/20 to-violet-500/5 text-violet-600',
  };

  const iconBg = {
    primary: 'bg-primary/10 text-primary',
    accent:  'bg-accent/10 text-accent',
    success: 'bg-green-500/10 text-green-600',
    warning: 'bg-amber-500/10 text-amber-600',
    danger:  'bg-red-500/10 text-red-600',
    info:    'bg-blue-500/10 text-blue-600',
    purple:  'bg-violet-500/10 text-violet-600',
  };

  const progressBg = {
    primary: 'bg-primary',
    accent:  'bg-accent',
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    danger:  'bg-red-500',
    info:    'bg-blue-500',
    purple:  'bg-violet-500',
  };

  const numericVal = parseInt(String(value).replace(/[^0-9]/g, '')) || 0;

  return (
    <motion.div
      className="kpi-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
    >
      <div className={`absolute inset-0 rounded-card bg-gradient-to-br ${colorMap[color]} opacity-30 pointer-events-none`} />
      <div className="relative flex flex-col h-full justify-between gap-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1.5">{label}</p>
            <p className="text-3xl font-extrabold text-text-primary leading-none tracking-tight">{value}</p>
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg[color]}`}>
            <Icon className="w-4.5 h-4.5" style={{ width: '1.125rem', height: '1.125rem' }} />
          </div>
        </div>
        
        <div>
          <div className="w-full bg-bg-muted h-1 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${progressBg[color] || 'bg-primary'}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(15, numericVal > 0 ? Math.min(100, (numericVal % 15) * 6 + 30) : 0))}%` }}
              transition={{ delay: delay + 0.2, duration: 0.8 }}
            />
          </div>
          {trend && <p className="text-[10px] text-text-muted mt-2 font-medium">{trend}</p>}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Indian currency formatter
 */
export function formatINR(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

/**
 * Date formatter
 */
export function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

import { ChevronLeft, ChevronRight } from 'lucide-react';
export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-bg-surface mt-auto">
      <div className="text-sm text-text-secondary">
        Page <span className="font-semibold text-text-primary">{currentPage}</span> of <span className="font-semibold text-text-primary">{totalPages}</span>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage === 1}
          className="btn-secondary btn-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        <button 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
          className="btn-secondary btn-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
