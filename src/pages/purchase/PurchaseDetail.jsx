import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle, XCircle, PackageCheck,
  Truck, User, Calendar, Hash, ClipboardList, Info,
  AlertTriangle, Package,
} from 'lucide-react';
import { PageWrapper, formatINR, formatDate, formatDateTime } from '../../components/UI';
import StatusBadge from '../../components/StatusBadge';
import {
  getOne, STORES, upsert, addAuditLog,
  adjustStock, addLedgerEntry, getProductStock,
} from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

function badgeLabel(status) {
  if (status === 'Partial') return 'Partially Received';
  if (status === 'Done')    return 'Done';
  return status;
}

export default function PurchaseDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast    = useToast();

  const [confirmModal, setConfirmModal] = useState(false);
  const [cancelModal,  setCancelModal]  = useState(false);
  const [receiveModal, setReceiveModal] = useState(false);

  const order = getOne(STORES.PURCHASE_ORDERS, id);

  if (!order) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Truck className="w-12 h-12 text-text-muted mb-4" />
          <p className="text-text-primary font-semibold mb-1">Order not found</p>
          <p className="text-text-muted text-sm mb-4">
            Purchase order <span className="font-mono">{id}</span> does not exist.
          </p>
          <Link to="/purchase" className="btn-primary btn-sm">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Purchase
          </Link>
        </div>
      </PageWrapper>
    );
  }

  /* ── Confirm ─────────────────────────────────── */
  const handleConfirm = () => {
    upsert(STORES.PURCHASE_ORDERS, { ...order, status: 'Confirmed' });
    addAuditLog({
      user: user?.name, role: user?.role,
      module: 'Purchase', action: 'Confirmed',
      reference: order.id, oldValue: 'Draft', newValue: 'Confirmed',
    });
    toast(`${order.id} confirmed`, 'success');
    setConfirmModal(false);
    navigate(0);
  };

  /* ── Cancel ──────────────────────────────────── */
  const handleCancel = () => {
    const old = order.status;
    upsert(STORES.PURCHASE_ORDERS, { ...order, status: 'Cancelled' });
    addAuditLog({
      user: user?.name, role: user?.role,
      module: 'Purchase', action: 'Cancelled',
      reference: order.id, oldValue: old, newValue: 'Cancelled',
    });
    toast(`${order.id} cancelled`, 'warning');
    setCancelModal(false);
    navigate(0);
  };

  /* ── Receive ─────────────────────────────────── */
  const handleReceive = (partial = false) => {
    const old = order.status;
    const newStatus = partial ? 'Partial' : 'Done';

    order.lines.forEach(line => {
      const qty = Number(line.qty);
      // Increase on-hand stock
      adjustStock(line.productId, { deltaOnHand: qty });
      // Stock ledger IN entry
      addLedgerEntry({
        productId:   line.productId,
        productName: line.productName,
        type:        'IN',
        qty:          qty,
        reference:    order.id,
        note:        `Received from ${order.vendor} — ${order.id}`,
      });
    });

    upsert(STORES.PURCHASE_ORDERS, { ...order, status: newStatus });
    addAuditLog({
      user: user?.name, role: user?.role,
      module:    'Purchase',
      action:    partial ? 'Partially Received' : 'Received',
      reference: order.id,
      oldValue:  old,
      newValue:  newStatus,
    });

    toast(
      partial
        ? `${order.id} partially received — stock updated`
        : `${order.id} fully received — stock updated`,
      'success'
    );
    setReceiveModal(false);
    navigate(0);
  };

  /* ── Render ──────────────────────────────────── */
  return (
    <PageWrapper>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/purchase')} className="btn-ghost btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title font-mono">{order.id}</h1>
              <StatusBadge status={badgeLabel(order.status)} />
            </div>
            <p className="page-subtitle">{order.vendor} · {formatDate(order.date)}</p>
          </div>
        </div>

        {/* Action buttons */}
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
              <button onClick={() => setReceiveModal(true)} className="btn-success">
                <PackageCheck className="w-4 h-4" />
                Receive Products
              </button>
              <button onClick={() => setCancelModal(true)} className="btn-danger">
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}
          {order.status === 'Partial' && (
            <button onClick={() => setReceiveModal(true)} className="btn-success">
              <PackageCheck className="w-4 h-4" />
              Receive Remaining
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">

          {/* Info card */}
          <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              Order Information
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { icon: Hash,         label: 'PO Number',   value: order.id,                       mono: true },
                { icon: User,         label: 'Vendor',      value: order.vendor },
                { icon: Calendar,     label: 'Order Date',  value: formatDate(order.date) },
                { icon: Package,      label: 'Total Items', value: `${order.lines?.length || 0} line${order.lines?.length !== 1 ? 's' : ''}` },
                { icon: Info,         label: 'Status',      value: <StatusBadge status={badgeLabel(order.status)} /> },
                { icon: CheckCircle,  label: 'Total Value', value: formatINR(order.total || 0),    bold: true },
              ].map(item => (
                <div key={item.label} className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </div>
                  <div className={`text-sm ${
                    item.mono ? 'font-mono text-primary font-semibold'
                    : item.bold ? 'font-bold text-text-primary'
                    : 'text-text-primary'
                  }`}>
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
                  <th className="text-right">Unit Cost</th>
                  <th className="text-right">Subtotal</th>
                  <th className="text-center">Current Stock</th>
                </tr>
              </thead>
              <tbody>
                {order.lines?.map((line, i) => {
                  const stock = getProductStock(line.productId);
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
                      <td className="text-right text-text-secondary">{formatINR(line.unitCost)}</td>
                      <td className="text-right font-semibold text-text-primary">{formatINR(line.subtotal)}</td>
                      <td className="text-center">
                        <div className="text-xs">
                          <span className="text-text-muted">On Hand: </span>
                          <span className="font-semibold text-text-primary">{stock.onHand}</span>
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

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status timeline */}
          <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-sm font-semibold text-text-primary mb-4">Order Status</h2>
            <div className="space-y-3">
              {[
                { label: 'Draft',              done: true },
                { label: 'Confirmed',          done: ['Confirmed', 'Partial', 'Done'].includes(order.status) },
                { label: 'Partially Received', done: ['Partial', 'Done'].includes(order.status) },
                { label: 'Fully Received',     done: order.status === 'Done' },
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

          {/* Timestamps */}
          {(order.createdAt || order.updatedAt) && (
            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <h2 className="text-sm font-semibold text-text-primary mb-3">Timestamps</h2>
              <div className="space-y-2 text-xs text-text-muted">
                {order.createdAt && <p>Created: <span className="text-text-secondary">{formatDateTime(order.createdAt)}</span></p>}
                {order.updatedAt && <p>Updated: <span className="text-text-secondary">{formatDateTime(order.updatedAt)}</span></p>}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Confirm Modal ─────────────────────────────── */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setConfirmModal(false)}>
            <motion.div className="modal" initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
              <div className="modal-header">
                <h2 className="text-base font-semibold text-text-primary">Confirm Purchase Order</h2>
                <button onClick={() => setConfirmModal(false)} className="btn-ghost btn-icon">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="modal-body">
                <p className="text-sm text-text-secondary">
                  Confirm <strong className="text-primary">{order.id}</strong> from vendor{' '}
                  <strong>{order.vendor}</strong>?
                </p>
                <div className="alert-info text-xs mt-3">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  Stock will be updated when products are received.
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

      {/* ── Cancel Modal ──────────────────────────────── */}
      <AnimatePresence>
        {cancelModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setCancelModal(false)}>
            <motion.div className="modal" initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
              <div className="modal-header">
                <h2 className="text-base font-semibold text-text-primary">Cancel Purchase Order</h2>
                <button onClick={() => setCancelModal(false)} className="btn-ghost btn-icon">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="modal-body">
                <div className="alert-danger text-sm mb-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  This action cannot be undone.
                </div>
                <p className="text-sm text-text-secondary">
                  Cancel <strong className="text-primary">{order.id}</strong>?
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

      {/* ── Receive Modal ─────────────────────────────── */}
      <AnimatePresence>
        {receiveModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setReceiveModal(false)}>
            <motion.div className="modal" initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
              <div className="modal-header">
                <h2 className="text-base font-semibold text-text-primary">
                  {order.status === 'Partial' ? 'Receive Remaining Products' : 'Receive Products'}
                </h2>
                <button onClick={() => setReceiveModal(false)} className="btn-ghost btn-icon">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="modal-body space-y-3">
                <p className="text-sm text-text-secondary">
                  Receiving products for <strong className="text-primary">{order.id}</strong> will
                  increase On Hand stock and add entries to the Stock Ledger.
                </p>
                <div className="space-y-1.5">
                  {order.lines?.map((line, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-2 rounded-btn bg-success/5 border border-success/20">
                      <span className="text-text-secondary">{line.productName}</span>
                      <span className="text-success font-semibold">+{line.qty} units</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setReceiveModal(false)} className="btn-secondary">Cancel</button>
                {order.status === 'Confirmed' && (
                  <button onClick={() => handleReceive(true)} className="btn-secondary">
                    Partial Receive
                  </button>
                )}
                <button onClick={() => handleReceive(false)} className="btn-success">
                  <PackageCheck className="w-4 h-4" />
                  {order.status === 'Partial' ? 'Receive Remaining' : 'Receive All'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
