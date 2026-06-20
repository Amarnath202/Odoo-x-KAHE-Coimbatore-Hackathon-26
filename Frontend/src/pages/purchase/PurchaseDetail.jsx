import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Package, Truck, Hash, ClipboardList, Calendar, Info } from 'lucide-react';
import { PageWrapper, formatINR, formatDate, formatDateTime } from '../../components/UI';
import StatusBadge from '../../components/StatusBadge';
import { purchaseApi, warehousesApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

function labelStatus(s) {
  const M = { DRAFT:'Draft', CONFIRMED:'Confirmed', PARTIALLY_RECEIVED:'Partially Received', FULLY_RECEIVED:'Fully Received', CANCELLED:'Cancelled' };
  return M[s] ?? s;
}

export default function PurchaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [confirmModal, setConfirmModal] = useState(false);
  const [receiveModal, setReceiveModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [receiveQtys, setReceiveQtys] = useState({});

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await purchaseApi.getById(id);
      const o = res?.data ?? res;
      setOrder(o);
      // Init receive qtys
      const init = {};
      (o?.items ?? []).forEach(item => { init[item.id] = item.quantity - (item.receivedQty ?? 0); });
      setReceiveQtys(init);
    } catch { toast('Order not found', 'error'); navigate('/purchase'); }
    finally { setLoading(false); }
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
    setActionLoading(true);
    try {
      await purchaseApi.confirm(id);
      toast('Order confirmed', 'success');
      setConfirmModal(false);
      fetchOrder();
    } catch (err) { toast(err.message || 'Failed', 'error'); }
    finally { setActionLoading(false); }
  };

  const handleReceive = async () => {
    if (!warehouseId) { toast('Select a warehouse', 'error'); return; }
    setActionLoading(true);
    try {
      const items = Object.entries(receiveQtys).map(([purchaseOrderItemId, receivedQty]) => ({
        purchaseOrderItemId, receivedQty: Number(receivedQty),
      })).filter(i => i.receivedQty > 0);
      await purchaseApi.receive(id, { warehouseId, items });
      toast('Goods received — inventory updated', 'success');
      setReceiveModal(false);
      fetchOrder();
    } catch (err) { toast(err.message || 'Failed', 'error'); }
    finally { setActionLoading(false); }
  };

  if (loading) return (
    <PageWrapper><div className="flex items-center justify-center py-20"><span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div></PageWrapper>
  );
  if (!order) return null;

  const items = order.items ?? [];
  const status = order.status;

  return (
    <PageWrapper>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/purchase')} className="btn-ghost btn-icon"><ArrowLeft className="w-4 h-4" /></button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="page-title font-mono">{order.orderNumber ?? order.id}</h1>
              <StatusBadge status={labelStatus(status)} />
            </div>
            <p className="page-subtitle">{order.vendor?.name ?? '—'} · {formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === 'DRAFT' && (
            <button onClick={() => setConfirmModal(true)} className="btn-primary">
              <CheckCircle className="w-4 h-4" />Confirm Order
            </button>
          )}
          {['CONFIRMED', 'PARTIALLY_RECEIVED'].includes(status) && (
            <button onClick={() => setReceiveModal(true)} className="btn-success">
              <Package className="w-4 h-4" />Receive Goods
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />Order Information
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { icon: Hash,        label: 'PO Number', value: order.orderNumber ?? order.id, mono: true },
                { icon: Truck,       label: 'Vendor',    value: order.vendor?.name ?? '—' },
                { icon: Calendar,    label: 'Date',      value: formatDate(order.createdAt) },
                { icon: Package,     label: 'Items',     value: `${items.length} line(s)` },
                { icon: Info,        label: 'Status',    value: <StatusBadge status={labelStatus(status)} /> },
                { icon: CheckCircle, label: 'Total',     value: formatINR(order.totalAmount ?? 0), bold: true },
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
          </motion.div>

          <motion.div className="table-container" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <div className="px-4 py-3 bg-bg-surface/50 border-b border-border">
              <h2 className="text-sm font-semibold text-text-primary">Order Lines</h2>
            </div>
            <table className="table">
              <thead>
                <tr><th>#</th><th>Product</th><th className="text-center">Ordered</th><th className="text-center">Received</th><th className="text-right">Unit Price</th><th className="text-right">Subtotal</th></tr>
              </thead>
              <tbody>
                {items.map((line, i) => (
                  <tr key={line.id ?? i}>
                    <td className="text-text-muted text-xs">{i + 1}</td>
                    <td>
                      <p className="font-medium text-text-primary">{line.product?.name ?? '—'}</p>
                      <p className="text-xs text-text-muted font-mono">{line.product?.sku ?? ''}</p>
                    </td>
                    <td className="text-center font-semibold">{line.quantity}</td>
                    <td className="text-center text-accent font-semibold">{line.receivedQty ?? 0}</td>
                    <td className="text-right text-text-secondary">{formatINR(line.unitPrice ?? 0)}</td>
                    <td className="text-right font-semibold text-text-primary">{formatINR((line.quantity ?? 0) * (line.unitPrice ?? 0))}</td>
                  </tr>
                ))}
                <tr className="bg-bg-surface/40">
                  <td colSpan={5} className="text-right font-semibold text-text-secondary text-sm">Total</td>
                  <td className="text-right font-bold text-primary text-base">{formatINR(order.totalAmount ?? 0)}</td>
                </tr>
              </tbody>
            </table>
          </motion.div>
        </div>

        <div className="space-y-4">
          <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-sm font-semibold text-text-primary mb-4">Order Status</h2>
            <div className="space-y-3">
              {[
                { label: 'Draft',              done: true },
                { label: 'Confirmed',          done: ['CONFIRMED','PARTIALLY_RECEIVED','FULLY_RECEIVED'].includes(status) },
                { label: 'Partially Received', done: ['PARTIALLY_RECEIVED','FULLY_RECEIVED'].includes(status) },
                { label: 'Fully Received',     done: status === 'FULLY_RECEIVED' },
              ].map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${step.done ? 'bg-primary text-white' : 'bg-bg-light text-text-muted border border-border'}`}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  <span className={`text-sm ${step.done ? 'text-text-primary font-medium' : 'text-text-muted'}`}>{step.label}</span>
                </div>
              ))}
            </div>
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
            <motion.div className="modal" initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="modal-header">
                <h2 className="text-base font-semibold">Confirm Purchase Order</h2>
                <button onClick={() => setConfirmModal(false)} className="btn-ghost btn-icon"><XCircle className="w-4 h-4" /></button>
              </div>
              <div className="modal-body">
                <p className="text-sm text-text-secondary">Confirm <strong className="text-primary">{order.orderNumber ?? order.id}</strong>?</p>
              </div>
              <div className="modal-footer">
                <button onClick={() => setConfirmModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleConfirm} className="btn-primary" disabled={actionLoading}>
                  <CheckCircle className="w-4 h-4" />Confirm Order
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receive Modal */}
      <AnimatePresence>
        {receiveModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && setReceiveModal(false)}>
            <motion.div className="modal max-w-lg" initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="modal-header">
                <h2 className="text-base font-semibold">Receive Goods</h2>
                <button onClick={() => setReceiveModal(false)} className="btn-ghost btn-icon"><XCircle className="w-4 h-4" /></button>
              </div>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="label">Warehouse *</label>
                  <select className="select" value={warehouseId} onChange={e => setWarehouseId(e.target.value)}>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 rounded-btn border border-border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{item.product?.name ?? '—'}</p>
                        <p className="text-xs text-text-muted">Ordered: {item.quantity} | Received: {item.receivedQty ?? 0}</p>
                      </div>
                      <input type="number" min="0" max={item.quantity - (item.receivedQty ?? 0)} className="input w-24"
                        value={receiveQtys[item.id] ?? 0}
                        onChange={e => setReceiveQtys(prev => ({ ...prev, [item.id]: e.target.value }))} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button onClick={() => setReceiveModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleReceive} className="btn-success" disabled={actionLoading}>
                  <Package className="w-4 h-4" />Receive Goods
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageWrapper>
  );
}
