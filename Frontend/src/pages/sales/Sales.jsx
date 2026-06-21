import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Plus, Search, Eye, Trash2,
  TrendingUp, Clock, CheckCircle, XCircle, Package, Download,
} from 'lucide-react';
import { PageWrapper, EmptyState, formatINR, formatDate, Pagination } from '../../components/UI';
import StatusBadge from '../../components/StatusBadge';
import { salesApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const FILTER_TABS = [
  { label: 'All',                  value: ''                    },
  { label: 'Draft',                value: 'DRAFT'               },
  { label: 'Confirmed',            value: 'CONFIRMED'           },
  { label: 'Partially Delivered',  value: 'PARTIALLY_DELIVERED' },
  { label: 'Fully Delivered',      value: 'FULLY_DELIVERED'     },
  { label: 'Cancelled',            value: 'CANCELLED'           },
];

function labelStatus(status) {
  const MAP = {
    DRAFT: 'Draft', CONFIRMED: 'Confirmed',
    PARTIALLY_DELIVERED: 'Partially Delivered',
    FULLY_DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
  };
  return MAP[status] ?? status;
}

export default function Sales() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportMonth, setExportMonth] = useState('');
  const [exportYear, setExportYear] = useState('');
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (user?.companyId) params.companyId = user.companyId;
      if (filter) params.status = filter;
      if (search.trim()) params.search = search.trim();
      const res = await salesApi.list(params);
      setOrders(res?.data?.items ?? res?.data ?? []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [filter, search, user?.companyId]);

  useEffect(() => {
    const t = setTimeout(fetchOrders, 300);
    return () => clearTimeout(t);
  }, [fetchOrders]);
  useEffect(() => { setCurrentPage(1); }, [filter, search]);

  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const kpi = {
    total: orders.length,
    confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
    partial: orders.filter(o => o.status === 'PARTIALLY_DELIVERED').length,
    totalValue: orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + Number(o.totalAmount ?? 0), 0),
  };

  const handleDelete = async (id) => {
    try {
      await salesApi.delete(id);
      toast(`Order deleted`, 'success');
      setDeleteId(null);
      fetchOrders();
    } catch (err) {
      toast(err.message || 'Failed to delete order', 'error');
    }
  };

  return (
    <PageWrapper>
      {/* Page Header */}
      <div className="page-header flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="page-title">Sales Orders</h1>
          <p className="page-subtitle">{orders.length} orders · {formatINR(kpi.totalValue)} total value</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {(user?.role === 'ADMIN' || user?.role === 'BUSINESS_OWNER') && (
            <>
              <select 
                value={exportMonth} 
                onChange={e => setExportMonth(e.target.value)}
                className="input !py-1.5 !text-sm w-32"
              >
                <option value="">All Months</option>
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
              <select 
                value={exportYear} 
                onChange={e => setExportYear(e.target.value)}
                className="input !py-1.5 !text-sm w-28"
              >
                <option value="">All Years</option>
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button 
                onClick={async () => {
                  try {
                    setExporting(true);
                    await salesApi.export({ 
                      month: exportMonth || undefined, 
                      year: exportYear || undefined 
                    });
                    toast('Export downloaded successfully', 'success');
                  } catch (err) {
                    toast('Export failed', 'error');
                  } finally {
                    setExporting(false);
                  }
                }}
                disabled={exporting}
                className="btn-secondary whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                {exporting ? 'Exporting...' : 'Export Excel'}
              </button>
            </>
          )}
          <Link to="/sales/create" className="btn-primary whitespace-nowrap">
            <Plus className="w-4 h-4" />
            Create Order
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Orders',        value: kpi.total,                  icon: ShoppingCart, iconCls: 'bg-primary/10 text-primary' },
          { label: 'Confirmed',           value: kpi.confirmed,              icon: CheckCircle,  iconCls: 'bg-accent/10 text-accent'   },
          { label: 'Partially Delivered', value: kpi.partial,                icon: Clock,        iconCls: 'bg-amber-100 text-amber-600' },
          { label: 'Total Value',         value: formatINR(kpi.totalValue),  icon: TrendingUp,   iconCls: 'bg-green-100 text-green-600' },
        ].map((k, i) => (
          <motion.div key={k.label} className="mini-kpi"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <div className={`mini-kpi-icon ${k.iconCls}`}>
              <k.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="mini-kpi-label">{k.label}</p>
              <p className="mini-kpi-value">{k.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="card mb-4">
        <div className="flex flex-wrap gap-1 mb-4">
          {FILTER_TABS.map(tab => (
            <button key={tab.value} onClick={() => setFilter(tab.value)}
              className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-all duration-150 ${
                filter === tab.value ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-bg-light hover:text-text-primary'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="search-bar">
          <Search className="search-icon" />
          <input className="input pl-10" placeholder="Search by SO number or customer name…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <motion.div className="table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <table className="table">
          <thead>
            <tr>
              <th>SO Number</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Items</th>
              <th className="text-right">Total Amount</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-6 py-4">
                    <div className="h-4 bg-bg-light animate-pulse rounded" />
                  </td></tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="py-0">
                  <EmptyState icon={Package} title="No sales orders found"
                    description={search ? 'Try a different search term' : 'Create your first sales order to get started'}
                    action={!search && <Link to="/sales/create" className="btn-primary btn-sm mt-2"><Plus className="w-3.5 h-3.5" />Create Sales Order</Link>}
                  />
                </td></tr>
              ) : (
                paginatedOrders.map((order, i) => (
                  <motion.tr key={order.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ delay: i * 0.03 }}
                    className="cursor-pointer hover:bg-bg-surface/60"
                    onClick={() => navigate(`/sales/${order.id}`)}>
                    <td><span className="font-mono text-sm font-semibold text-primary">{order.orderNumber ?? order.id}</span></td>
                    <td><span className="font-medium text-text-primary">{order.customer?.name ?? order.customer ?? '—'}</span></td>
                    <td className="text-text-secondary text-sm">{formatDate(order.createdAt ?? order.date)}</td>
                    <td><StatusBadge status={labelStatus(order.status)} /></td>
                    <td className="text-text-muted text-sm">{order.items?.length ?? order.lines?.length ?? 0} item(s)</td>
                    <td className="text-right font-semibold text-text-primary">{formatINR(order.totalAmount ?? order.total ?? 0)}</td>
                    <td className="text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Link to={`/sales/${order.id}`} className="btn-ghost btn-icon btn-sm tooltip" title="View Details">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {(user?.role === 'ADMIN' || user?.role === 'BUSINESS_OWNER') && (
                          <button onClick={() => setDeleteId(order.id)} className="btn-ghost btn-icon btn-sm hover:text-danger" title="Cancel/Delete">
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
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Cancel Confirm Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setDeleteId(null)}>
            <motion.div className="modal" initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
              <div className="modal-header">
                <h2 className="text-base font-semibold text-text-primary">Delete Sales Order</h2>
                <button onClick={() => setDeleteId(null)} className="btn-ghost btn-icon"><XCircle className="w-4 h-4" /></button>
              </div>
              <div className="modal-body">
                <p className="text-sm text-text-secondary">
                  Are you sure you want to delete <span className="font-semibold text-primary">{deleteId}</span>?
                </p>
              </div>
              <div className="modal-footer">
                <button onClick={() => setDeleteId(null)} className="btn-secondary">Back</button>
                <button onClick={() => handleDelete(deleteId)} className="btn-danger">Delete Order</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
