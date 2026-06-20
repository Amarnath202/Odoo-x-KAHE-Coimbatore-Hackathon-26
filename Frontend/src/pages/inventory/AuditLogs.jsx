import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, Activity, FileText, Download } from 'lucide-react';
import { PageWrapper, EmptyState, formatDateTime } from '../../components/UI';
import { auditLogsApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function AuditLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [exportMonth, setExportMonth] = useState('');
  const [exportYear, setExportYear] = useState('');
  const [exporting, setExporting] = useState(false);
  const toast = useToast();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (user?.companyId) params.companyId = user.companyId;
      if (moduleFilter) params.module = moduleFilter;
      
      const res = await auditLogsApi.list(params);
      const items = res?.data?.items ?? res?.data ?? [];
      
      setLogs(search.trim()
        ? items.filter(i => 
            i.action?.toLowerCase().includes(search.toLowerCase()) || 
            i.reference?.toLowerCase().includes(search.toLowerCase()) ||
            i.user?.name?.toLowerCase().includes(search.toLowerCase())
          )
        : items
      );
    } catch { setLogs([]); } finally { setLoading(false); }
  }, [moduleFilter, search, user?.companyId]);

  useEffect(() => { const t = setTimeout(fetchLogs, 300); return () => clearTimeout(t); }, [fetchLogs]);

  return (
    <PageWrapper>
      <div className="page-header flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Complete history of system actions and changes.</p>
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
                    await auditLogsApi.export({ 
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
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6 items-center">
        <div className="search-bar w-full md:max-w-md">
          <Search className="search-icon text-text-muted" />
          <input type="text" className="input pl-10" placeholder="Search by action, reference, or user..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-text-muted shrink-0" />
          <select className="select min-w-[150px]" value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
            <option value="">All Modules</option>
            <option value="Sales">Sales</option>
            <option value="Purchase">Purchase</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Inventory">Inventory</option>
            <option value="BOM">BOM</option>
          </select>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr className="bg-bg-surface/50 border-b border-border">
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Date/Time</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">User</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Module</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Action</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Reference</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border"><td colSpan={5} className="px-6 py-4"><div className="h-4 bg-bg-light animate-pulse rounded" /></td></tr>
                  ))
                ) : logs.length === 0 ? (
                  <tr><td colSpan={5} className="py-0">
                    <EmptyState icon={Activity} title="No audit logs found"
                      description={search ? 'Try adjusting your search criteria' : 'System events will appear here'} />
                  </td></tr>
                ) : (
                  logs.map((log, i) => (
                    <motion.tr key={log.id ?? i}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }} className="border-b border-border hover:bg-black/[0.01]">
                      <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">
                        {formatDateTime(log.createdAt ?? log.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-text-primary">{log.user?.name ?? log.userName ?? 'System'}</p>
                        <p className="text-[10px] text-text-muted mt-0.5">{log.user?.role ?? log.role ?? ''}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-bg-light border border-border">
                          {log.module}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-primary font-medium">{log.action}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-accent">
                          {log.reference ?? log.entityId ?? '—'}
                        </span>
                        {log.details && (
                          <div className="mt-1 flex gap-2 text-[10px] text-text-muted">
                            {log.details.oldValue && <span>Old: {JSON.stringify(log.details.oldValue)}</span>}
                            {log.details.newValue && <span>New: {JSON.stringify(log.details.newValue)}</span>}
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
}
