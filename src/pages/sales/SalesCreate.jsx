import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, AlertTriangle, Save, ArrowLeft,
  ShoppingCart, User, Package,
} from 'lucide-react';
import { PageWrapper, formatINR } from '../../components/UI';
import {
  getStore, STORES, nextRef, upsert, addAuditLog, getProductStock,
} from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

function emptyLine() {
  return { _key: Date.now() + Math.random(), productId: '', productName: '', qty: 1, unitPrice: 0, subtotal: 0 };
}

export default function SalesCreate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState([emptyLine()]);
  const [saving, setSaving] = useState(false);

  const products = getStore(STORES.PRODUCTS);

  /* ── Line helpers ─────────────────────────── */
  const updateLine = (key, field, value) => {
    setLines(prev =>
      prev.map(l => {
        if (l._key !== key) return l;
        const updated = { ...l, [field]: value };
        if (field === 'productId') {
          const p = products.find(p => p.id === value);
          updated.productName = p?.name || '';
          updated.unitPrice = p?.salesPrice || 0;
        }
        if (field === 'qty' || field === 'unitPrice' || field === 'productId') {
          const qty = field === 'qty' ? Number(value) : Number(updated.qty);
          const price = field === 'unitPrice' ? Number(value) : Number(updated.unitPrice);
          updated.subtotal = qty * price;
        }
        return updated;
      })
    );
  };

  const addLine = () => setLines(prev => [...prev, emptyLine()]);
  const removeLine = key => setLines(prev => prev.filter(l => l._key !== key));

  const total = lines.reduce((s, l) => s + (l.subtotal || 0), 0);

  /* ── Stock warnings ───────────────────────── */
  const getWarning = (line) => {
    if (!line.productId || !line.qty) return null;
    const stock = getProductStock(line.productId);
    if (Number(line.qty) > stock.freeToUse) {
      return `Only ${stock.freeToUse} units free to use (On Hand: ${stock.onHand}, Reserved: ${stock.reserved})`;
    }
    return null;
  };

  /* ── Save ─────────────────────────────────── */
  const handleSave = (e) => {
    e.preventDefault();
    if (!customer.trim()) { toast('Customer name is required', 'error'); return; }
    const validLines = lines.filter(l => l.productId && l.qty > 0);
    if (validLines.length === 0) { toast('Add at least one product line', 'error'); return; }

    setSaving(true);
    const id = nextRef('SO');
    const order = {
      id,
      customer: customer.trim(),
      date: new Date(date).toISOString(),
      status: 'Draft',
      lines: validLines.map(({ _key, ...rest }) => rest),
      total,
    };

    upsert(STORES.SALES_ORDERS, order);
    addAuditLog({
      user: user?.name, role: user?.role,
      module: 'Sales', action: 'Created',
      reference: id, newValue: { customer, total, status: 'Draft' },
    });

    setTimeout(() => {
      toast(`${id} saved as Draft`, 'success');
      navigate(`/sales/${id}`);
    }, 400);
  };

  return (
    <PageWrapper>
      <form onSubmit={handleSave}>
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/sales')} className="btn-ghost btn-icon">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="page-title">Create Sales Order</h1>
              <p className="page-subtitle">New order will be saved as Draft</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigate('/sales')} className="btn-secondary">
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
          {/* Left — main form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Customer Info */}
            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Customer Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Customer Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. Mehta Interiors"
                    value={customer}
                    onChange={e => setCustomer(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Order Date</label>
                  <input
                    type="date"
                    className="input"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>

            {/* Product Lines */}
            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Order Lines
                </h2>
                <button type="button" onClick={addLine} className="btn-secondary btn-sm">
                  <Plus className="w-3.5 h-3.5" />
                  Add Product
                </button>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {lines.map((line, idx) => {
                    const warning = getWarning(line);
                    const selectedProd = products.find(p => p.id === line.productId);
                    const stock = line.productId ? getProductStock(line.productId) : null;

                    return (
                      <motion.div
                        key={line._key}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 12 }}
                        transition={{ duration: 0.2 }}
                        className={`rounded-btn border p-4 space-y-3 ${warning ? 'border-warning/40 bg-warning/5' : 'border-border'}`}
                      >
                        {/* Line header */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-text-muted">Line {idx + 1}</span>
                          {lines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLine(line._key)}
                              className="btn-danger btn-icon btn-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Product + Qty + Price row */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          {/* Product */}
                          <div className="sm:col-span-5 form-group">
                            <label className="label">Product *</label>
                            <select
                              className="select"
                              value={line.productId}
                              onChange={e => updateLine(line._key, 'productId', e.target.value)}
                              required
                            >
                              <option value="">— Select product —</option>
                              {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Qty */}
                          <div className="sm:col-span-2 form-group">
                            <label className="label">Qty *</label>
                            <input
                              type="number"
                              min="1"
                              className={`input ${warning ? 'input-error' : ''}`}
                              value={line.qty}
                              onChange={e => updateLine(line._key, 'qty', e.target.value)}
                              required
                            />
                          </div>

                          {/* Unit Price */}
                          <div className="sm:col-span-3 form-group">
                            <label className="label">Unit Price (₹)</label>
                            <input
                              type="number"
                              min="0"
                              className="input"
                              value={line.unitPrice}
                              onChange={e => updateLine(line._key, 'unitPrice', e.target.value)}
                            />
                          </div>

                          {/* Subtotal */}
                          <div className="sm:col-span-2 form-group">
                            <label className="label">Subtotal</label>
                            <div className="input bg-bg-surface text-text-secondary font-semibold cursor-default">
                              {formatINR(line.subtotal || 0)}
                            </div>
                          </div>
                        </div>

                        {/* Stock info */}
                        {stock && (
                          <div className="flex items-center gap-4 text-xs text-text-muted">
                            <span>On Hand: <strong className="text-text-primary">{stock.onHand}</strong></span>
                            <span>Reserved: <strong className="text-warning">{stock.reserved}</strong></span>
                            <span>Free to Use: <strong className={stock.freeToUse <= 0 ? 'text-danger' : 'text-success'}>{stock.freeToUse}</strong></span>
                          </div>
                        )}

                        {/* Warning */}
                        {warning && (
                          <div className="alert-warning text-xs">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            {warning}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Right — Order Summary */}
          <div className="space-y-4">
            <motion.div className="card sticky top-20" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                Order Summary
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

              <div className="mt-4 p-3 rounded-btn bg-bg-surface border border-border">
                <p className="text-xs text-text-muted">Status after save</p>
                <span className="badge-draft mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-draft" />
                  Draft
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </form>
    </PageWrapper>
  );
}
