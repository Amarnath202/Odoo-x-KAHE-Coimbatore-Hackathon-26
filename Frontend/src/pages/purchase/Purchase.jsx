import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Plus, Search, Eye, TrendingUp, Clock, CheckCircle, XCircle, Package, Trash2, Download } from 'lucide-react';
import { PageWrapper, EmptyState, formatINR, formatDate } from '../../components/UI';
import StatusBadge from '../../components/StatusBadge';
import { purchaseApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const FILTER_TABS = [
  { label: 'All',               value: '' },
  { label: 'Draft',             value: 'DRAFT' },
  { label: 'Confirmed',         value: 'CONFIRMED' },
  { label: 'Partially Received',value: 'PARTIALLY_RECEIVED' },
  { label: 'Fully Received',    value: 'FULLY_RECEIVED' },
  { label: 'Cancelled',         value: 'CANCELLED' },
];

function labelStatus(s) {
  const M = { DRAFT:'Draft', CONFIRMED:'Confirmed', PARTIALLY_RECEIVED:'Partially Received', FULLY_RECEIVED:'Fully Received', CANCELLED:'Cancelled' };
  return M[s] ?? s;
}

export default function Purchase() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportMonth, setExportMonth] = useState('');
  const [exportYear, setExportYear] = useState('');
  const [exporting, setExporting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (user?.companyId) params.companyId = user.companyId;
      if (filter) params.status = filter;
      if (search.trim()) params.search = search.trim();
      const res = await purchaseApi.list(params);
      setOrders(res?.data?.items ?? res?.data ?? []);
    } catch { setOrders([]); } finally { setLoading(false); }
  }, [filter, search, user?.companyId]);

  useEffect(() => { const t = setTimeout(fetchOrders, 300); return () => clearTimeout(t); }, [fetchOrders]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      await purchaseApi.delete(id);
      toast('Purchase order deleted successfully', 'success');
      fetchOrders();
    } catch (err) {
      toast(err.message || 'Failed to delete purchase order', 'error');
    }
  };

  const kpi = {
    total: orders.length,
    confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
    partial: orders.filter(o => o.status === 'PARTIALLY_RECEIVED').length,
    totalValue: orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + Number(o.totalAmount ?? 0), 0),
  };

  return (
    <PageWrapper>
      <div className="page-header flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">{orders.length} orders · {formatINR(kpi.totalValue)} total spend</p>
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
                    await purchaseApi.export({ 
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
          <Link to="/purchase/create" className="btn-primary whitespace-nowrap">
            <Plus className="w-4 h-4" />Create Purchase Order
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Orders',       value: kpi.total,                 icon: Truck,        iconCls: 'bg-primary/10 text-primary' },
          { label: 'Confirmed',          value: kpi.confirmed,             icon: CheckCircle,  iconCls: 'bg-accent/10 text-accent'   },
          { label: 'Partially Received', value: kpi.partial,               icon: Clock,        iconCls: 'bg-amber-100 text-amber-600' },
          { label: 'Total Spend',        value: formatINR(kpi.totalValue), icon: TrendingUp,   iconCls: 'bg-green-100 text-green-600' },
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

      <div className="card mb-4">
        <div className="flex flex-wrap gap-1 mb-4">
          {FILTER_TABS.map(tab => (
            <button key={tab.value} onClick={() => setFilter(tab.value)}
              className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-all duration-150 ${
                filter === tab.value ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-bg-light'
              }`}>{tab.label}</button>
          ))}
        </div>
        <div className="search-bar">
          <Search className="search-icon" />
          <input className="input pl-10" placeholder="Search by PO number or vendor…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <motion.div className="table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <table className="table">
          <thead>
            <tr>
              <th>PO Number</th><th>Vendor</th><th>Date</th><th>Status</th>
              <th>Items</th><th className="text-right">Total Amount</th><th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-6 py-4"><div className="h-4 bg-bg-light animate-pulse rounded" /></td></tr>
                ))
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="py-0">
                  <EmptyState icon={Package} title="No purchase orders found"
                    description={search ? 'Try a different search term' : 'Create your first purchase order'}
                    action={!search && <Link to="/purchase/create" className="btn-primary btn-sm mt-2"><Plus className="w-3.5 h-3.5" />Create PO</Link>}
                  />
                </td></tr>
              ) : (
                orders.map((order, i) => (
                  <motion.tr key={order.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ delay: i * 0.03 }} className="cursor-pointer hover:bg-bg-surface/60"
                    onClick={() => navigate(`/purchase/${order.id}`)}>
                    <td><span className="font-mono text-sm font-semibold text-primary">{order.orderNumber ?? order.id}</span></td>
                    <td><span className="font-medium text-text-primary">{order.vendor?.name ?? '—'}</span></td>
                    <td className="text-text-secondary text-sm">{formatDate(order.createdAt)}</td>
                    <td><StatusBadge status={labelStatus(order.status)} /></td>
                    <td className="text-text-muted text-sm">{order.items?.length ?? 0} item(s)</td>
                    <td className="text-right font-semibold text-text-primary">{formatINR(order.totalAmount ?? 0)}</td>
                    <td className="text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Link to={`/purchase/${order.id}`} className="btn-ghost btn-icon btn-sm" title="View">
                          <Eye className="w-4 h-4" />
                        </Link>
                        {(user?.role === 'ADMIN' || user?.role === 'BUSINESS_OWNER') && (
                          <button onClick={() => handleDelete(order.id)} className="btn-ghost btn-icon btn-sm hover:text-danger" title="Delete">
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
    </PageWrapper>
  );
}
