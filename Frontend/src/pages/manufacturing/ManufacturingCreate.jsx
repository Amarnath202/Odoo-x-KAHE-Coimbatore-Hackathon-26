import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Factory } from 'lucide-react';
import { PageWrapper } from '../../components/UI';
import { manufacturingApi, bomsApi, productsApi, warehousesApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ManufacturingCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    companyId: '',
    bomId: '',
    productId: '',
    quantity: 1,
    warehouseId: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [boms, setBoms] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    const companyId = user?.companyId ?? '';
    setFormData(f => ({ ...f, companyId }));
    const params = companyId ? { companyId } : {};
    Promise.all([
      bomsApi.list(params).catch(() => null),
      productsApi.list(params).catch(() => null),
      warehousesApi.list(params).catch(() => null),
    ]).then(([bRes, pRes, wRes]) => {
      const bomList = bRes?.data?.items ?? bRes?.data ?? [];
      const prodList = pRes?.data?.items ?? pRes?.data ?? [];
      const whList = wRes?.data?.items ?? wRes?.data ?? [];
      setBoms(bomList);
      setProducts(prodList);
      setWarehouses(whList);
      if (whList.length > 0) setFormData(f => ({ ...f, warehouseId: whList[0].id }));
    });
  }, [user?.companyId]);

  // Auto-fill productId when BOM is selected
  const handleBomChange = (bomId) => {
    const bom = boms.find(b => b.id === bomId);
    setFormData(f => ({
      ...f,
      bomId,
      productId: bom?.productId ?? f.productId,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bomId) { toast('Please select a Bill of Materials', 'error'); return; }
    if (!formData.productId) { toast('Please select a product', 'error'); return; }
    if (!formData.warehouseId) { toast('Please select a warehouse', 'error'); return; }
    if (formData.quantity < 1) { toast('Quantity must be at least 1', 'error'); return; }

    setSaving(true);
    try {
      const body = {
        companyId: formData.companyId || user?.companyId,
        bomId: formData.bomId,
        productId: formData.productId,
        quantity: Number(formData.quantity),
        warehouseId: formData.warehouseId,
      };
      const res = await manufacturingApi.create(body);
      const order = res?.data ?? res;
      toast('Manufacturing Order created as Draft', 'success');
      navigate(`/manufacturing/${order.id}`);
    } catch (err) {
      toast(err.message || 'Failed to create manufacturing order', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/manufacturing')} className="btn-ghost btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="page-title">Create Manufacturing Order</h1>
            <p className="page-subtitle">New order will be saved as Draft</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => navigate('/manufacturing')} className="btn-secondary">Discard</button>
          <button form="mfg-form" type="submit" className="btn-primary" disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…
              </span>
            ) : <><Save className="w-4 h-4" />Save as Draft</>}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-sm font-semibold text-text-primary mb-6 flex items-center gap-2">
            <Factory className="w-4 h-4 text-primary" />Manufacturing Details
          </h2>
          <form id="mfg-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="form-group">
              <label className="label">Bill of Materials *</label>
              <select className="select" value={formData.bomId}
                onChange={e => handleBomChange(e.target.value)} required>
                <option value="">— Select BoM —</option>
                {boms.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="label">Finished Product *</label>
              <select className="select" value={formData.productId}
                onChange={e => setFormData(f => ({ ...f, productId: e.target.value }))} required>
                <option value="">— Select product —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="form-group">
                <label className="label">Quantity to Produce *</label>
                <input type="number" min="1" className="input" value={formData.quantity}
                  onChange={e => setFormData(f => ({ ...f, quantity: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="label">Warehouse *</label>
                <select className="select" value={formData.warehouseId}
                  onChange={e => setFormData(f => ({ ...f, warehouseId: e.target.value }))} required>
                  <option value="">— Select warehouse —</option>
                  {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
            </div>

            {/* BOM Preview */}
            {formData.bomId && (() => {
              const bom = boms.find(b => b.id === formData.bomId);
              if (!bom) return null;
              return (
                <div className="p-4 rounded-btn bg-bg-light border border-border space-y-3">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">BoM Components</p>
                  {(bom.components ?? []).length === 0 ? (
                    <p className="text-xs text-text-muted">No components defined in this BoM.</p>
                  ) : (
                    <div className="space-y-1">
                      {bom.components.map((c, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-text-secondary">{c.component?.name ?? c.productId}</span>
                          <span className="font-medium text-text-primary">× {c.quantity * Number(formData.quantity || 1)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </form>
        </motion.div>
      </div>
    </PageWrapper>
  );
}
