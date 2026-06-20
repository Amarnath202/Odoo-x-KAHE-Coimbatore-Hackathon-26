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
    accent: 'from-accent/20 to-accent/5 text-accent',
    success: 'from-success/20 to-success/5 text-success',
    warning: 'from-warning/20 to-warning/5 text-warning',
    danger: 'from-danger/20 to-danger/5 text-danger',
    info: 'from-info/20 to-info/5 text-info',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-400',
  };

  const iconBg = {
    primary: 'bg-primary/15 text-primary',
    accent: 'bg-accent/15 text-accent',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    danger: 'bg-danger/15 text-danger',
    info: 'bg-info/15 text-info',
    purple: 'bg-purple-500/15 text-purple-400',
  };

  return (
    <motion.div
      className="kpi-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
    >
      <div className={`absolute inset-0 rounded-card bg-gradient-to-br ${colorMap[color]} opacity-30 pointer-events-none`} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-text-secondary mb-1">{label}</p>
          <p className="text-3xl font-bold text-text-primary leading-none">{value}</p>
          {trend && <p className="text-xs text-text-muted mt-2">{trend}</p>}
        </div>
        <div className={`w-11 h-11 rounded-btn flex items-center justify-center shrink-0 ${iconBg[color]}`}>
          <Icon className="w-5 h-5" />
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
