import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Truck, Factory, Package,
  TrendingUp, AlertTriangle, Clock, CheckCircle,
  ArrowRight, Activity,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getStore, STORES } from '../utils/storage';
import { StatCard, PageWrapper, formatINR, formatDateTime } from '../components/UI';
import StatusBadge from '../components/StatusBadge';

function getKPIs() {
  const sales = getStore(STORES.SALES_ORDERS);
  const purchase = getStore(STORES.PURCHASE_ORDERS);
  const mfg = getStore(STORES.MANUFACTURING_ORDERS);

  return {
    totalSales: sales.length,
    pendingDeliveries: sales.filter(s => s.status === 'Confirmed').length,
    totalPurchase: purchase.length,
    partialReceipts: purchase.filter(p => p.status === 'Partial').length,
    mfgOrders: mfg.length,
    delayedOrders: sales.filter(s => ['Confirmed', 'Partial'].includes(s.status)).length,
    totalSalesValue: sales.filter(s => s.status !== 'Cancelled').reduce((a, s) => a + (s.total || 0), 0),
  };
}

function getRecentActivity() {
  const audit = getStore(STORES.AUDIT_LOGS);
  return [...audit].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 8);
}

const MODULE_ICON = {
  Sales: ShoppingCart,
  Purchase: Truck,
  Manufacturing: Factory,
  Inventory: Package,
  Products: Package,
};

export default function Dashboard() {
  const { user } = useAuth();
  const kpi = getKPIs();
  const activity = getRecentActivity();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <PageWrapper>
      {/* Welcome */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening at Shiv Furniture Works today.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/sales/create" className="btn-primary btn-sm">
            <ShoppingCart className="w-3.5 h-3.5" />
            New Sale
          </Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid mb-8">
        <StatCard
          icon={ShoppingCart} label="Total Sales Orders" value={kpi.totalSales}
          trend={`${formatINR(kpi.totalSalesValue)} total value`} color="primary" delay={0}
        />
        <StatCard
          icon={Truck} label="Pending Deliveries" value={kpi.pendingDeliveries}
          trend="Awaiting shipment" color="warning" delay={0.05}
        />
        <StatCard
          icon={Package} label="Purchase Orders" value={kpi.totalPurchase}
          trend="Active procurement" color="info" delay={0.1}
        />
        <StatCard
          icon={Activity} label="Partial Receipts" value={kpi.partialReceipts}
          trend="Incomplete deliveries" color="accent" delay={0.15}
        />
        <StatCard
          icon={Factory} label="Manufacturing Orders" value={kpi.mfgOrders}
          trend="In production pipeline" color="purple" delay={0.2}
        />
        <StatCard
          icon={AlertTriangle} label="Delayed Orders" value={kpi.delayedOrders}
          trend="Need attention" color="danger" delay={0.25}
        />
      </div>

      {/* Quick Links */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        {[
          { label: 'New Sales Order', to: '/sales/create', icon: ShoppingCart, color: 'text-primary bg-primary/10 border-primary/20' },
          { label: 'New Purchase Order', to: '/purchase/create', icon: Truck, color: 'text-warning bg-warning/10 border-warning/20' },
          { label: 'New Mfg Order', to: '/manufacturing/create', icon: Factory, color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
          { label: 'Check Inventory', to: '/inventory', icon: Package, color: 'text-success bg-success/10 border-success/20' },
        ].map(q => (
          <Link
            key={q.to}
            to={q.to}
            className={`flex items-center gap-3 p-4 rounded-card border transition-all duration-200 hover:scale-[1.02] hover:shadow-card ${q.color}`}
          >
            <q.icon className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium text-text-primary">{q.label}</span>
          </Link>
        ))}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Recent Activity</h2>
            <p className="text-xs text-text-muted mt-0.5">Latest actions across all modules</p>
          </div>
          <Link to="/audit" className="btn-ghost btn-sm gap-1">
            View All <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Module</th>
                <th>Action</th>
                <th>Reference</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {activity.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-text-muted text-sm">No activity yet</td>
                </tr>
              ) : activity.map(log => {
                const Icon = MODULE_ICON[log.module] || Activity;
                return (
                  <tr key={log.id}>
                    <td className="text-text-muted text-xs">{formatDateTime(log.timestamp)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-text-muted" />
                        <span className="text-sm">{log.module}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-medium">{log.action}</span>
                    </td>
                    <td>
                      <span className="text-xs font-mono text-accent">{log.reference}</span>
                    </td>
                    <td className="text-text-secondary text-xs">{log.user}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </PageWrapper>
  );
}
