import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, SlidersHorizontal, AlertTriangle, TrendingUp, Download } from 'lucide-react';
import { PageWrapper, EmptyState, Pagination } from '../../components/UI';
import { inventoryApi, warehousesApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Inventory() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const toast = useToast();

  // Load warehouses once
  useEffect(() => {
    const params = user?.companyId ? { companyId: user.companyId } : {};
    warehousesApi.list(params)
      .then(res => setWarehouses(res?.data?.items ?? res?.data ?? []))
      .catch(() => {});
  }, [user?.companyId]);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (user?.companyId) params.companyId = user.companyId;
      if (warehouseId) params.warehouseId = warehouseId;
      const res = await inventoryApi.list(params);
      const items = res?.data?.items ?? res?.data ?? [];
      // Client-side search filter
      setInventory(search.trim()
        ? items.filter(i => i.product?.name?.toLowerCase().includes(search.toLowerCase()) || i.product?.sku?.toLowerCase().includes(search.toLowerCase()))
        : items
      );
    } catch { setInventory([]); } finally { setLoading(false); }
  }, [warehouseId, user?.companyId, search]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);
  useEffect(() => { setCurrentPage(1); }, [search, warehouseId]);

  const totalPages = Math.ceil(inventory.length / itemsPerPage);
  const paginatedInventory = inventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const kpi = {
    total: inventory.length,
    lowStock: inventory.filter(i => (i.freeToUseQty ?? 0) < 10 && (i.freeToUseQty ?? 0) >= 0).length,
    outOfStock: inventory.filter(i => (i.onHandQty ?? 0) <= 0).length,
    totalValue: inventory.reduce((s, i) => s + ((i.onHandQty ?? 0) * (i.product?.costPrice ?? 0)), 0),
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'BUSINESS_OWNER') && (
          <div className="flex items-center">
            <button 
              onClick={async () => {
                try {
                  setExporting(true);
                  await inventoryApi.export();
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
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Products', value: kpi.total,        icon: Package,       iconCls: 'bg-primary/10 text-primary' },
          { label: 'Low Stock',      value: kpi.lowStock,     icon: AlertTriangle, iconCls: 'bg-warning/10 text-warning' },
          { label: 'Out of Stock',   value: kpi.outOfStock,   icon: AlertTriangle, iconCls: 'bg-red-100 text-red-600'    },
          { label: 'Total SKUs',     value: inventory.length, icon: TrendingUp,    iconCls: 'bg-green-100 text-green-600' },
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

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-center">
        <div className="search-bar w-full md:max-w-md">
          <Search className="search-icon text-text-muted" />
          <input type="text" className="input pl-10" placeholder="Search by product name or SKU…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-text-muted shrink-0" />
          <select className="select min-w-[180px]" value={warehouseId} onChange={e => setWarehouseId(e.target.value)}>
            <option value="">All Warehouses</option>
            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr className="bg-bg-surface/50 border-b border-border">
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Product</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Warehouse</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-text-secondary font-semibold">On Hand</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-text-secondary font-semibold">Reserved</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-text-secondary font-semibold">Free to Use</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-text-secondary font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-4 bg-bg-light animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : inventory.length === 0 ? (
                <tr><td colSpan={6} className="py-0">
                  <EmptyState icon={Package} title="No inventory records found"
                    description="Stock will appear here once goods are received from Purchase Orders" />
                </td></tr>
              ) : (
                paginatedInventory.map((item, i) => {
                  const onHand    = item.onHandQty    ?? 0;
                  const reserved  = item.reservedQty  ?? 0;
                  const freeToUse = item.freeToUseQty ?? 0;
                  const isLow     = freeToUse < 10 && freeToUse > 0;
                  const isOut     = onHand <= 0;

                  return (
                    <motion.tr key={item.id ?? i}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="border-b border-border hover:bg-black/[0.01]">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-text-primary">{item.product?.name ?? '—'}</p>
                        <p className="text-xs text-text-muted font-mono">{item.product?.sku ?? ''}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">{item.warehouse?.name ?? '—'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-base font-bold text-text-primary">{onHand}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-base font-semibold text-orange-500">{reserved}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-base font-bold ${isOut ? 'text-danger' : isLow ? 'text-warning' : 'text-success'}`}>
                          {freeToUse}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isOut ? 'bg-red-100 text-red-700' : isLow ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOut ? 'bg-red-500' : isLow ? 'bg-yellow-500' : 'bg-green-500'}`} />
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </PageWrapper>
  );
}
