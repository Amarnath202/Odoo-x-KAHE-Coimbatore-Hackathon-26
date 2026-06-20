import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Save, Factory, Package, User, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { PageWrapper } from '../../components/UI';
import {
  getStore, STORES, nextRef, upsert, addAuditLog, getProductStock,
} from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ManufacturingCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast    = useToast();

  const [productId,  setProductId]  = useState('');
  const [qty,        setQty]        = useState(1);
  const [assignee,   setAssignee]   = useState('');
  const [date,       setDate]       = useState(new Date().toISOString().split('T')[0]);
  const [saving,     setSaving]     = useState(false);

  const products = getStore(STORES.PRODUCTS);
  const boms     = getStore(STORES.BOM);

  // Find BoM for selected product
  const selectedProduct = products.find(p => p.id === productId);
  const bom = boms.find(b => b.finishedProductId === productId) || null;

  // Build components table with stock info
  const components = bom
    ? bom.components.map(c => {
        const stock    = getProductStock(c.componentId);
        const required = c.qty * Number(qty);
        return { ...c, required, available: stock.onHand, sufficient: stock.onHand >= required };
      })
    : [];

  const allSufficient = components.every(c => c.sufficient);

  /* ── Save ──────────────────────────────────────── */
  const handleSave = (e) => {
    e.preventDefault();
    if (!productId) { toast('Select a finished product', 'error'); return; }
    if (Number(qty) < 1) { toast('Quantity must be at least 1', 'error'); return; }

    setSaving(true);
    const id = nextRef('MO');

    // Attach work orders from BoM operations (each starts as Pending)
    const workOrders = bom?.operations?.map((op, i) => ({
      id:         `WO-${id}-${i + 1}`,
      name:        op.name,
      workCenter:  op.workCenter,
      duration:    op.duration,
      status:     'Pending',   // Pending | In Progress | Done
    })) || [];

    const order = {
      id,
      productId,
      productName:  selectedProduct?.name || '',
      qty:          Number(qty),
      assignee:     assignee.trim() || 'Unassigned',
      date:         new Date(date).toISOString(),
      status:       'Draft',
      bomId:        bom?.id || null,
      components:   components.map(({ required, available, sufficient, ...c }) => ({ ...c, required })),
      workOrders,
    };

    upsert(STORES.MANUFACTURING_ORDERS, order);
    addAuditLog({
      user: user?.name, role: user?.role,
      module: 'Manufacturing', action: 'Created',
      reference: id, newValue: { product: selectedProduct?.name, qty, status: 'Draft' },
    });

    setTimeout(() => {
      toast(`${id} saved as Draft`, 'success');
      navigate(`/manufacturing/${id}`);
    }, 400);
  };

  return (
    <PageWrapper>
      <form onSubmit={handleSave}>
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/manufacturing')}
              className="btn-ghost btn-icon"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="page-title">Create Manufacturing Order</h1>
              <p className="page-subtitle">New order will be saved as Draft</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate('/manufacturing')} className="btn-secondary">
              Discard
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save as Draft
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">

            {/* Product + Details */}
            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Factory className="w-4 h-4 text-purple-400" />
                Order Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Finished Product */}
                <div className="form-group sm:col-span-2">
                  <label className="label">Finished Product *</label>
                  <select
                    className="select"
                    value={productId}
                    onChange={e => setProductId(e.target.value)}
                    required
                  >
                    <option value="">— Select finished product —</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Quantity to Produce *</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Assignee</label>
                  <input
                    className="input"
                    placeholder="e.g. Ravi Kumar"
                    value={assignee}
                    onChange={e => setAssignee(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Scheduled Date</label>
                  <input
                    type="date"
                    className="input"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>

                {/* BoM tag */}
                {productId && (
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-btn text-xs border ${
                      bom
                        ? 'bg-accent/5 border-accent/30 text-accent'
                        : 'bg-warning/5 border-warning/30 text-warning'
                    }`}>
                      <Package className="w-3.5 h-3.5" />
                      {bom ? `BoM: ${bom.name}` : 'No BoM found for this product'}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Components table */}
            <AnimatePresence>
              {bom && components.length > 0 && (
                <motion.div
                  className="table-container"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="px-4 py-3 bg-bg-surface/50 border-b border-border flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-text-primary">
                      Components Required
                    </h2>
                    {allSufficient ? (
                      <span className="flex items-center gap-1.5 text-xs text-success font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />
                        All stock available
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs text-warning font-medium">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Some stock insufficient
                      </span>
                    )}
                  </div>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Component</th>
                        <th className="text-center">Required Qty</th>
                        <th className="text-center">Available Qty</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {components.map((c, i) => (
                        <tr
                          key={c.componentId}
                          className={c.sufficient ? '' : 'stock-low'}
                        >
                          <td>
                            <p className="font-medium text-text-primary">{c.componentName}</p>
                          </td>
                          <td className="text-center font-semibold">{c.required}</td>
                          <td className={`text-center font-semibold ${c.sufficient ? 'text-success' : 'text-danger'}`}>
                            {c.available}
                          </td>
                          <td className="text-center">
                            {c.sufficient ? (
                              <span className="badge-done">
                                <span className="w-1.5 h-1.5 rounded-full bg-status-done" />
                                OK
                              </span>
                            ) : (
                              <span className="badge-cancelled">
                                <span className="w-1.5 h-1.5 rounded-full bg-status-cancelled" />
                                Short {c.available - c.required}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!allSufficient && (
                    <div className="px-4 py-3 border-t border-border">
                      <div className="alert-warning text-xs">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Some components have insufficient stock. You can still create the order as Draft.
                        Stock will be reserved when you Confirm the order.
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Work Orders preview */}
            <AnimatePresence>
              {bom?.operations?.length > 0 && (
                <motion.div
                  className="card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <h2 className="text-sm font-semibold text-text-primary mb-4">
                    Work Orders (from BoM)
                  </h2>
                  <div className="space-y-2">
                    {bom.operations.map((op, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-3 py-2.5 rounded-btn bg-bg-surface border border-border"
                      >
                        <div>
                          <p className="text-sm font-medium text-text-primary">{op.name}</p>
                          <p className="text-xs text-text-muted">{op.workCenter} · {op.duration}h</p>
                        </div>
                        <span className="badge-draft">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-draft" />
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — summary */}
          <div>
            <motion.div
              className="card sticky top-20"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Factory className="w-4 h-4 text-purple-400" />
                MO Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Product</span>
                  <span className="font-medium text-text-primary text-right max-w-[55%] truncate">
                    {selectedProduct?.name || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Qty</span>
                  <span className="font-semibold text-text-primary">{qty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Assignee</span>
                  <span className="text-text-primary">{assignee || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">BoM</span>
                  <span className={`text-xs font-medium ${bom ? 'text-accent' : 'text-text-muted'}`}>
                    {bom ? bom.name : productId ? 'Not found' : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Work Orders</span>
                  <span className="text-text-primary">{bom?.operations?.length || 0}</span>
                </div>
              </div>

              <div className="divider" />

              <div className="p-3 rounded-btn bg-bg-surface border border-border">
                <p className="text-xs text-text-muted">Status after save</p>
                <span className="badge-draft mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-draft" />
                  Draft
                </span>
              </div>

              {productId && !bom && (
                <div className="alert-warning text-xs mt-3">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  No Bill of Materials found. Work orders won't be generated.
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </form>
    </PageWrapper>
  );
}
