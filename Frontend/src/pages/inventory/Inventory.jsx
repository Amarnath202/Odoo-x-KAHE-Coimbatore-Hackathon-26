import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, SlidersHorizontal, AlertTriangle, TrendingUp } from 'lucide-react';
import { PageWrapper, EmptyState } from '../../components/UI';
import { inventoryApi, warehousesApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function Inventory() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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
          <p className="page-subtitle">Real-time stock levels across all warehouses</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Products', value: kpi.total,        icon: Package,       color: 'bg-primary/10 text-primary'  },
          { label: 'Low Stock',      value: kpi.lowStock,     icon: AlertTriangle, color: 'bg-warning/10 text-warning'  },
          { label: 'Out of Stock',   value: kpi.outOfStock,   icon: AlertTriangle, color: 'bg-danger/10 text-danger'    },
          { label: 'Total SKUs',     value: inventory.length, icon: TrendingUp,    color: 'bg-success/10 text-success'  },
        ].map((k, i) => (
          <motion.div key={k.label} className="card flex items-center gap-3 py-4"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
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
                inventory.map((item, i) => {
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
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">{item.product?.name ?? '—'}</p>
                            <p className="text-xs text-text-muted font-mono">{item.product?.sku ?? ''}</p>
                          </div>
                        </div>
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
                          isOut ? 'bg-danger/10 text-danger' : isLow ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOut ? 'bg-danger' : isLow ? 'bg-warning' : 'bg-success'}`} />
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
      </div>
    </PageWrapper>
  );
}
