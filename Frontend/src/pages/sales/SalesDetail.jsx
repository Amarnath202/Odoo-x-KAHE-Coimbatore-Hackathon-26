import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle, XCircle, Truck, AlertTriangle,
  Package, User, Calendar, Hash, ClipboardList, Info,
} from 'lucide-react';
import { PageWrapper, formatINR, formatDate, formatDateTime } from '../../components/UI';
import StatusBadge from '../../components/StatusBadge';
import { salesApi, warehousesApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

function labelStatus(status) {
  const MAP = {
    DRAFT: 'Draft', CONFIRMED: 'Confirmed',
    PARTIALLY_DELIVERED: 'Partially Delivered',
    FULLY_DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
  };
  return MAP[status] ?? status;
}

export default function SalesDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [confirmModal, setConfirmModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [deliverModal, setDeliverModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesApi.getById(id);
      setOrder(res?.data ?? res);
    } catch {
      toast('Order not found', 'error');
      navigate('/sales');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchOrder();
    warehousesApi.list(user?.companyId ? { companyId: user.companyId } : {})
      .then(res => {
        const list = res?.data?.items ?? res?.data ?? [];
        setWarehouses(list);
        if (list.length > 0) setWarehouseId(list[0].id);
      }).catch(() => {});
  }, [fetchOrder, user?.companyId]);

  const handleConfirm = async () => {
    if (!warehouseId) { toast('Please select a warehouse', 'error'); return; }
    setActionLoading(true);
    try {
      await salesApi.confirm(id, { warehouseId });
      toast('Order confirmed — stock reserved', 'success');
      setConfirmModal(false);
      fetchOrder();
    } catch (err) {
      toast(err.message || 'Failed to confirm order', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (['CONFIRMED', 'PARTIALLY_DELIVERED'].includes(order?.status) && !warehouseId) {
      toast('Please select a warehouse', 'error'); return;
    }
    setActionLoading(true);
    try {
      await salesApi.cancel(id, { warehouseId });
      toast('Order cancelled', 'warning');
      setCancelModal(false);
      fetchOrder();
    } catch (err) {
      toast(err.message || 'Failed to cancel order', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeliver = async () => {
    if (!warehouseId) { toast('Please select a warehouse', 'error'); return; }
    setActionLoading(true);
    try {
      const remainingItems = (order.items ?? order.lines ?? [])
        .filter(item => (item.quantity ?? item.qty) - (item.deliveredQty || 0) > 0)
        .map(item => ({
          salesOrderItemId: item.id,
          deliveredQty: (item.quantity ?? item.qty) - (item.deliveredQty || 0)
        }));

      if (remainingItems.length === 0) {
        toast('No items left to deliver', 'error');
        setActionLoading(false);
        return;
      }

      await salesApi.deliver(id, {
        warehouseId,
        items: remainingItems
      });
      toast('Delivery recorded — stock updated', 'success');
      setDeliverModal(false);
      fetchOrder();
    } catch (err) {
      toast(err.message || 'Failed to record delivery', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <PageWrapper>
      <div className="flex items-center justify-center py-20">
        <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </PageWrapper>
  );

  if (!order) return null;

  const items = order.items ?? order.lines ?? [];
  const status = order.status;

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
              <h1 className="page-title font-mono">{order.orderNumber ?? order.id}</h1>
              <StatusBadge status={labelStatus(status)} />
            </div>
            <p className="page-subtitle">{order.customer?.name ?? '—'} · {formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === 'DRAFT' && (
            <>
              <button onClick={() => setConfirmModal(true)} className="btn-primary">
                <CheckCircle className="w-4 h-4" />Confirm Order
              </button>
              <button onClick={() => setCancelModal(true)} className="btn-danger">
                <XCircle className="w-4 h-4" />Cancel
              </button>
            </>
          )}
          {status === 'CONFIRMED' && (
            <>
              <button onClick={() => setDeliverModal(true)} className="btn-success">
                <Truck className="w-4 h-4" />Deliver
              </button>
              <button onClick={() => setCancelModal(true)} className="btn-danger">
                <XCircle className="w-4 h-4" />Cancel
              </button>
            </>
          )}
          {status === 'PARTIALLY_DELIVERED' && (
            <button onClick={() => setDeliverModal(true)} className="btn-success">
              <Truck className="w-4 h-4" />Deliver Remaining
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />Order Information
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { icon: Hash,        label: 'SO Number',   value: order.orderNumber ?? order.id, mono: true },
                { icon: User,        label: 'Customer',    value: order.customer?.name ?? '—' },
                { icon: Calendar,    label: 'Order Date',  value: formatDate(order.createdAt) },
                { icon: Package,     label: 'Total Items', value: `${items.length} line(s)` },
                { icon: Info,        label: 'Status',      value: <StatusBadge status={labelStatus(status)} /> },
                { icon: CheckCircle, label: 'Total Value', value: formatINR(order.totalAmount ?? 0), bold: true },
              ].map(item => (
                <div key={item.label} className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-xs text-text-muted">
                    <item.icon className="w-3.5 h-3.5" />{item.label}
                  </div>
                  <div className={`text-sm ${item.mono ? 'font-mono text-primary font-semibold' : item.bold ? 'font-bold text-text-primary' : 'text-text-primary'}`}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            {order.notes && (
              <div className="mt-4 p-3 rounded-btn bg-bg-light border border-border">
                <p className="text-xs text-text-muted mb-1">Notes</p>
                <p className="text-sm text-text-secondary">{order.notes}</p>
              </div>
            )}
          </motion.div>

          {/* Line Items */}
          <motion.div className="table-container" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <div className="px-4 py-3 bg-bg-surface/50 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">Order Lines</h2>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th><th>Product</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((line, i) => (
                  <tr key={line.id ?? i}>
                    <td className="text-text-muted text-xs">{i + 1}</td>
                    <td>
                      <p className="font-medium text-text-primary">{line.product?.name ?? line.productName ?? '—'}</p>
                      <p className="text-xs text-text-muted font-mono">{line.product?.sku ?? ''}</p>
                    </td>
                    <td className="text-center font-semibold">{line.quantity ?? line.qty}</td>
                    <td className="text-right text-text-secondary">{formatINR(line.unitPrice ?? 0)}</td>
                    <td className="text-right font-semibold text-text-primary">
                      {formatINR((line.quantity ?? line.qty ?? 0) * (line.unitPrice ?? 0))}
                    </td>
                  </tr>
                ))}
                <tr className="bg-bg-surface/40">
                  <td colSpan={4} className="text-right font-semibold text-text-secondary text-sm">Total</td>
                  <td className="text-right font-bold text-primary text-base">{formatINR(order.totalAmount ?? 0)}</td>
                </tr>
              </tbody>
            </table>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-sm font-semibold text-text-primary mb-4">Order Status</h2>
            <div className="space-y-3">
              {[
                { label: 'Draft',                done: true },
                { label: 'Confirmed',            done: ['CONFIRMED', 'PARTIALLY_DELIVERED', 'FULLY_DELIVERED'].includes(status) },
                { label: 'Partially Delivered',  done: ['PARTIALLY_DELIVERED', 'FULLY_DELIVERED'].includes(status) },
                { label: 'Delivered',            done: status === 'FULLY_DELIVERED' },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    step.done ? 'bg-primary text-white' : 'bg-bg-light text-text-muted border border-border'
                  }`}>{step.done ? '✓' : i + 1}</div>
                  <span className={`text-sm ${step.done ? 'text-text-primary font-medium' : 'text-text-muted'}`}>{step.label}</span>
                </div>
              ))}
            </div>
            {status === 'CANCELLED' && (
              <div className="mt-4 p-3 rounded-btn bg-danger/5 border border-danger/20">
                <p className="text-xs text-danger font-medium flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />This order has been cancelled
                </p>
              </div>
            )}
          </motion.div>

          <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-sm font-semibold text-text-primary mb-3">Timestamps</h2>
            <div className="space-y-2 text-xs text-text-muted">
              {order.createdAt && <p>Created: <span className="text-text-secondary">{formatDateTime(order.createdAt)}</span></p>}
              {order.updatedAt && <p>Updated: <span className="text-text-secondary">{formatDateTime(order.updatedAt)}</span></p>}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Confirm Modal */}
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
              <div className="modal-body space-y-4">
                <p className="text-sm text-text-secondary">Confirming this order will reserve stock for all product lines.</p>
                <div className="form-group">
                  <label className="label">Warehouse *</label>
                  <select className="select" value={warehouseId} onChange={e => setWarehouseId(e.target.value)}>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="alert-info text-xs">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  If stock is insufficient, procurement will be triggered automatically.
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setConfirmModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleConfirm} className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Confirm Order
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Modal */}
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
              <div className="modal-body space-y-4">
                <div className="alert-danger text-sm mb-3"><AlertTriangle className="w-4 h-4 shrink-0" />This cannot be undone.</div>
                <p className="text-sm text-text-secondary">Cancel <strong className="text-primary">{order.orderNumber ?? order.id}</strong>?
                  {['CONFIRMED', 'PARTIALLY_DELIVERED'].includes(status) && ' Reserved stock will be released.'}
                </p>
                {['CONFIRMED', 'PARTIALLY_DELIVERED'].includes(status) && (
                  <div className="form-group">
                    <label className="label">Release from Warehouse *</label>
                    <select className="select" value={warehouseId} onChange={e => setWarehouseId(e.target.value)}>
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button onClick={() => setCancelModal(false)} className="btn-secondary">Keep Order</button>
                <button onClick={handleCancel} className="btn-danger" disabled={actionLoading}>
                  <XCircle className="w-4 h-4" />Cancel Order
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deliver Modal */}
      <AnimatePresence>
        {deliverModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setDeliverModal(false)}>
            <motion.div className="modal" initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
              <div className="modal-header">
                <h2 className="text-base font-semibold text-text-primary">
                  {status === 'PARTIALLY_DELIVERED' ? 'Deliver Remaining' : 'Deliver Order'}
                </h2>
                <button onClick={() => setDeliverModal(false)} className="btn-ghost btn-icon"><XCircle className="w-4 h-4" /></button>
              </div>
              <div className="modal-body space-y-4">
                <p className="text-sm text-text-secondary">This will deduct stock and record delivery for all remaining items in <strong className="text-primary">{order.orderNumber ?? order.id}</strong>.</p>
                <div className="form-group">
                  <label className="label">Delivering from Warehouse *</label>
                  <select className="select" value={warehouseId} onChange={e => setWarehouseId(e.target.value)}>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setDeliverModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleDeliver} className="btn-success" disabled={actionLoading}>
                  <Truck className="w-4 h-4" />Deliver
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
