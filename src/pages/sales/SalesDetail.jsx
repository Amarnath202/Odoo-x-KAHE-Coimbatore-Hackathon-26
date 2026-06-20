import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle, XCircle, Truck, AlertTriangle,
  Package, User, Calendar, Hash, ClipboardList, Info,
} from 'lucide-react';
import { PageWrapper, formatINR, formatDate, formatDateTime } from '../../components/UI';
import StatusBadge from '../../components/StatusBadge';
import {
  getOne, STORES, upsert, addAuditLog,
  adjustStock, addLedgerEntry, getProductStock, getStore,
} from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

/* ── helpers ────────────────────────────────────────────── */

function badgeLabel(status) {
  if (status === 'Partial') return 'Partially Delivered';
  if (status === 'Done') return 'Delivered';
  return status;
}

function procurementAlert(productId) {
  const products = getStore(STORES.PRODUCTS);
  const p = products.find(p => p.id === productId);
  return p?.procurementStrategy === 'MTO';
}

export default function SalesDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [confirmModal, setConfirmModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [deliverModal, setDeliverModal] = useState(false);

  // Always read fresh from storage
  const order = getOne(STORES.SALES_ORDERS, id);

  if (!order) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package className="w-12 h-12 text-text-muted mb-4" />
          <p className="text-text-primary font-semibold mb-1">Order not found</p>
          <p className="text-text-muted text-sm mb-4">Sales order <span className="font-mono">{id}</span> does not exist.</p>
          <Link to="/sales" className="btn-primary btn-sm">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sales
          </Link>
        </div>
      </PageWrapper>
    );
  }

  /* ── Action: Confirm ─────────────────────── */
  const handleConfirm = () => {
    const oldStatus = order.status;
    const stockWarnings = [];
    const mtoAlerts = [];

    order.lines.forEach(line => {
      const stock = getProductStock(line.productId);
      if (Number(line.qty) > stock.freeToUse) {
        stockWarnings.push(`${line.productName}: need ${line.qty}, free ${stock.freeToUse}`);
        if (procurementAlert(line.productId)) {
          mtoAlerts.push(line.productName);
        }
      }
      // Reserve stock
      adjustStock(line.productId, { deltaReserved: Number(line.qty) });
      addLedgerEntry({
        productId: line.productId,
        productName: line.productName,
        type: 'RESERVE',
        qty: Number(line.qty),
        reference: order.id,
        note: `Reserved on Confirm — ${order.id}`,
      });
    });

    upsert(STORES.SALES_ORDERS, { ...order, status: 'Confirmed' });
    addAuditLog({
      user: user?.name, role: user?.role,
      module: 'Sales', action: 'Confirmed',
      reference: order.id, oldValue: oldStatus, newValue: 'Confirmed',
    });

    if (mtoAlerts.length > 0) {
      toast(`Procurement Triggered — PO/MO auto-created for: ${mtoAlerts.join(', ')}`, 'warning', 6000);
    } else if (stockWarnings.length > 0) {
      toast(`⚠ Stock short for some items: ${stockWarnings.join(' | ')}`, 'warning', 5000);
    } else {
      toast(`${order.id} Confirmed — stock reserved`, 'success');
    }

    setConfirmModal(false);
    navigate(0); // refresh
  };

  /* ── Action: Cancel ──────────────────────── */
  const handleCancel = () => {
    const oldStatus = order.status;

    // Unreserve stock if was confirmed/partial
    if (['Confirmed', 'Partial'].includes(oldStatus)) {
      order.lines.forEach(line => {
        adjustStock(line.productId, { deltaReserved: -Number(line.qty) });
        addLedgerEntry({
          productId: line.productId,
          productName: line.productName,
          type: 'UNRESERVE',
          qty: -Number(line.qty),
          reference: order.id,
          note: `Unreserved on Cancel — ${order.id}`,
        });
      });
    }

    upsert(STORES.SALES_ORDERS, { ...order, status: 'Cancelled' });
    addAuditLog({
      user: user?.name, role: user?.role,
      module: 'Sales', action: 'Cancelled',
      reference: order.id, oldValue: oldStatus, newValue: 'Cancelled',
    });
    toast(`${order.id} cancelled`, 'warning');
    setCancelModal(false);
    navigate(0);
  };

  /* ── Action: Deliver ─────────────────────── */
  const handleDeliver = () => {
    const oldStatus = order.status;
    const mtoAlerts = [];

    order.lines.forEach(line => {
      const stock = getProductStock(line.productId);
      const qty = Number(line.qty);
      const canDeliver = Math.min(qty, stock.onHand);

      if (canDeliver < qty && procurementAlert(line.productId)) {
        mtoAlerts.push(line.productName);
      }

      // Reduce on-hand, reduce reserved
      adjustStock(line.productId, {
        deltaOnHand: -canDeliver,
        deltaReserved: -Math.min(qty, stock.reserved),
      });

      addLedgerEntry({
        productId: line.productId,
        productName: line.productName,
        type: 'OUT',
        qty: -canDeliver,
        reference: order.id,
        note: `Delivered — ${order.id}`,
      });
    });

    // Determine next status
    const allLines = order.lines;
    let newStatus = 'Done';

    // Check if any line couldn't be fully delivered (simplified: if any stock was short)
    const anyShort = order.lines.some(line => {
      const stock = getProductStock(line.productId);
      return (stock.onHand + Number(line.qty)) < Number(line.qty); // post-adjust check
    });

    // Simple rule: if this is first delivery from Confirmed → mark Done (full delivery model)
    // For partial, a separate flow would track delivered qty — for this MVP, delivering always marks Done
    if (oldStatus === 'Partial') {
      newStatus = 'Done';
    } else {
      newStatus = 'Done';
    }

    upsert(STORES.SALES_ORDERS, { ...order, status: newStatus });
    addAuditLog({
      user: user?.name, role: user?.role,
      module: 'Sales', action: newStatus === 'Done' ? 'Delivered' : 'Partially Delivered',
      reference: order.id, oldValue: oldStatus, newValue: newStatus,
    });

    if (mtoAlerts.length > 0) {
      toast(`Procurement Triggered — PO/MO auto-created for: ${mtoAlerts.join(', ')}`, 'warning', 6000);
    } else {
      toast(`${order.id} delivered — stock updated`, 'success');
    }

    setDeliverModal(false);
    navigate(0);
  };

  /* ── Render ──────────────────────────────── */
  return (
    <PageWrapper>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/sales')} className="btn-ghost btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title font-mono">{order.id}</h1>
              <StatusBadge status={badgeLabel(order.status)} />
            </div>
            <p className="page-subtitle">{order.customer} · {formatDate(order.date)}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {order.status === 'Draft' && (
            <>
              <button onClick={() => setConfirmModal(true)} className="btn-primary">
                <CheckCircle className="w-4 h-4" />
                Confirm Order
              </button>
              <button onClick={() => setCancelModal(true)} className="btn-danger">
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}
          {order.status === 'Confirmed' && (
            <>
              <button onClick={() => setDeliverModal(true)} className="btn-success">
                <Truck className="w-4 h-4" />
                Deliver
              </button>
              <button onClick={() => setCancelModal(true)} className="btn-danger">
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}
          {order.status === 'Partial' && (
            <button onClick={() => setDeliverModal(true)} className="btn-success">
              <Truck className="w-4 h-4" />
              Deliver Remaining
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">

          {/* Order Info Card */}
          <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              Order Information
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { icon: Hash, label: 'SO Number', value: order.id, mono: true },
                { icon: User, label: 'Customer', value: order.customer },
                { icon: Calendar, label: 'Order Date', value: formatDate(order.date) },
                { icon: Package, label: 'Total Items', value: `${order.lines?.length || 0} line${order.lines?.length !== 1 ? 's' : ''}` },
                { icon: Info, label: 'Status', value: <StatusBadge status={badgeLabel(order.status)} /> },
                { icon: CheckCircle, label: 'Total Value', value: formatINR(order.total || 0), bold: true },
              ].map(item => (
                <div key={item.label} className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </div>
                  <div className={`text-sm ${item.mono ? 'font-mono text-primary font-semibold' : item.bold ? 'font-bold text-text-primary' : 'text-text-primary'}`}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Line Items Table */}
          <motion.div
            className="table-container"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <div className="px-4 py-3 bg-bg-surface/50 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">Order Lines</h2>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Subtotal</th>
                  <th className="text-center">Stock Status</th>
                </tr>
              </thead>
              <tbody>
                {order.lines?.map((line, i) => {
                  const stock = getProductStock(line.productId);
                  const isMTO = procurementAlert(line.productId);
                  const stockOk = stock.onHand >= Number(line.qty);
                  return (
                    <tr key={i}>
                      <td className="text-text-muted text-xs">{i + 1}</td>
                      <td>
                        <div>
                          <p className="font-medium text-text-primary">{line.productName}</p>
                          <p className="text-xs text-text-muted font-mono">{line.productId}</p>
                        </div>
                      </td>
                      <td className="text-center font-semibold">{line.qty}</td>
                      <td className="text-right text-text-secondary">{formatINR(line.unitPrice)}</td>
                      <td className="text-right font-semibold text-text-primary">{formatINR(line.subtotal)}</td>
                      <td className="text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`text-xs font-medium ${stockOk ? 'text-success' : 'text-danger'}`}>
                            {stockOk ? `✓ ${stock.onHand} avail` : `⚠ ${stock.onHand} avail`}
                          </span>
                          {isMTO && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/30">
                              MTO
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-bg-surface/40">
                  <td colSpan={4} className="text-right font-semibold text-text-secondary text-sm">
                    Total
                  </td>
                  <td className="text-right font-bold text-primary text-base">
                    {formatINR(order.total || 0)}
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </motion.div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* Status Timeline */}
          <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-sm font-semibold text-text-primary mb-4">Order Status</h2>
            <div className="space-y-3">
              {[
                { label: 'Draft', done: true },
                { label: 'Confirmed', done: ['Confirmed', 'Partial', 'Done'].includes(order.status) },
                { label: 'Partially Delivered', done: ['Partial', 'Done'].includes(order.status) },
                { label: 'Delivered', done: order.status === 'Done' },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    step.done ? 'bg-primary text-white' : 'bg-bg-light text-text-muted border border-border'
                  }`}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  <span className={`text-sm ${step.done ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
                    {step.label}
                  </span>
                  {order.status === step.label || (order.status === 'Partial' && step.label === 'Partially Delivered') ? (
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Current</span>
                  ) : null}
                </div>
              ))}
            </div>

            {order.status === 'Cancelled' && (
              <div className="mt-4 p-3 rounded-btn bg-danger/5 border border-danger/20">
                <p className="text-xs text-danger font-medium flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  This order has been cancelled
                </p>
              </div>
            )}
          </motion.div>

          {/* Stock Summary */}
          <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <h2 className="text-sm font-semibold text-text-primary mb-3">Stock Summary</h2>
            <div className="space-y-2">
              {order.lines?.map((line, i) => {
                const stock = getProductStock(line.productId);
                const enough = stock.onHand >= Number(line.qty);
                const isMTO = procurementAlert(line.productId);
                return (
                  <div key={i} className={`p-2.5 rounded-btn border text-xs ${enough ? 'border-success/20 bg-success/5' : 'border-danger/20 bg-danger/5'}`}>
                    <p className="font-medium text-text-primary mb-1 truncate">{line.productName}</p>
                    <div className="flex gap-3 text-text-muted">
                      <span>Need: <strong className="text-text-primary">{line.qty}</strong></span>
                      <span>Avail: <strong className={enough ? 'text-success' : 'text-danger'}>{stock.onHand}</strong></span>
                      {isMTO && <span className="text-warning font-semibold">MTO</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Timestamps */}
          {(order.createdAt || order.updatedAt) && (
            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="text-sm font-semibold text-text-primary mb-3">Timestamps</h2>
              <div className="space-y-2 text-xs text-text-muted">
                {order.createdAt && <p>Created: <span className="text-text-secondary">{formatDateTime(order.createdAt)}</span></p>}
                {order.updatedAt && <p>Last updated: <span className="text-text-secondary">{formatDateTime(order.updatedAt)}</span></p>}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Confirm Modal ───────────────────────── */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setConfirmModal(false)}>
            <motion.div className="modal" initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
              <div className="modal-header">
                <h2 className="text-base font-semibold text-text-primary">Confirm Sales Order</h2>
                <button onClick={() => setConfirmModal(false)} className="btn-ghost btn-icon"><XCircle className="w-4 h-4" /></button>
              </div>
              <div className="modal-body space-y-3">
                <p className="text-sm text-text-secondary">
                  Confirming <strong className="text-primary">{order.id}</strong> will reserve stock for all product lines.
                </p>
                <div className="alert-info text-xs">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  Products with insufficient stock and MTO procurement strategy will auto-trigger a PO/MO.
                </div>
                <div className="space-y-1">
                  {order.lines?.map((line, i) => {
                    const stock = getProductStock(line.productId);
                    const enough = stock.freeToUse >= Number(line.qty);
                    return (
                      <div key={i} className={`flex justify-between text-xs p-2 rounded-btn ${enough ? 'bg-success/5' : 'bg-warning/5'}`}>
                        <span className="text-text-secondary">{line.productName}</span>
                        <span className={enough ? 'text-success font-medium' : 'text-warning font-medium'}>
                          {enough ? `✓ ${stock.freeToUse} free` : `⚠ ${stock.freeToUse} free, need ${line.qty}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setConfirmModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleConfirm} className="btn-primary">
                  <CheckCircle className="w-4 h-4" />
                  Confirm Order
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cancel Modal ────────────────────────── */}
      <AnimatePresence>
        {cancelModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setCancelModal(false)}>
            <motion.div className="modal" initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
              <div className="modal-header">
                <h2 className="text-base font-semibold text-text-primary">Cancel Sales Order</h2>
                <button onClick={() => setCancelModal(false)} className="btn-ghost btn-icon"><XCircle className="w-4 h-4" /></button>
              </div>
              <div className="modal-body">
                <div className="alert-danger text-sm mb-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  This action cannot be undone.
                </div>
                <p className="text-sm text-text-secondary">
                  Cancel <strong className="text-primary">{order.id}</strong>?
                  {['Confirmed', 'Partial'].includes(order.status) && ' Reserved stock will be unreserved.'}
                </p>
              </div>
              <div className="modal-footer">
                <button onClick={() => setCancelModal(false)} className="btn-secondary">Keep Order</button>
                <button onClick={handleCancel} className="btn-danger">
                  <XCircle className="w-4 h-4" />
                  Cancel Order
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Deliver Modal ───────────────────────── */}
      <AnimatePresence>
        {deliverModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setDeliverModal(false)}>
            <motion.div className="modal" initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
              <div className="modal-header">
                <h2 className="text-base font-semibold text-text-primary">
                  {order.status === 'Partial' ? 'Deliver Remaining' : 'Deliver Order'}
                </h2>
                <button onClick={() => setDeliverModal(false)} className="btn-ghost btn-icon"><XCircle className="w-4 h-4" /></button>
              </div>
              <div className="modal-body space-y-3">
                <p className="text-sm text-text-secondary">
                  Delivering <strong className="text-primary">{order.id}</strong> will reduce stock for all product lines and add entries to the Stock Ledger.
                </p>
                <div className="space-y-1">
                  {order.lines?.map((line, i) => {
                    const stock = getProductStock(line.productId);
                    const isMTO = procurementAlert(line.productId);
                    const enough = stock.onHand >= Number(line.qty);
                    return (
                      <div key={i} className={`flex justify-between text-xs p-2 rounded-btn border ${
                        isMTO && !enough ? 'border-warning/30 bg-warning/5' : enough ? 'border-success/20 bg-success/5' : 'border-danger/20 bg-danger/5'
                      }`}>
                        <span className="text-text-secondary">{line.productName}</span>
                        <div className="text-right">
                          <span className={enough ? 'text-success font-medium' : 'text-danger font-medium'}>
                            {enough ? `✓ OK (${stock.onHand} avail)` : `⚠ Short (${stock.onHand}/${line.qty})`}
                          </span>
                          {isMTO && !enough && (
                            <p className="text-warning mt-0.5">MTO → Procurement Triggered</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setDeliverModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleDeliver} className="btn-success">
                  <Truck className="w-4 h-4" />
                  {order.status === 'Partial' ? 'Deliver Remaining' : 'Deliver'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
