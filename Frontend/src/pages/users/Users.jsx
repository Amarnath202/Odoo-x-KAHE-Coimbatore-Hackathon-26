import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, User as UserIcon } from 'lucide-react';
import PageWrapper from '../../components/UI';
import { usersApi } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function Users() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
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

      {/* Users Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr className="bg-bg-surface/50 border-b border-border">
                <th className="px-6 py-4 text-left font-semibold text-text-secondary text-xs uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary text-xs uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-center font-semibold text-text-secondary text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center font-semibold text-text-secondary text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={4} className="px-6 py-4">
                      <div className="h-4 bg-bg-light animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-text-muted text-sm bg-white">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="border-b border-border hover:bg-black/[0.01]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          {u.name?.[0]?.toUpperCase() || <UserIcon className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{u.name}</p>
                          <p className="text-xs text-text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${getRoleBadgeColor(u.role)}`}>
                        {u.role?.replace(/_/g, ' ') || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        u.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {u.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/users/${u.id}/edit`}
                          className="p-1 text-text-secondary hover:text-accent transition-colors tooltip"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="tooltip-content">Edit User</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-1 text-text-secondary hover:text-danger transition-colors tooltip"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="tooltip-content">Delete User</span>
                        </button>
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
