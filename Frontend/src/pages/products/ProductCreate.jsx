import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import PageWrapper from '../../components/UI';
import { productsApi, bomsApi, unitsApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ProductCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    salesPrice: '',
    costPrice: '',
    procureOnDemand: false,
    procurementType: 'MANUFACTURING',
    vendorId: '',
    bomId: '',
    unitId: '',
    categoryId: '',
    companyId: '',
  });

  const [boms, setBoms] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMeta = async () => {
      const companyId = user?.companyId;
      const [bomsRes, unitsRes] = await Promise.all([
        bomsApi.list(companyId ? { companyId } : {}).catch(() => null),
        unitsApi.list().catch(() => null),
      ]);
      setBoms(bomsRes?.data?.items ?? bomsRes?.data ?? []);
      setUnits(unitsRes?.data?.items ?? unitsRes?.data ?? []);
    };
    loadMeta();
  }, [user?.companyId]);

  useEffect(() => {
    if (isEdit) {
      const load = async () => {
        try {
          const res = await productsApi.getById(id);
          const p = res?.data ?? res;
          if (!p) { toast('Product not found', 'error'); navigate('/products'); return; }
          setFormData({
            name: p.name ?? '',
            sku: p.sku ?? '',
            salesPrice: p.salesPrice ?? '',
            costPrice: p.costPrice ?? '',
            procureOnDemand: p.procureOnDemand ?? false,
            procurementType: p.procurementType ?? 'MANUFACTURING',
            vendorId: p.vendorId ?? '',
            bomId: p.bomId ?? '',
            unitId: p.unitId ?? '',
            categoryId: p.categoryId ?? '',
            companyId: p.companyId ?? user?.companyId ?? '',
          });
        } catch {
          toast('Failed to load product', 'error');
          navigate('/products');
        }
      };
      load();
    } else {
      setFormData(f => ({ ...f, companyId: user?.companyId ?? '' }));
    }
  }, [id, isEdit, navigate, toast, user?.companyId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast('Product Name is required', 'error'); return; }
    if (!formData.sku.trim() && !isEdit) { toast('SKU is required', 'error'); return; }

    if (formData.procureOnDemand) {
      if (formData.procurementType === 'MANUFACTURING' && !formData.bomId) {
        toast('Bill of Materials is required for Manufacturing products.', 'error');
        return;
      }
    }

    const body = {
      companyId: formData.companyId || user?.companyId,
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      salesPrice: parseFloat(formData.salesPrice) || 0,
      costPrice: parseFloat(formData.costPrice) || 0,
      procureOnDemand: formData.procureOnDemand,
      ...(formData.vendorId ? { vendorId: formData.vendorId } : {}),
      ...(formData.unitId ? { unitId: formData.unitId } : {}),
      ...(formData.categoryId ? { categoryId: formData.categoryId } : {}),
    };

    if (formData.procureOnDemand) {
      body.procurementType = formData.procurementType;
      if (formData.procurementType === 'MANUFACTURING') {
        body.bomId = formData.bomId;
      }
    }

    setLoading(true);
    try {
      if (isEdit) {
        await productsApi.update(id, body);
        toast('Product updated successfully', 'success');
      } else {
        await productsApi.create(body);
        toast('Product created successfully', 'success');
      }
      navigate('/products');
    } catch (err) {
      toast(err.message || 'Failed to save product', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to="/products" className="btn-ghost btn-icon text-text-secondary hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">{isEdit ? 'Edit Product' : 'Create Product'}</h1>
            <p className="page-subtitle">{isEdit ? `Edit details for ${formData.name}` : 'Add a new product to the ERP system'}</p>
          </div>
        </div>
      </div>

      <div className="card max-w-3xl mx-auto bg-bg-surface">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Product Name */}
            <div className="form-group md:col-span-2">
              <label className="label">Product Name *</label>
              <input type="text" className="input" placeholder="e.g. Luxury Leather Sofa"
                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            </div>

            {/* SKU */}
            <div className="form-group">
              <label className="label">SKU *</label>
              <input type="text" className="input" placeholder="e.g. TBL-001"
                value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })}
                required={!isEdit} disabled={isEdit} />
            </div>

            {/* Unit */}
            <div className="form-group">
              <label className="label">Unit of Measure</label>
              <select className="select" value={formData.unitId} onChange={e => setFormData({ ...formData, unitId: e.target.value })}>
                <option value="">— Select unit —</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            {/* Sales Price */}
            <div className="form-group">
              <label className="label">Sales Price (INR) *</label>
              <input type="number" step="0.01" className="input" placeholder="e.g. 15000"
                value={formData.salesPrice} onChange={e => setFormData({ ...formData, salesPrice: e.target.value })} required />
            </div>

            {/* Cost Price */}
            <div className="form-group">
              <label className="label">Cost Price (INR) *</label>
              <input type="number" step="0.01" className="input" placeholder="e.g. 9500"
                value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: e.target.value })} required />
            </div>

            {/* Procure on demand */}
            <div className="form-group flex items-center gap-3 md:col-span-2">
              <input type="checkbox" id="pod" checked={formData.procureOnDemand}
                onChange={e => setFormData({ ...formData, procureOnDemand: e.target.checked })}
                className="w-4 h-4 accent-primary" />
              <label htmlFor="pod" className="label mb-0 cursor-pointer">Procure on Demand (MTO)</label>
            </div>

            {/* Procurement Fields (Conditionally Shown) */}
            {formData.procureOnDemand && (
              <>
                <div className="form-group">
                  <label className="label">Procurement Type *</label>
                  <select className="select" value={formData.procurementType}
                    onChange={e => setFormData({ ...formData, procurementType: e.target.value })}>
                    <option value="MANUFACTURING">Manufacturing</option>
                    <option value="PURCHASE">Purchase</option>
                  </select>
                </div>

                {formData.procurementType === 'MANUFACTURING' && (
                  <div className="form-group">
                    <label className="label">Bill of Materials *</label>
                    <select className="select" value={formData.bomId} onChange={e => setFormData({ ...formData, bomId: e.target.value })}>
                      <option value="">— Select BoM —</option>
                      {boms.map(bom => <option key={bom.id} value={bom.id}>{bom.name}</option>)}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Form Actions */}
          <div className="divider" />
          <div className="flex items-center justify-end gap-3">
            <Link to="/products" className="btn-secondary flex items-center gap-1.5">
              <X className="w-4 h-4" />
              Cancel
            </Link>
            <button type="submit" className="btn-primary flex items-center gap-1.5" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isEdit ? 'Save Changes' : 'Create Product'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}
