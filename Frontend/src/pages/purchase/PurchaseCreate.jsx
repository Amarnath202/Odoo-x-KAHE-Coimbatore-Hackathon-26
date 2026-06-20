import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Save, ArrowLeft, Truck, Package } from 'lucide-react';
import { PageWrapper, formatINR } from '../../components/UI';
import { purchaseApi, vendorsApi, productsApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

function emptyLine() {
  return { _key: Date.now() + Math.random(), productId: '', productName: '', quantity: 1, unitPrice: 0, subtotal: 0 };
}

export default function PurchaseCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [vendorId, setVendorId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const params = user?.companyId ? { companyId: user.companyId } : {};
    Promise.all([
      vendorsApi.list(params).catch(() => null),
      productsApi.list(params).catch(() => null),
    ]).then(([vRes, pRes]) => {
      setVendors(vRes?.data?.items ?? vRes?.data ?? []);
      setProducts(pRes?.data?.items ?? pRes?.data ?? []);
    });
  }, [user?.companyId]);

  const updateLine = (key, field, value) => {
    setLines(prev => prev.map(l => {
      if (l._key !== key) return l;
      const updated = { ...l, [field]: value };
      if (field === 'productId') {
        const p = products.find(p => p.id === value);
        updated.productName = p?.name ?? '';
        updated.unitPrice = p?.costPrice ?? 0;
      }
      if (['quantity', 'unitPrice', 'productId'].includes(field)) {
        updated.subtotal = Number(updated.quantity) * Number(updated.unitPrice);
      }
      return updated;
    }));
  };

  const addLine = () => setLines(prev => [...prev, emptyLine()]);
  const removeLine = key => setLines(prev => prev.filter(l => l._key !== key));
  const total = lines.reduce((s, l) => s + (l.subtotal || 0), 0);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!vendorId) { toast('Please select a vendor', 'error'); return; }
    const validLines = lines.filter(l => l.productId && l.quantity > 0);
    if (validLines.length === 0) { toast('Add at least one product line', 'error'); return; }

    setSaving(true);
    try {
      const body = {
        companyId: user?.companyId,
        vendorId,
        notes: notes.trim(),
        items: validLines.map(({ _key, ...rest }) => ({
          productId: rest.productId,
          quantity: Number(rest.quantity),
          unitPrice: Number(rest.unitPrice),
        })),
      };
      const res = await purchaseApi.create(body);
      const order = res?.data ?? res;
      toast('Purchase Order created as Draft', 'success');
      navigate(`/purchase/${order.id}`);
    } catch (err) {
      toast(err.message || 'Failed to create order', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper>
      <form onSubmit={handleSave}>
        <div className="page-header">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/purchase')} className="btn-ghost btn-icon">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="page-title">Create Purchase Order</h1>
              <p className="page-subtitle">New order will be saved as Draft</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate('/purchase')} className="btn-secondary">Discard</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span>
                : <><Save className="w-4 h-4" />Save as Draft</>}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />Vendor Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group sm:col-span-2">
                  <label className="label">Vendor *</label>
                  <select className="select" value={vendorId} onChange={e => setVendorId(e.target.value)} required>
                    <option value="">— Select vendor —</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="form-group sm:col-span-2">
                  <label className="label">Notes</label>
                  <textarea className="input" rows={2} placeholder="Optional notes…" value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              </div>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />Order Lines
                </h2>
                <button type="button" onClick={addLine} className="btn-secondary btn-sm">
                  <Plus className="w-3.5 h-3.5" />Add Product
                </button>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {lines.map((line, idx) => (
                    <motion.div key={line._key}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                      className="rounded-btn border border-border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-text-muted">Line {idx + 1}</span>
                        {lines.length > 1 && (
                          <button type="button" onClick={() => removeLine(line._key)} className="btn-danger btn-icon btn-sm">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-5 form-group">
                          <label className="label">Product *</label>
                          <select className="select" value={line.productId}
                            onChange={e => updateLine(line._key, 'productId', e.target.value)} required>
                            <option value="">— Select product —</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="sm:col-span-2 form-group">
                          <label className="label">Qty *</label>
                          <input type="number" min="1" className="input" value={line.quantity}
                            onChange={e => updateLine(line._key, 'quantity', e.target.value)} required />
                        </div>
                        <div className="sm:col-span-3 form-group">
                          <label className="label">Unit Cost (₹)</label>
                          <input type="number" min="0" className="input" value={line.unitPrice}
                            onChange={e => updateLine(line._key, 'unitPrice', e.target.value)} />
                        </div>
                        <div className="sm:col-span-2 form-group">
                          <label className="label">Subtotal</label>
                          <div className="input bg-bg-surface text-text-secondary font-semibold cursor-default">
                            {formatINR(line.subtotal || 0)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          <div>
            <motion.div className="card sticky top-20" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />Order Summary
              </h2>
              <div className="space-y-2 mb-4">
                {lines.filter(l => l.productId).map(l => (
                  <div key={l._key} className="flex justify-between text-sm">
                    <span className="text-text-secondary truncate max-w-[60%]">{l.productName || '—'}</span>
                    <span className="text-text-primary font-medium">{formatINR(l.subtotal || 0)}</span>
                  </div>
                ))}
              </div>
              <div className="divider" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-text-secondary">Total</span>
                <span className="text-xl font-bold text-primary">{formatINR(total)}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </form>
    </PageWrapper>
  );
}
