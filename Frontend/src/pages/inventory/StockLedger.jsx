import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, History, Package } from 'lucide-react';
import { PageWrapper, EmptyState, formatDateTime, Pagination } from '../../components/UI';
import { stockLedgerApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function StockLedger() {
  const { user } = useAuth();
  const [ledger, setLedger] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (user?.companyId) params.companyId = user.companyId;
      if (typeFilter) params.movementType = typeFilter;
      const res = await stockLedgerApi.list(params);
      const items = res?.data?.items ?? res?.data ?? [];
      setLedger(search.trim()
        ? items.filter(i =>
            i.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
            i.reference?.toLowerCase().includes(search.toLowerCase())
          )
        : items
      );
    } catch { setLedger([]); } finally { setLoading(false); }
  }, [typeFilter, search, user?.companyId]);

  useEffect(() => { const t = setTimeout(fetchLedger, 300); return () => clearTimeout(t); }, [fetchLedger]);
  useEffect(() => { setCurrentPage(1); }, [search, typeFilter]);

  const totalPages = Math.ceil(ledger.length / itemsPerPage);
  const paginatedLedger = ledger.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Ledger</h1>
          <p className="page-subtitle">Track all inventory movements and stock changes over time.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6 items-center">
        <div className="search-bar w-full md:max-w-md">
          <Search className="search-icon text-text-muted" />
          <input type="text" className="input pl-10" placeholder="Search by product name or reference..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-text-muted shrink-0" />
          <select className="select min-w-[150px]" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Movement Types</option>
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
            <option value="RESERVE">Reserved</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>
        </div>
      </div>

      {/* Table inside card — pagination lives inside too */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr className="bg-bg-surface/50 border-b border-border">
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Date/Time</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Product</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-text-secondary font-semibold">Type</th>
                <th className="px-6 py-4 text-right text-xs uppercase tracking-wider text-text-secondary font-semibold">Quantity</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Reference</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="h-4 bg-bg-light animate-pulse rounded" />
                      </td>
                    </tr>
                  ))
                ) : ledger.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-0">
                      <EmptyState icon={History} title="No stock ledger entries found"
                        description={search ? 'Try adjusting your search criteria' : 'Entries will appear here as stock moves'} />
                    </td>
                  </tr>
                ) : (
                  paginatedLedger.map((entry, i) => (
                    <motion.tr key={entry.id ?? i}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }} className="border-b border-border hover:bg-black/[0.01]">
                      <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">
                        {formatDateTime(entry.createdAt ?? entry.date)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-text-muted" />
                          <span className="text-sm font-medium text-text-primary">{entry.product?.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase ${
                          entry.movementType === 'IN' ? 'bg-success/10 text-success' :
                          entry.movementType === 'OUT' ? 'bg-danger/10 text-danger' :
                          entry.movementType === 'RESERVE' ? 'bg-warning/10 text-warning' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {entry.movementType}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right text-sm font-bold ${
                        entry.quantity > 0 ? 'text-success' : entry.quantity < 0 ? 'text-danger' : 'text-text-secondary'
                      }`}>
                        {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-accent bg-accent/5 px-2 py-1 rounded">
                          {entry.reference ?? '—'}
                        </span>
                        {entry.notes && (
                          <p className="text-[10px] text-text-muted mt-1 truncate max-w-[200px]">{entry.notes}</p>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </PageWrapper>
  );
}
