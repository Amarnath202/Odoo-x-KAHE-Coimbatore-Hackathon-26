import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import PageWrapper from '../../components/UI';
import { usersApi } from '../../utils/api';

const ROLES = [
  'ADMIN',
  'BUSINESS_OWNER',
  'SALES_USER',
  'PURCHASE_USER',
  'MANUFACTURING_USER',
  'INVENTORY_MANAGER',
];

export default function UserCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const toast = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SALES_USER',
    isActive: true,
    companyId: '00000000-0000-0000-0000-000000000001', // Default company
  });

  useEffect(() => {
    if (isEdit) {
      const fetchUser = async () => {
        try {
          const res = await usersApi.getById(id);
          const data = res?.data || res;
          setFormData({
            name: data.name || '',
            email: data.email || '',
            password: '', // Password not fetched
            role: data.role || 'SALES_USER',
            isActive: data.isActive !== false,
            companyId: data.companyId || '00000000-0000-0000-0000-000000000001',
          });
        } catch (err) {
          console.error(err);
          toast('Failed to load user details', 'error');
          navigate('/users');
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEdit) {
        const updateData = {
          name: formData.name,
          role: formData.role,
          isActive: formData.isActive,
        };
        // If password is provided during edit, add it to update payload
        // The backend might or might not support password update here, 
        // but typically users.controller.ts allows name, role, isActive.
        // Let's pass it anyway if it's not empty, just in case.
        if (formData.password) {
          updateData.password = formData.password;
        }
        await usersApi.update(id, updateData);
        toast('User updated successfully', 'success');
      } else {
        await usersApi.create(formData);
        toast('User created successfully', 'success');
      }
      navigate('/users');
    } catch (err) {
      console.error(err);
      toast(err.message || (isEdit ? 'Failed to update user' : 'Failed to create user'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/users" className="text-text-muted hover:text-text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="page-title">{isEdit ? 'Edit User' : 'Create User'}</h1>
          </div>
          <p className="page-subtitle">
            {isEdit ? 'Modify user details and role' : 'Add a new user to the system'}
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              User Information
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="input"
                    placeholder="e.g. John Doe"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required={!isEdit}
                    disabled={isEdit}
                    className="input disabled:bg-bg-light disabled:cursor-not-allowed"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  {isEdit && (
                    <p className="text-xs text-text-muted mt-1">Email cannot be changed.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    {isEdit ? 'Password (leave blank to keep current)' : 'Password'} {isEdit ? '' : <span className="text-danger">*</span>}
                  </label>
                  <input
                    type="password"
                    name="password"
                    required={!isEdit}
                    className="input"
                    placeholder="Enter password (min 8 chars)"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">
                    Role <span className="text-danger">*</span>
                  </label>
                  <select
                    name="role"
                    required
                    className="select"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isEdit && (
                <div className="flex items-center gap-2 mt-4 p-4 bg-bg-light rounded-btn">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-primary rounded border-border"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-text-primary">
                    Active Account
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link to="/users" className="btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex items-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isEdit ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}
