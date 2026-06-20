import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, FileText, User } from 'lucide-react';
import { PageWrapper } from '../../components/UI';
import { getStore, STORES } from '../../utils/storage';
import { formatDateTime } from '../../components/UI';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');

  useEffect(() => {
    // Sort logs by timestamp descending
    const rawLogs = getStore(STORES.AUDIT_LOGS).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setLogs(rawLogs);
  }, []);

  const filteredLogs = logs.filter(log => {
    const searchStr = `${log.user || ''} ${log.action || ''} ${log.reference || ''}`.toLowerCase();
    const searchMatch = searchStr.includes(searchTerm.toLowerCase());
    const moduleMatch = moduleFilter === 'All' || log.module === moduleFilter;
    return searchMatch && moduleMatch;
  });

  const modules = ['All', ...new Set(logs.map(l => l.module).filter(Boolean))];

  const getActionColor = (action) => {
    if (action === 'Created') return 'text-green-600 bg-green-50';
    if (action === 'Modified' || action === 'Updated') return 'text-blue-600 bg-blue-50';
    if (action === 'Deleted') return 'text-red-600 bg-red-50';
    if (action === 'Status Change') return 'text-orange-600 bg-orange-50';
    return 'text-text-secondary bg-bg-light';
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-primary" />
            Audit Logs
          </h1>
          <p className="page-subtitle">System-wide trail of user actions, modifications, and state changes.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-center">
        <div className="search-bar w-full md:max-w-sm">
          <Search className="search-icon" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search user, action, or reference..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="select w-full md:w-48" value={moduleFilter} onChange={e => setModuleFilter(e.target.value)}>
          {modules.map(m => (
            <option key={m} value={m}>{m === 'All' ? 'All Modules' : m}</option>
          ))}
        </select>
      </div>

      {/* Logs Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr className="bg-bg-surface/50 border-b border-border">
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Timestamp</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">User</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Module</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Action</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Reference</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-muted text-sm bg-white">
                    No audit logs match your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="border-b border-border hover:bg-black/[0.01]">
                    <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{log.user || 'System'}</p>
                          <p className="text-xs text-text-muted">{log.role || 'Auto'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg-light text-text-secondary text-xs font-semibold border border-border">
                        <FileText className="w-3 h-3" />
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-primary font-mono bg-bg-light px-2 py-0.5 rounded border border-border">
                        {log.reference}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs truncate text-xs text-text-muted font-mono bg-bg-surface p-1.5 rounded border border-border" title={JSON.stringify(log.newValue || log.details)}>
                        {JSON.stringify(log.newValue || log.details || '-')}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
}
