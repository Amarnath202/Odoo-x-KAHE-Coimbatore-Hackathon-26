import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Layers, Package, Save, Plus, Trash2, X } from 'lucide-react';
import { PageWrapper } from '../../components/UI';
import { bomsApi, productsApi, unitsApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

function emptyComponent() {
  return { _key: Date.now() + Math.random(), componentId: '', quantity: 1, unitId: '' };
}
function emptyOperation() {
  return { _key: Date.now() + Math.random(), name: '', sequence: 1, durationMinutes: 30 };
}

export default function BomCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '', version: '1.0', productId: '', companyId: '',
  });
  const [components, setComponents] = useState([emptyComponent()]);
  const [operations, setOperations] = useState([emptyOperation()]);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    const companyId = user?.companyId ?? '';
    setForm(f => ({ ...f, companyId }));
    const params = companyId ? { companyId } : {};
    Promise.all([
      productsApi.list({ ...params, procurementType: 'MANUFACTURING' }).catch(() => productsApi.list(params).catch(() => null)),
      unitsApi.list().catch(() => null),
    ]).then(([pRes, uRes]) => {
      setProducts(pRes?.data?.items ?? pRes?.data ?? []);
      setUnits(uRes?.data?.items ?? uRes?.data ?? []);
    });
  }, [user?.companyId]);

  useEffect(() => {
    if (!isEdit) return;
    bomsApi.getById(id).then(res => {
      const bom = res?.data ?? res;
      if (!bom) { toast('BoM not found', 'error'); navigate('/bom'); return; }
      setForm({ name: bom.name, version: bom.version ?? '1.0', productId: bom.productId ?? '', companyId: bom.companyId ?? user?.companyId ?? '' });
      setComponents(bom.components?.length > 0
        ? bom.components.map(c => ({ _key: c.id, componentId: c.componentId ?? '', quantity: c.quantity, unitId: c.unitId ?? '' }))
        : [emptyComponent()]);
      setOperations(bom.operations?.length > 0
        ? bom.operations.map(o => ({ _key: o.id, name: o.name, sequence: o.sequence, durationMinutes: o.durationMinutes ?? 30 }))
        : [emptyOperation()]);
    }).catch(() => { toast('Failed to load BoM', 'error'); navigate('/bom'); });
  }, [id, isEdit, navigate, toast, user?.companyId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast('BoM name is required', 'error'); return; }
    if (!form.productId) { toast('Please select a finished product', 'error'); return; }
    const validComponents = components.filter(c => c.componentId && c.quantity > 0);
    if (validComponents.length === 0) { toast('Add at least one component', 'error'); return; }

    setSaving(true);
    try {
      const body = {
        companyId: form.companyId || user?.companyId,
        name: form.name.trim(),
        version: form.version.trim(),
        productId: form.productId,
        components: validComponents.map(({ _key, ...c }) => ({
          productId: c.componentId,
          quantity: Number(c.quantity),
          ...(c.unitId ? { unitId: c.unitId } : {}),
        })),
        operations: operations
          .filter(o => o.name.trim())
          .map(({ _key, ...o }) => ({
            name: o.name.trim(),
            sequence: Number(o.sequence),
            durationMinutes: Number(o.durationMinutes),
          })),
      };

      if (isEdit) {
        await bomsApi.update(id, body);
        toast('BoM updated successfully', 'success');
      } else {
        const res = await bomsApi.create(body);
        toast('BoM created successfully', 'success');
        navigate(`/bom/${(res?.data ?? res)?.id}`);
        return;
      }
      navigate('/bom');
    } catch (err) {
      toast(err.message || 'Failed to save BoM', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to="/bom" className="btn-ghost btn-icon"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="page-title">{isEdit ? 'Edit Bill of Materials' : 'Create Bill of Materials'}</h1>
            <p className="page-subtitle">Define components and operations for a manufactured product</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
        {/* Header Info */}
        <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />BoM Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="form-group sm:col-span-2">
              <label className="label">BoM Name *</label>
              <input type="text" className="input" placeholder="e.g. Wooden Table Assembly v1"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Finished Product *</label>
              <select className="select" value={form.productId}
                onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} required>
                <option value="">— Select product —</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Version</label>
              <input type="text" className="input" placeholder="e.g. 1.0"
                value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
            </div>
          </div>
        </motion.div>

        {/* Components */}
        <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />Components *
            </h2>
            <button type="button" onClick={() => setComponents(p => [...p, emptyComponent()])} className="btn-secondary btn-sm">
              <Plus className="w-3.5 h-3.5" />Add Component
            </button>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {components.map((comp, idx) => (
                <motion.div key={comp._key}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-btn border border-border bg-bg-light/30">
                  <div className="sm:col-span-5 form-group !mb-0">
                    <label className="label">Component *</label>
                    <select className="select" value={comp.componentId}
                      onChange={e => setComponents(p => p.map(c => c._key === comp._key ? { ...c, componentId: e.target.value } : c))} required>
                      <option value="">— Select component —</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2 form-group !mb-0">
                    <label className="label">Qty *</label>
                    <input type="number" min="0.001" step="0.001" className="input" value={comp.quantity}
                      onChange={e => setComponents(p => p.map(c => c._key === comp._key ? { ...c, quantity: e.target.value } : c))} required />
                  </div>
                  <div className="sm:col-span-3 form-group !mb-0">
                    <label className="label">Unit</label>
                    <select className="select" value={comp.unitId}
                      onChange={e => setComponents(p => p.map(c => c._key === comp._key ? { ...c, unitId: e.target.value } : c))}>
                      <option value="">— Unit —</option>
                      {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex items-end pb-0.5">
                    {components.length > 1 && (
                      <button type="button"
                        onClick={() => setComponents(p => p.filter(c => c._key !== comp._key))}
                        className="btn-danger btn-icon btn-sm w-full justify-center">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Operations */}
        <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent" />Operations (Work Orders)
            </h2>
            <button type="button" onClick={() => setOperations(p => [...p, { ...emptyOperation(), sequence: p.length + 1 }])} className="btn-secondary btn-sm">
              <Plus className="w-3.5 h-3.5" />Add Operation
            </button>
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {operations.map((op, idx) => (
                <motion.div key={op._key}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-btn border border-border bg-bg-light/30">
                  <div className="sm:col-span-5 form-group !mb-0">
                    <label className="label">Operation Name</label>
                    <input type="text" className="input" placeholder="e.g. Cutting, Assembly"
                      value={op.name} onChange={e => setOperations(p => p.map(o => o._key === op._key ? { ...o, name: e.target.value } : o))} />
                  </div>
                  <div className="sm:col-span-2 form-group !mb-0">
                    <label className="label">Sequence</label>
                    <input type="number" min="1" className="input" value={op.sequence}
                      onChange={e => setOperations(p => p.map(o => o._key === op._key ? { ...o, sequence: e.target.value } : o))} />
                  </div>
                  <div className="sm:col-span-3 form-group !mb-0">
                    <label className="label">Duration (min)</label>
                    <input type="number" min="1" className="input" value={op.durationMinutes}
                      onChange={e => setOperations(p => p.map(o => o._key === op._key ? { ...o, durationMinutes: e.target.value } : o))} />
                  </div>
                  <div className="sm:col-span-2 flex items-end pb-0.5">
                    {operations.length > 1 && (
                      <button type="button"
                        onClick={() => setOperations(p => p.filter(o => o._key !== op._key))}
                        className="btn-danger btn-icon btn-sm w-full justify-center">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-4">
          <Link to="/bom" className="btn-secondary flex items-center gap-1.5"><X className="w-4 h-4" />Cancel</Link>
          <button type="submit" className="btn-primary flex items-center gap-1.5" disabled={saving}>
            {saving ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</span>
              : <><Save className="w-4 h-4" />{isEdit ? 'Save Changes' : 'Create BoM'}</>}
          </button>
        </div>
      </form>
    </PageWrapper>
  );
}
