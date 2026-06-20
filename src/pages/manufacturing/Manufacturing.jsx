import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Factory, Plus, Search, Eye, Trash2,
  CheckCircle, Clock, XCircle, Activity, User,
} from 'lucide-react';
import { PageWrapper, EmptyState, formatDate } from '../../components/UI';
import StatusBadge from '../../components/StatusBadge';
import { getStore, setStore, STORES, addAuditLog } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const FILTER_TABS = [
  { label: 'All',          value: 'All' },
  { label: 'Draft',        value: 'Draft' },
  { label: 'Confirmed',    value: 'Confirmed' },
  { label: 'In Progress',  value: 'In Progress' },
  { label: 'Done',         value: 'Done' },
  { label: 'Cancelled',    value: 'Cancelled' },
];

export default function Manufacturing() {
  const { user } = useAuth();
  const toast    = useToast();
  const navigate = useNavigate();

  const [filter,   setFilter]   = useState('All');
  const [search,   setSearch]   = useState('');
  const [deleteId, setDeleteId] = useState(null);

  const orders = getStore(STORES.MANUFACTURING_ORDERS);

  const filtered = useMemo(() => {
    let list = [...orders].sort(
      (a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
    );
    if (filter !== 'All') list = list.filter(o => o.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.id?.toLowerCase().includes(q) ||
        o.productName?.toLowerCase().includes(q) ||
        o.assignee?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filter, search, orders.length]);

  const kpi = useMemo(() => ({
    total:      orders.length,
    inProgress: orders.filter(o => o.status === 'In Progress').length,
    done:       orders.filter(o => o.status === 'Done').length,
    draft:      orders.filter(o => o.status === 'Draft').length,
  }), [orders]);

  const handleDelete = (id) => {
    const updated = orders.filter(o => o.id !== id);
    setStore(STORES.MANUFACTURING_ORDERS, updated);
    addAuditLog({
      user: user?.name, role: user?.role,
      module: 'Manufacturing', action: 'Deleted',
      reference: id,
    });
    toast(`${id} deleted`, 'warning');
    setDeleteId(null);
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Manufacturing Orders</h1>
          <p className="page-subtitle">
            {orders.length} orders · {kpi.inProgress} in progress
          </p>
        </div>
        <Link to="/manufacturing/create" className="btn-primary">
          <Plus className="w-4 h-4" />
          Create MO
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Orders', value: kpi.total,      icon: Factory,       color: 'bg-purple-500/10 text-purple-400' },
          { label: 'Draft',        value: kpi.draft,      icon: Clock,         color: 'bg-text-muted/10 text-text-muted' },
          { label: 'In Progress',  value: kpi.inProgress, icon: Activity,      color: 'bg-warning/10 text-warning' },
          { label: 'Completed',    value: kpi.done,       icon: CheckCircle,   color: 'bg-success/10 text-success' },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            className="card flex items-center gap-3 py-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className={`w-10 h-10 rounded-btn flex items-center justify-center shrink-0 ${k.color}`}>
              <k.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-text-muted">{k.label}</p>
              <p className="text-lg font-bold text-text-primary leading-tight">{k.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="card mb-4">
        <div className="flex flex-wrap gap-1 mb-4">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-all duration-150 ${
                filter === tab.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:bg-bg-light hover:text-text-primary'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                filter === tab.value ? 'bg-white/20' : 'bg-bg-light'
              }`}>
                {tab.value === 'All'
                  ? orders.length
                  : orders.filter(o => o.status === tab.value).length}
              </span>
            </button>
          ))}
        </div>
        <div className="search-bar">
          <Search className="search-icon" />
          <input
            className="input pl-10"
            placeholder="Search by MO number, product, or assignee…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <motion.div
        className="table-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <table className="table">
          <thead>
            <tr>
              <th>MO Number</th>
              <th>Product</th>
              <th className="text-center">Qty</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Date</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-0">
                    <EmptyState
                      icon={Factory}
                      title="No manufacturing orders found"
                      description={
                        search
                          ? 'Try a different search term'
                          : 'Create your first manufacturing order to get started'
                      }
                      action={
                        !search && (
                          <Link to="/manufacturing/create" className="btn-primary btn-sm mt-2">
                            <Plus className="w-3.5 h-3.5" />
                            Create MO
                          </Link>
                        )
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((order, i) => (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ delay: i * 0.03 }}
                    className="cursor-pointer hover:bg-bg-surface/60"
                    onClick={() => navigate(`/manufacturing/${order.id}`)}
                  >
                    <td>
                      <span className="font-mono text-sm font-semibold text-purple-400">
                        {order.id}
                      </span>
                    </td>
                    <td>
                      <span className="font-medium text-text-primary">{order.productName}</span>
                    </td>
                    <td className="text-center font-semibold">{order.qty}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/60 to-accent/60 flex items-center justify-center text-[10px] font-bold text-white">
                          {order.assignee?.[0]?.toUpperCase() || '?'}
                        </div>
                        <span className="text-sm text-text-secondary">{order.assignee || '—'}</span>
                      </div>
                    </td>
                    <td className="text-text-secondary text-sm">{formatDate(order.date)}</td>
                    <td className="text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          to={`/manufacturing/${order.id}`}
                          className="btn-ghost btn-icon btn-sm"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {order.status === 'Draft' && (
                          <button
                            onClick={() => setDeleteId(order.id)}
                            className="btn-danger btn-icon btn-sm"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setDeleteId(null)}
          >
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="modal-header">
                <h2 className="text-base font-semibold text-text-primary">Delete Manufacturing Order</h2>
                <button onClick={() => setDeleteId(null)} className="btn-ghost btn-icon">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="modal-body">
                <p className="text-sm text-text-secondary">
                  Delete <span className="font-semibold text-purple-400">{deleteId}</span>?
                  This cannot be undone.
                </p>
              </div>
              <div className="modal-footer">
                <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
                <button onClick={() => handleDelete(deleteId)} className="btn-danger">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
