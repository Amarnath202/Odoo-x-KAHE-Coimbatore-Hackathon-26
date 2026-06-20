import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Users } from 'lucide-react';
import { PageWrapper } from '../../components/UI';
import Modal from '../../components/Modal';
import { customersApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function CustomerList() {
  const { user } = useAuth();
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customersApi.list(user?.companyId ? { companyId: user.companyId } : {});
      setCustomers(res.data?.items ?? res.data ?? []);
    } catch (err) {
      toast('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [user?.companyId]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setForm({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || ''
      });
    } else {
      setEditingCustomer(null);
      setForm({ name: '', email: '', phone: '', address: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    setForm({ name: '', email: '', phone: '', address: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast('Customer name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...form, companyId: user?.companyId };
      if (editingCustomer) {
        await customersApi.update(editingCustomer.id, payload);
        toast('Customer updated successfully', 'success');
      } else {
        await customersApi.create(payload);
        toast('Customer created successfully', 'success');
      }
      closeModal();
      fetchCustomers();
    } catch (err) {
      toast(err.message || 'Failed to save customer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await customersApi.delete(id);
      toast('Customer deleted', 'success');
      fetchCustomers();
    } catch (err) {
      toast(err.message || 'Failed to delete customer', 'error');
    }
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Customer Management
          </h1>
          <p className="page-subtitle">Manage your customer database and contact info.</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary btn-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      <div className="search-bar w-full md:max-w-md mb-6">
        <Search className="search-icon text-text-muted" />
        <input
          type="text"
          className="input pl-10"
          placeholder="Search customers..."
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
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-text-muted text-sm bg-white">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => (
                  <tr key={c.id} className="border-b border-border hover:bg-black/[0.01]">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-text-primary">{c.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-secondary">{c.email || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-secondary">{c.phone || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openModal(c)} className="p-1 text-text-secondary hover:text-accent transition-colors tooltip">
                          <Edit className="w-4 h-4" />
                          <span className="tooltip-content">Edit</span>
                        </button>
                        {(user?.role === 'ADMIN' || user?.role === 'BUSINESS_OWNER') && (
                          <button onClick={() => handleDelete(c.id)} className="p-1 text-text-secondary hover:text-danger transition-colors tooltip">
                            <Trash2 className="w-4 h-4" />
                            <span className="tooltip-content">Delete</span>
                          </button>
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

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingCustomer ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label className="label">Customer Name *</label>
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
              {isSubmitting ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
}
