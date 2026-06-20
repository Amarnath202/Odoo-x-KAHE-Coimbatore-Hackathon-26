import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth, ROLES } from '../context/AuthContext';
import { User, Mail, Shield, Clock, Key, Activity, Plus } from 'lucide-react';
import { passwordChangeApi } from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reason, setReason] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const [resettingId, setResettingId] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await passwordChangeApi.myRequests();
      const items = res?.data?.items ?? res?.data ?? res?.items ?? [];
      setRequests(items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return toast('Please enter a reason', 'error');
    setSubmittingRequest(true);
    try {
      await passwordChangeApi.request({ reason });
      toast('Password change request submitted', 'success');
      setReason('');
      setShowRequestForm(false);
      fetchRequests();
    } catch (err) {
      toast(err.message || 'Failed to submit request', 'error');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleResetSubmit = async (e, requestId) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast('Password must be at least 8 characters', 'error');
    setSubmittingReset(true);
    try {
      await passwordChangeApi.reset({ requestId, newPassword });
      toast('Password changed successfully!', 'success');
      setNewPassword('');
      setResettingId(null);
      fetchRequests();
    } catch (err) {
      toast(err.message || 'Failed to reset password', 'error');
    } finally {
      setSubmittingReset(false);
    }
  };

  const roleColor = {
    [ROLES.ADMIN]: 'bg-primary',
    [ROLES.BUSINESS_OWNER]: 'bg-primary',
    [ROLES.SALES_USER]: 'bg-accent',
    [ROLES.PURCHASE_USER]: 'bg-warning',
    [ROLES.MANUFACTURING_USER]: 'bg-status-progress',
    [ROLES.INVENTORY_MANAGER]: 'bg-success',
  };

  const getRoleColor = (role) => roleColor[role] || 'bg-text-muted';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Your Profile</h1>
          <p className="text-text-muted text-sm mt-1">Manage your personal information and account settings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 card relative overflow-hidden"
        >
          {/* Decorative background */}
          <div className={`absolute top-0 left-0 w-full h-32 opacity-20 ${getRoleColor(user?.role)} bg-gradient-to-br from-white/10 to-black/10`} />

          <div className="relative pt-16 flex flex-col items-center">
            {/* Avatar */}
            <div className={`w-24 h-24 rounded-full border-4 border-bg-surface flex items-center justify-center text-4xl font-bold text-white shadow-xl ${getRoleColor(user?.role)}`}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>

            <h2 className="text-xl font-bold text-text-primary mt-4">{user?.name}</h2>
            <span className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold text-white ${getRoleColor(user?.role)}`}>
              {user?.role?.replace('_', ' ')}
            </span>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-bg-light flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-text-muted" />
              </div>
              <div className="min-w-0">
                <p className="text-text-muted text-xs">Email Address</p>
                <p className="text-text-primary font-medium truncate">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-bg-light flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-text-muted" />
              </div>
              <div>
                <p className="text-text-muted text-xs">Account Role</p>
                <p className="text-text-primary font-medium">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-bg-light flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-text-muted" />
              </div>
              <div>
                <p className="text-text-muted text-xs">Last Login</p>
                <p className="text-text-primary font-medium">
                  {user?.loginTime ? new Date(user.loginTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Account Settings Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="card">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-muted">Full Name</label>
                <div className="px-4 py-2 bg-bg-light rounded-btn text-sm text-text-primary border border-border">
                  {user?.name}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-muted">Email Address</label>
                <div className="px-4 py-2 bg-bg-light rounded-btn text-sm text-text-primary border border-border">
                  {user?.email}
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
              <Activity className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-text-muted leading-relaxed">
                Your personal information is managed by your system administrator. If you need to update your name or email address, please contact support or your organization's admin.
              </p>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />
              Security Settings & Password Requests
            </h3>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border">
              <div>
                <p className="text-sm font-medium text-text-primary">Password Change Request</p>
                <p className="text-xs text-text-muted mt-1">You must request admin approval to change your password.</p>
              </div>
              <button
                onClick={() => setShowRequestForm(!showRequestForm)}
                className="btn-secondary whitespace-nowrap"
              >
                {showRequestForm ? 'Cancel' : 'Request Change'}
              </button>
            </div>

            {showRequestForm && (
              <form onSubmit={handleRequestSubmit} className="mt-4 p-4 rounded-xl bg-bg-light border border-border">
                <label className="block text-sm font-medium text-text-primary mb-2">Reason for change</label>
                <textarea
                  className="input w-full min-h-[80px] mb-3"
                  placeholder="E.g., Need to change password for security reasons..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary w-full" disabled={submittingRequest}>
                  {submittingRequest ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            )}

            {/* Requests List */}
            <div className="mt-6">
              <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">Your Requests</h4>
              {loadingRequests ? (
                <p className="text-sm text-text-muted">Loading requests...</p>
              ) : requests.length === 0 ? (
                <p className="text-sm text-text-muted italic">No password change requests found.</p>
              ) : (
                <div className="space-y-3">
                  {requests.map(r => (
                    <div key={r.id} className="p-4 rounded-xl border border-border flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${r.status === 'APPROVED' ? 'bg-success/10 text-success' :
                              r.status === 'REJECTED' ? 'bg-danger/10 text-danger' :
                                r.status === 'PENDING' ? 'bg-warning/10 text-warning' :
                                  'bg-primary/10 text-primary'
                            }`}>
                            {r.status}
                          </span>
                          <p className="text-xs text-text-muted mt-1">{new Date(r.createdAt).toLocaleString()}</p>
                        </div>
                        {r.status === 'APPROVED' && resettingId !== r.id && (
                          <button
                            onClick={() => setResettingId(r.id)}
                            className="btn-primary btn-sm"
                          >
                            Set New Password
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary bg-bg-light p-2 rounded">{r.reason}</p>

                      {resettingId === r.id && (
                        <form onSubmit={(e) => handleResetSubmit(e, r.id)} className="mt-2 pt-3 border-t border-border">
                          <label className="block text-sm font-medium text-text-primary mb-2">New Password</label>
                          <input
                            type="password"
                            className="input w-full mb-3"
                            placeholder="Min 8 characters"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => { setResettingId(null); setNewPassword(''); }}
                              className="btn-secondary btn-sm"
                            >
                              Cancel
                            </button>
                            <button type="submit" className="btn-primary btn-sm" disabled={submittingReset}>
                              {submittingReset ? 'Saving...' : 'Update Password'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
