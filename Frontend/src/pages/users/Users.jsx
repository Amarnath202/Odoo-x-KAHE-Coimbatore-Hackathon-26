import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, User as UserIcon, Mail, Shield, Calendar, Activity, MapPin, Phone } from 'lucide-react';
import { PageWrapper, Pagination } from '../../components/UI';
import Modal from '../../components/Modal';
import { usersApi } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';

// Removed dynamic avatars, using static uploaded avatar

export default function Users() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const res = await usersApi.list(params);
      const items = res?.data?.items ?? res?.data ?? res?.items ?? [];
      setUsers(items);
    } catch (err) {
      console.error(err);
      toast('Failed to load users', 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [fetchUsers]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const paginatedUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({ message: 'Are you sure you want to delete this user?' });
    if (!isConfirmed) return;
    try {
      await usersApi.delete(id);
      toast('User deleted successfully', 'success');
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Failed to delete user', 'error');
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-700';
      case 'BUSINESS_OWNER':
        return 'bg-blue-100 text-blue-700';
      case 'SALES_USER':
        return 'bg-accent/10 text-accent';
      case 'PURCHASE_USER':
        return 'bg-warning/10 text-warning';
      case 'MANUFACTURING_USER':
        return 'bg-status-progress/10 text-status-progress';
      case 'INVENTORY_MANAGER':
        return 'bg-success/10 text-success';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system access, roles, and user accounts.</p>
        </div>
        <Link to="/users/create" className="btn-primary btn-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Create User
        </Link>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-center justify-between">
        <div className="search-bar w-full md:max-w-md">
          <Search className="search-icon text-text-muted" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-6 h-32 flex items-center justify-center">
              <div className="h-10 w-full bg-bg-light animate-pulse rounded" />
            </div>
          ))
        ) : users.length === 0 ? (
          <div className="col-span-full card py-12 text-center text-text-muted text-sm">
            No users found.
          </div>
        ) : (
          paginatedUsers.map(u => (
            <div 
              key={u.id} 
              className="card hover:shadow-lg transition-shadow cursor-pointer relative"
              onClick={() => setSelectedUser(u)}
            >
              <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
                <Link
                  to={`/users/${u.id}/edit`}
                  className="p-1 text-text-secondary hover:text-accent transition-colors bg-bg-surface rounded"
                  onClick={e => e.stopPropagation()}
                >
                  <Edit className="w-4 h-4" />
                </Link>
                {(user?.role === 'ADMIN' || user?.role === 'BUSINESS_OWNER') && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDelete(u.id);
                    }}
                    className="p-1 text-text-secondary hover:text-danger transition-colors bg-bg-surface rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <img 
                    src="/avatar-user.png" 
                    alt={u.name} 
                    className="w-12 h-12 rounded-full object-cover shrink-0 shadow-sm border-2 border-bg-light"
                  />
                  <div className="pr-12 min-w-0">
                    <h3 className="font-semibold text-text-primary truncate text-base">{u.name}</h3>
                    <p className="text-sm text-text-muted truncate">{u.email}</p>
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap gap-2 pt-2 border-t border-border">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${getRoleBadgeColor(u.role)}`}>
                    {u.role?.replace(/_/g, ' ') || 'Unknown'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${u.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {!loading && users.length > 0 && (
        <div className="mt-4 card p-0 overflow-hidden bg-bg-surface border border-border/40">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

      {/* User Details Modal */}
      <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Information">
        {selectedUser && (
          <div className="p-2">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
              <img 
                src="/avatar-user.png" 
                alt={selectedUser.name} 
                className="w-16 h-16 rounded-full object-cover shrink-0 shadow-glow border-2 border-bg-light"
              />
              <div>
                <h3 className="text-xl font-bold text-text-primary">{selectedUser.name}</h3>
                <span className={`inline-flex items-center mt-1 px-2.5 py-0.5 rounded text-xs font-semibold ${getRoleBadgeColor(selectedUser.role)}`}>
                  {selectedUser.role?.replace(/_/g, ' ') || 'Unknown'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-5 h-5 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Email ID</p>
                  <p className="font-medium text-text-primary">{selectedUser.email || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-5 h-5 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Mobile Number</p>
                  <p className="font-medium text-text-primary">{selectedUser.phone || 'Not Provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-5 h-5 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Address</p>
                  <p className="font-medium text-text-primary">{selectedUser.address || 'Not Provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Shield className="w-5 h-5 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Account Status</p>
                  <p className="font-medium text-text-primary">{selectedUser.isActive !== false ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-5 h-5 text-text-muted" />
                <div>
                  <p className="text-xs text-text-muted">Joined On</p>
                  <p className="font-medium text-text-primary">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    }) : '—'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-border">
              <Link to={`/users/${selectedUser.id}/edit`} className="btn-secondary">
                Edit User
              </Link>
              <button onClick={() => setSelectedUser(null)} className="btn-primary">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
}
