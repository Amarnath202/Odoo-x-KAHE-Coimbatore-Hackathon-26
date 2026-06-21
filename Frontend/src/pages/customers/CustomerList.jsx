import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Users } from 'lucide-react';
import { PageWrapper } from '../../components/UI';
import Modal from '../../components/Modal';
import { customersApi } from '../../utils/api';

const AVATAR_IMAGES = [
  '/avatars/avatar_1.png',
  '/avatars/avatar_2.png',
  '/avatars/avatar_3.svg',
  '/avatars/avatar_4.svg',
];

function getAvatarForUser(name) {
  if (!name) return AVATAR_IMAGES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_IMAGES[Math.abs(hash) % AVATAR_IMAGES.length];
}
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

export default function CustomerList() {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
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
    const isConfirmed = await confirm({ message: 'Are you sure you want to delete this customer?' });
    if (!isConfirmed) return;
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-6 h-32 flex items-center justify-center">
              <div className="h-10 w-full bg-bg-light animate-pulse rounded" />
            </div>
          ))
        ) : filteredCustomers.length === 0 ? (
          <div className="col-span-full card py-12 text-center text-text-muted text-sm">
            No customers found.
          </div>
        ) : (
          filteredCustomers.map(c => (
            <div 
              key={c.id} 
              className="card hover:shadow-lg transition-shadow relative"
            >
              <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
                <button
                  onClick={() => openModal(c)}
                  className="p-1 text-text-secondary hover:text-accent transition-colors bg-bg-surface rounded tooltip"
                >
                  <Edit className="w-4 h-4" />
                  <span className="tooltip-content">Edit</span>
                </button>
                {(user?.role === 'ADMIN' || user?.role === 'BUSINESS_OWNER') && (
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1 text-text-secondary hover:text-danger transition-colors bg-bg-surface rounded tooltip"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="tooltip-content">Delete</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <img 
                    src={getAvatarForUser(c.name)} 
                    alt={c.name} 
                    className="w-12 h-12 rounded-full object-cover shrink-0 shadow-sm border-2 border-bg-light"
                  />
                  <div className="pr-12 min-w-0">
                    <h3 className="font-semibold text-text-primary truncate text-base">{c.name}</h3>
                    <p className="text-sm text-text-muted truncate">{c.email || 'No email provided'}</p>
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap gap-2 pt-2 border-t border-border">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                    CUSTOMER
                  </span>
                  {c.phone && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700">
                      {c.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
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
