import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle, XCircle, Factory,
  Play, StopCircle, AlertTriangle, User, Calendar,
  Hash, ClipboardList, Info, Package, Layers,
} from 'lucide-react';
import { PageWrapper, formatDate, formatDateTime } from '../../components/UI';
import StatusBadge from '../../components/StatusBadge';
import {
  getOne, STORES, upsert, addAuditLog,
  adjustStock, addLedgerEntry, getProductStock, getStore, setStore,
} from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

/* ── Status helpers ─────────────────────────────────── */
const WO_STATUS_STYLE = {
  'Pending':     'badge-draft',
  'In Progress': 'badge-progress',
  'Done':        'badge-done',
};
const WO_STATUS_DOT = {
  'Pending':     'bg-status-draft',
  'In Progress': 'bg-status-progress',
  'Done':        'bg-status-done',
};

export default function ManufacturingDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast    = useToast();

  const [confirmModal, setConfirmModal] = useState(false);
  const [cancelModal,  setCancelModal]  = useState(false);
  const [doneModal,    setDoneModal]    = useState(false);

  // Always read fresh
  const order = getOne(STORES.MANUFACTURING_ORDERS, id);

  if (!order) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Factory className="w-12 h-12 text-text-muted mb-4" />
          <p className="text-text-primary font-semibold mb-1">Order not found</p>
          <p className="text-text-muted text-sm mb-4">
            Manufacturing order <span className="font-mono">{id}</span> does not exist.
          </p>
          <Link to="/manufacturing" className="btn-primary btn-sm">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Manufacturing
          </Link>
        </div>
      </PageWrapper>
    );
  }

  const workOrders  = order.workOrders  || [];
  const components  = order.components  || [];
  const allWODone   = workOrders.length > 0 && workOrders.every(w => w.status === 'Done');
  const anyWOActive = workOrders.some(w => w.status === 'In Progress');

  /* ── helpers to update work orders in order ─────── */
  const updateWorkOrder = (woId, newStatus) => {
    const updated = {
      ...order,
      workOrders: workOrders.map(w => w.id === woId ? { ...w, status: newStatus } : w),
    };
    // Auto-set MO to In Progress when first WO starts
    if (newStatus === 'In Progress' && order.status === 'Confirmed') {
      updated.status = 'In Progress';
      addAuditLog({
        user: user?.name, role: user?.role,
        module: 'Manufacturing', action: 'Started',
        reference: order.id, oldValue: 'Confirmed', newValue: 'In Progress',
      });
      toast(`${order.id} is now In Progress`, 'info');
    }
    upsert(STORES.MANUFACTURING_ORDERS, updated);
    navigate(0);
  };

  /* ── Confirm ─────────────────────────────────────── */
  const handleConfirm = () => {
    // Reserve component stock
    components.forEach(comp => {
      adjustStock(comp.componentId, { deltaReserved: Number(comp.required) });
      addLedgerEntry({
        productId:   comp.componentId,
        productName: comp.componentName,
        type:        'RESERVE',
        qty:          Number(comp.required),
        reference:    order.id,
        note:        `Component reserved for MO — ${order.id}`,
      });
    });

    upsert(STORES.MANUFACTURING_ORDERS, { ...order, status: 'Confirmed' });
    addAuditLog({
      user: user?.name, role: user?.role,
      module: 'Manufacturing', action: 'Confirmed',
      reference: order.id, oldValue: 'Draft', newValue: 'Confirmed',
    });
    toast(`${order.id} confirmed — components reserved`, 'success');
    setConfirmModal(false);
    navigate(0);
  };

  /* ── Cancel ──────────────────────────────────────── */
  const handleCancel = () => {
    const old = order.status;
    // Unreserve if was confirmed / in progress
    if (['Confirmed', 'In Progress'].includes(old)) {
      components.forEach(comp => {
        adjustStock(comp.componentId, { deltaReserved: -Number(comp.required) });
        addLedgerEntry({
          productId:   comp.componentId,
          productName: comp.componentName,
          type:        'UNRESERVE',
          qty:         -Number(comp.required),
          reference:    order.id,
          note:        `Unreserved on MO cancel — ${order.id}`,
        });
      });
    }
    upsert(STORES.MANUFACTURING_ORDERS, { ...order, status: 'Cancelled' });
    addAuditLog({
      user: user?.name, role: user?.role,
      module: 'Manufacturing', action: 'Cancelled',
      reference: order.id, oldValue: old, newValue: 'Cancelled',
    });
    toast(`${order.id} cancelled`, 'warning');
    setCancelModal(false);
    navigate(0);
  };

  /* ── Mark Done ───────────────────────────────────── */
  const handleDone = () => {
    const qty = Number(order.qty);

    // Deduct component stock (on-hand + reserved)
    components.forEach(comp => {
      const deduct = Number(comp.required);
      adjustStock(comp.componentId, {
        deltaOnHand:  -deduct,
        deltaReserved: -deduct,
      });
      addLedgerEntry({
        productId:   comp.componentId,
        productName: comp.componentName,
        type:        'OUT',
        qty:         -deduct,
        reference:    order.id,
        note:        `Component consumed — ${order.id}`,
      });
    });

    // Add finished product stock
    adjustStock(order.productId, { deltaOnHand: qty });
    addLedgerEntry({
      productId:   order.productId,
      productName: order.productName,
      type:        'IN',
      qty:          qty,
      reference:    order.id,
      note:        `Produced — ${order.id}`,
    });

    upsert(STORES.MANUFACTURING_ORDERS, { ...order, status: 'Done' });
    addAuditLog({
      user: user?.name, role: user?.role,
      module: 'Manufacturing', action: 'Completed',
      reference: order.id, oldValue: order.status, newValue: 'Done',
    });
    toast(`${order.id} completed — ${qty} × ${order.productName} added to stock`, 'success');
    setDoneModal(false);
    navigate(0);
  };

  /* ── Render ──────────────────────────────────────── */
  return (
    <PageWrapper>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/manufacturing')} className="btn-ghost btn-icon">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title font-mono">{order.id}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="page-subtitle">
              {order.productName} · Qty {order.qty} · {order.assignee}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {order.status === 'Draft' && (
            <>
              <button onClick={() => setConfirmModal(true)} className="btn-primary">
                <CheckCircle className="w-4 h-4" />
                Confirm
              </button>
              <button onClick={() => setCancelModal(true)} className="btn-danger">
                <XCircle className="w-4 h-4" />
                Cancel
              </button>
            </>
          )}
          {order.status === 'Confirmed' && (
            <button onClick={() => setCancelModal(true)} className="btn-danger">
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          )}
          {(order.status === 'In Progress') && allWODone && (
            <button onClick={() => setDoneModal(true)} className="btn-success">
              <CheckCircle className="w-4 h-4" />
              Mark as Done
            </button>
          )}
          {order.status === 'In Progress' && !allWODone && (
            <button onClick={() => setCancelModal(true)} className="btn-danger">
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">

          {/* Info */}
          <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-purple-400" />
              Order Information
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { icon: Hash,     label: 'MO Number',  value: order.id,          mono: true },
                { icon: Package,  label: 'Product',    value: order.productName },
                { icon: Factory,  label: 'Quantity',   value: `${order.qty} units`, bold: true },
                { icon: User,     label: 'Assignee',   value: order.assignee || '—' },
                { icon: Calendar, label: 'Date',       value: formatDate(order.date) },
                { icon: Info,     label: 'Status',     value: <StatusBadge status={order.status} /> },
              ].map(item => (
                <div key={item.label} className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </div>
                  <div className={`text-sm ${
                    item.mono ? 'font-mono text-purple-400 font-semibold'
                    : item.bold ? 'font-bold text-text-primary'
                    : 'text-text-primary'
                  }`}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Components table */}
          {components.length > 0 && (
            <motion.div
              className="table-container"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.07 }}
            >
              <div className="px-4 py-3 bg-bg-surface/50 border-b border-border">
                <h2 className="text-sm font-semibold text-text-primary">Components</h2>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th className="text-center">Required</th>
                    <th className="text-center">Available</th>
                    <th className="text-center">Stock Status</th>
                  </tr>
                </thead>
                <tbody>
                  {components.map((comp, i) => {
                    const stock     = getProductStock(comp.componentId);
                    const sufficient = stock.onHand >= Number(comp.required);
                    return (
                      <tr key={i} className={sufficient ? '' : 'stock-low'}>
                        <td>
                          <p className="font-medium text-text-primary">{comp.componentName}</p>
                        </td>
                        <td className="text-center font-semibold">{comp.required}</td>
                        <td className={`text-center font-semibold ${sufficient ? 'text-success' : 'text-danger'}`}>
                          {stock.onHand}
                        </td>
                        <td className="text-center">
                          {sufficient ? (
                            <span className="badge-done">
                              <span className="w-1.5 h-1.5 rounded-full bg-status-done" />
                              OK
                            </span>
                          ) : (
                            <span className="badge-cancelled">
                              <span className="w-1.5 h-1.5 rounded-full bg-status-cancelled" />
                              Short {stock.onHand - Number(comp.required)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>
          )}

          {/* Work Orders */}
          {workOrders.length > 0 && (
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  Work Orders
                </h2>
                <span className="text-xs text-text-muted">
                  {workOrders.filter(w => w.status === 'Done').length}/{workOrders.length} done
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-bg-light rounded-full mb-5 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(workOrders.filter(w => w.status === 'Done').length / workOrders.length) * 100}%`,
                  }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>

              <div className="space-y-3">
                {workOrders.map((wo, i) => {
                  const prevDone = i === 0 || workOrders[i - 1].status === 'Done';
                  const canStart = prevDone && wo.status === 'Pending' && ['Confirmed', 'In Progress'].includes(order.status);
                  const canComplete = wo.status === 'In Progress';

                  return (
                    <motion.div
                      key={wo.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex items-start justify-between gap-4 p-4 rounded-btn border transition-all ${
                        wo.status === 'Done'        ? 'border-success/20 bg-success/5'
                        : wo.status === 'In Progress' ? 'border-warning/30 bg-warning/5'
                        : 'border-border bg-bg-surface/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Step number */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          wo.status === 'Done'        ? 'bg-success text-white'
                          : wo.status === 'In Progress' ? 'bg-warning text-white'
                          : 'bg-bg-light text-text-muted border border-border'
                        }`}>
                          {wo.status === 'Done' ? '✓' : i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{wo.name}</p>
                          <p className="text-xs text-text-muted mt-0.5">
                            {wo.workCenter} · {wo.duration}h
                          </p>
                          <span className={`${WO_STATUS_STYLE[wo.status]} mt-2 inline-flex`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${WO_STATUS_DOT[wo.status]}`} />
                            {wo.status}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 shrink-0">
                        {canStart && (
                          <button
                            onClick={() => updateWorkOrder(wo.id, 'In Progress')}
                            className="btn-accent btn-sm"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Start
                          </button>
                        )}
                        {canComplete && (
                          <button
                            onClick={() => updateWorkOrder(wo.id, 'Done')}
                            className="btn-success btn-sm"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Complete
                          </button>
                        )}
                        {wo.status === 'Done' && (
                          <span className="flex items-center gap-1.5 text-xs text-success font-medium px-2">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Completed
                          </span>
                        )}
                        {wo.status === 'Pending' && !canStart && (
                          <span className="text-xs text-text-muted px-2 self-center">
                            Waiting…
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {allWODone && order.status === 'In Progress' && (
                <motion.div
                  className="mt-4 p-4 rounded-btn bg-success/5 border border-success/30 flex items-center justify-between"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-sm font-semibold text-success">
                      All work orders completed!
                    </span>
                  </div>
                  <button onClick={() => setDoneModal(true)} className="btn-success btn-sm">
                    Mark as Done
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status timeline */}
          <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-sm font-semibold text-text-primary mb-4">MO Status</h2>
            <div className="space-y-3">
              {[
                { label: 'Draft',       done: true },
                { label: 'Confirmed',   done: ['Confirmed', 'In Progress', 'Done'].includes(order.status) },
                { label: 'In Progress', done: ['In Progress', 'Done'].includes(order.status) },
                { label: 'Done',        done: order.status === 'Done' },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    step.done ? 'bg-purple-400 text-white' : 'bg-bg-light text-text-muted border border-border'
                  }`}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  <span className={`text-sm ${step.done ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
                    {step.label}
                  </span>
                  {order.status === step.label && (
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-purple-400/10 text-purple-400 font-medium">
                      Current
                    </span>
                  )}
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

          {/* Work order progress summary */}
          {workOrders.length > 0 && (
            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <h2 className="text-sm font-semibold text-text-primary mb-3">Work Order Progress</h2>
              <div className="space-y-2">
                {workOrders.map((wo, i) => (
                  <div key={wo.id} className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${WO_STATUS_DOT[wo.status]}`} />
                    <span className="text-text-secondary truncate flex-1">{wo.name}</span>
                    <span className={`font-medium ${
                      wo.status === 'Done' ? 'text-success'
                      : wo.status === 'In Progress' ? 'text-warning'
                      : 'text-text-muted'
                    }`}>{wo.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Timestamps */}
          {(order.createdAt || order.updatedAt) && (
            <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
                <h2 className="text-base font-semibold text-text-primary">Confirm Manufacturing Order</h2>
                <button onClick={() => setConfirmModal(false)} className="btn-ghost btn-icon"><XCircle className="w-4 h-4" /></button>
              </div>
              <div className="modal-body space-y-3">
                <p className="text-sm text-text-secondary">
                  Confirming <strong className="text-purple-400">{order.id}</strong> will reserve
                  component stock for production.
                </p>
                <div className="space-y-1.5">
                  {components.map((comp, i) => {
                    const stock      = getProductStock(comp.componentId);
                    const sufficient = stock.onHand >= Number(comp.required);
                    return (
                      <div key={i} className={`flex justify-between text-xs p-2 rounded-btn border ${
                        sufficient ? 'border-success/20 bg-success/5' : 'border-warning/30 bg-warning/5'
                      }`}>
                        <span className="text-text-secondary">{comp.componentName}</span>
                        <span className={sufficient ? 'text-success font-medium' : 'text-warning font-medium'}>
                          {sufficient ? `✓ ${stock.onHand} avail` : `⚠ ${stock.onHand}/${comp.required}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {!components.every(c => getProductStock(c.componentId).onHand >= Number(c.required)) && (
                  <div className="alert-warning text-xs">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    Some components are insufficient. You can still confirm and procure manually.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button onClick={() => setConfirmModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleConfirm} className="btn-primary">
                  <CheckCircle className="w-4 h-4" />
                  Confirm
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
                <h2 className="text-base font-semibold text-text-primary">Cancel Manufacturing Order</h2>
                <button onClick={() => setCancelModal(false)} className="btn-ghost btn-icon"><XCircle className="w-4 h-4" /></button>
              </div>
              <div className="modal-body">
                <div className="alert-danger text-sm mb-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  This action cannot be undone.
                </div>
                <p className="text-sm text-text-secondary">
                  Cancel <strong className="text-purple-400">{order.id}</strong>?
                  {['Confirmed', 'In Progress'].includes(order.status) && ' Reserved component stock will be unreserved.'}
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

      {/* ── Mark Done Modal ───────────────────────────── */}
      <AnimatePresence>
        {doneModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setDoneModal(false)}>
            <motion.div className="modal" initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
              <div className="modal-header">
                <h2 className="text-base font-semibold text-text-primary">Mark as Done</h2>
                <button onClick={() => setDoneModal(false)} className="btn-ghost btn-icon"><XCircle className="w-4 h-4" /></button>
              </div>
              <div className="modal-body space-y-3">
                <p className="text-sm text-text-secondary">
                  Completing <strong className="text-purple-400">{order.id}</strong> will:
                </p>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-center gap-2 text-danger">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                    Deduct component stock ({components.map(c => `${c.required} × ${c.componentName}`).join(', ')})
                  </li>
                  <li className="flex items-center gap-2 text-success">
                    <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                    Add {order.qty} × {order.productName} to inventory
                  </li>
                  <li className="flex items-center gap-2 text-text-muted">
                    <span className="w-1.5 h-1.5 rounded-full bg-text-muted shrink-0" />
                    Add Stock Ledger entries
                  </li>
                </ul>
              </div>
              <div className="modal-footer">
                <button onClick={() => setDoneModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleDone} className="btn-success">
                  <CheckCircle className="w-4 h-4" />
                  Mark as Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
