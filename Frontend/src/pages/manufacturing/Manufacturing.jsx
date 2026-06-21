import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Plus, Search, Eye, TrendingUp, Clock, CheckCircle, Play, Package, Trash2 } from 'lucide-react';
import { PageWrapper, EmptyState, formatDate, Pagination } from '../../components/UI';
import StatusBadge from '../../components/StatusBadge';
import { manufacturingApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

const FILTER_TABS = [
  { label: 'All',                   value: '' },
  { label: 'Draft',                 value: 'DRAFT' },
  { label: 'Waiting for Materials', value: 'WAITING_FOR_MATERIALS' },
  { label: 'Ready',                 value: 'READY_FOR_PRODUCTION' },
  { label: 'In Production',         value: 'IN_PRODUCTION' },
  { label: 'Completed',             value: 'COMPLETED' },
  { label: 'Cancelled',             value: 'CANCELLED' },
];

function labelStatus(s) {
  const M = { 
    DRAFT:'Draft', 
    WAITING_FOR_MATERIALS: 'Waiting Materials', 
    READY_FOR_PRODUCTION: 'Ready', 
    IN_PRODUCTION:'In Production', 
    COMPLETED:'Completed', 
    CANCELLED:'Cancelled' 
  };
  return M[s] ?? s;
}

export default function Manufacturing() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (user?.companyId) params.companyId = user.companyId;
      if (filter) params.status = filter;
      if (search.trim()) params.search = search.trim();
      const res = await manufacturingApi.list(params);
      setOrders(res?.data?.items ?? res?.data ?? []);
    } catch { setOrders([]); } finally { setLoading(false); }
  }, [filter, search, user?.companyId]);

  useEffect(() => { const t = setTimeout(fetchOrders, 300); return () => clearTimeout(t); }, [fetchOrders]);
  useEffect(() => { setCurrentPage(1); }, [filter, search]);

  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({ message: 'Are you sure you want to delete this manufacturing order?' });
    if (!isConfirmed) return;
    try {
      await manufacturingApi.delete(id);
      toast('Manufacturing order deleted successfully', 'success');
      fetchOrders();
    } catch (err) {
      toast(err.message || 'Failed to delete manufacturing order', 'error');
    }
  };

  const kpi = {
    total: orders.length,
    waiting: orders.filter(o => o.status === 'WAITING_FOR_MATERIALS').length,
    ready: orders.filter(o => o.status === 'READY_FOR_PRODUCTION').length,
    inProduction: orders.filter(o => o.status === 'IN_PRODUCTION').length,
    completed: orders.filter(o => o.status === 'COMPLETED').length,
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manufacturing Orders</h1>
          <p className="page-subtitle">{orders.length} orders in the production pipeline</p>
        </div>
        <Link to="/manufacturing/create" className="btn-primary">
          <Plus className="w-4 h-4" />New Manufacturing Order
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Orders', value: kpi.total,      icon: Wrench,       iconCls: 'bg-primary/10 text-primary' },
          { label: 'Waiting Mat.', value: kpi.waiting,    icon: Package,      iconCls: 'bg-orange-100 text-orange-600' },
          { label: 'Ready',        value: kpi.ready,      icon: CheckCircle,  iconCls: 'bg-accent/10 text-accent' },
          { label: 'In Production',value: kpi.inProduction,icon: Clock,       iconCls: 'bg-amber-100 text-amber-600' },
          { label: 'Completed',    value: kpi.completed,  icon: TrendingUp,   iconCls: 'bg-green-100 text-green-600' },
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
              className={`px-3 py-1.5 rounded-btn text-xs font-medium transition-all ${
                filter === tab.value ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:bg-bg-light'
              }`}>{tab.label}</button>
          ))}
        </div>
        <div className="search-bar">
          <Search className="search-icon" />
          <input className="input pl-10" placeholder="Search by MO number or product…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <motion.div className="table-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <table className="table">
          <thead>
            <tr>
              <th>MO Number</th><th>Product</th><th>Qty</th><th>Date</th>
              <th>Status</th><th>Auto-Generated</th><th className="text-center">Actions</th>
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
                  <EmptyState icon={Package} title="No manufacturing orders found"
                    description={search ? 'Try a different search term' : 'Create your first manufacturing order'}
                    action={!search && <Link to="/manufacturing/create" className="btn-primary btn-sm mt-2"><Plus className="w-3.5 h-3.5" />New MO</Link>}
                  />
                </td></tr>
              ) : (
                paginatedOrders.map((order, i) => (
                  <motion.tr key={order.id}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="cursor-pointer hover:bg-bg-surface/60"
                    onClick={() => navigate(`/manufacturing/${order.id}`)}>
                    <td><span className="font-mono text-sm font-semibold text-primary">{order.orderNumber ?? order.id}</span></td>
                    <td>
                      <p className="font-medium text-text-primary">{order.product?.name ?? '—'}</p>
                      <p className="text-xs text-text-muted font-mono">{order.product?.sku ?? ''}</p>
                    </td>
                    <td className="font-semibold">{order.quantity}</td>
                    <td className="text-text-secondary text-sm">{formatDate(order.createdAt)}</td>
                    <td><StatusBadge status={labelStatus(order.status)} /></td>
                    <td className="text-center">
                      {order.autoGenerated ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-warning/10 text-warning font-medium">Auto</span>
                      ) : '—'}
                    </td>
                    <td className="text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Link to={`/manufacturing/${order.id}`} className="btn-ghost btn-icon btn-sm" title="View">
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
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </PageWrapper>
  );
}
