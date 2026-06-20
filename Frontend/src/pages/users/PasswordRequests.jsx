import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Check, X } from 'lucide-react';
import PageWrapper from '../../components/UI';
import { passwordChangeApi } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function PasswordRequests() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await passwordChangeApi.adminGetAll();
      const items = res?.data?.items ?? res?.data ?? res?.items ?? [];
      setRequests(items);
    } catch (err) {
      console.error(err);
      toast('Failed to load password requests', 'error');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this password change request?')) return;
    try {
      await passwordChangeApi.adminApprove(id);
      toast('Request approved', 'success');
      fetchRequests();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Failed to approve request', 'error');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this password change request?')) return;
    try {
      await passwordChangeApi.adminReject(id);
      toast('Request rejected', 'success');
      fetchRequests();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Failed to reject request', 'error');
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-warning/10 text-warning';
      case 'APPROVED':
        return 'bg-success/10 text-success';
      case 'REJECTED':
        return 'bg-danger/10 text-danger';
      case 'COMPLETED':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <h1 className="page-title">Password Change Requests</h1>
          <p className="page-subtitle">Review and approve user requests to change their passwords.</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden mt-4">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr className="bg-bg-surface/50 border-b border-border">
                <th className="px-6 py-4 text-left font-semibold text-text-secondary text-xs uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary text-xs uppercase tracking-wider">Reason</th>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary text-xs uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-center font-semibold text-text-secondary text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center font-semibold text-text-secondary text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={5} className="px-6 py-4">
                      <div className="h-4 bg-bg-light animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-text-muted text-sm bg-white">
                    No password change requests found.
                  </td>
                </tr>
              ) : (
                requests.map(r => (
                  <tr key={r.id} className="border-b border-border hover:bg-black/[0.01]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{r.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-text-muted">{r.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-secondary">{r.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-secondary">
                        {new Date(r.createdAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getStatusBadgeColor(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {r.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleApprove(r.id)}
                              className="p-1 text-success hover:bg-success/10 rounded transition-colors tooltip"
                            >
                              <Check className="w-4 h-4" />
                              <span className="tooltip-content">Approve Request</span>
                            </button>
                            <button
                              onClick={() => handleReject(r.id)}
                              className="p-1 text-danger hover:bg-danger/10 rounded transition-colors tooltip"
                            >
                              <X className="w-4 h-4" />
                              <span className="tooltip-content">Reject Request</span>
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-text-muted italic">-</span>
                        )}
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
