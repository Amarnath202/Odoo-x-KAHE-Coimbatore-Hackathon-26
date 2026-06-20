import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Users } from 'lucide-react';
import { PageWrapper } from '../../components/UI';
import Modal from '../../components/Modal';
import { vendorsApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function VendorList() {
  const { user } = useAuth();
  const toast = useToast();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await vendorsApi.list(user?.companyId ? { companyId: user.companyId } : {});
      setVendors(res.data?.items ?? res.data ?? []);
    } catch (err) {
      toast('Failed to load vendors', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [user?.companyId]);

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (v.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (vendor = null) => {
    if (vendor) {
      setEditingVendor(vendor);
      setForm({
        name: vendor.name || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        address: vendor.address || ''
      });
    } else {
      setEditingVendor(null);
      setForm({ name: '', email: '', phone: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVendor(null);
    setForm({ name: '', email: '', phone: '', address: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('Vendor name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...form, companyId: user?.companyId };
      if (editingVendor) {
        await vendorsApi.update(editingVendor.id, payload);
        toast('Vendor updated successfully', 'success');
      } else {
        await vendorsApi.create(payload);
        toast('Vendor created successfully', 'success');
      }
      closeModal();
      fetchVendors();
    } catch (err) {
      toast(err.message || 'Failed to save vendor', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) return;
    try {
      await vendorsApi.delete(id);
      toast('Vendor deleted', 'success');
      fetchVendors();
    } catch (err) {
      toast(err.message || 'Failed to delete vendor', 'error');
    }
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Vendor Management
          </h1>
          <p className="page-subtitle">Manage your suppliers and procurement contacts.</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary btn-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      <div className="search-bar w-full md:max-w-md mb-6">
        <Search className="search-icon text-text-muted" />
        <input
          type="text"
          className="input pl-10"
          placeholder="Search vendors..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr className="bg-bg-surface/50 border-b border-border">
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Name</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Email</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Phone</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-text-secondary font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-text-muted text-sm bg-white">
                    Loading vendors...
                  </td>
                </tr>
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-text-muted text-sm bg-white">
                    No vendors found.
                  </td>
                </tr>
              ) : (
                filteredVendors.map(v => (
                  <tr key={v.id} className="border-b border-border hover:bg-black/[0.01]">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-text-primary">{v.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-secondary">{v.email || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-secondary">{v.phone || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openModal(v)} className="p-1 text-text-secondary hover:text-accent transition-colors tooltip">
                          <Edit className="w-4 h-4" />
                          <span className="tooltip-content">Edit</span>
                        </button>
                        <button onClick={() => handleDelete(v.id)} className="p-1 text-text-secondary hover:text-danger transition-colors tooltip">
                          <Trash2 className="w-4 h-4" />
                          <span className="tooltip-content">Delete</span>
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

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingVendor ? 'Edit Vendor' : 'Add Vendor'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">Vendor Name *</label>
            <input
              type="text"
              className="input"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="label">Phone Number</label>
            <input
              type="text"
              className="input"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="label">Address</label>
            <textarea
              className="input"
              rows={2}
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
            <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Vendor'}
            </button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
}
