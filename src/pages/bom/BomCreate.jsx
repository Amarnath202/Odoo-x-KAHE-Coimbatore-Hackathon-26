import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react';
import { PageWrapper } from '../../components/UI';
import { getStore, STORES, getOne, upsert, nextRef, addAuditLog } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function BomCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEdit = !!id;

  const [allProducts, setAllProducts] = useState([]);

  const [form, setForm] = useState({
    name: '',
    finishedProductId: '',
    finishedProductName: '',
  });

  const [components, setComponents] = useState([
    { id: `C-${Date.now()}`, componentId: '', componentName: '', qty: 1 },
  ]);

  const [operations, setOperations] = useState([
    { id: `O-${Date.now()}`, name: '', workCenter: '', duration: 1 },
  ]);

  useEffect(() => {
    const prods = getStore(STORES.PRODUCTS);
    setAllProducts(prods);

    if (isEdit) {
      const bom = getOne(STORES.BOM, id);
      if (bom) {
        setForm({
          name: bom.name || '',
          finishedProductId: bom.finishedProductId || '',
          finishedProductName: bom.finishedProductName || '',
        });
        setComponents(bom.components?.length > 0 ? bom.components : [{ id: `C-${Date.now()}`, componentId: '', componentName: '', qty: 1 }]);
        setOperations(bom.operations?.length > 0 ? bom.operations : [{ id: `O-${Date.now()}`, name: '', workCenter: '', duration: 1 }]);
      } else {
        toast('BoM not found', 'error');
        navigate('/bom');
      }
    }
  }, [id, isEdit, navigate, toast]);

  // Components handlers
  const addComponent = () => {
    setComponents(prev => [...prev, { id: `C-${Date.now()}`, componentId: '', componentName: '', qty: 1 }]);
  };

  const removeComponent = (cid) => {
    setComponents(prev => prev.filter(c => c.id !== cid));
  };

  const updateComponent = (cid, field, value) => {
    setComponents(prev => prev.map(c => {
      if (c.id !== cid) return c;
      if (field === 'componentId') {
        const prod = allProducts.find(p => p.id === value);
        return { ...c, componentId: value, componentName: prod ? prod.name : '' };
      }
      return { ...c, [field]: value };
    }));
  };

  // Operations handlers
  const addOperation = () => {
    setOperations(prev => [...prev, { id: `O-${Date.now()}`, name: '', workCenter: '', duration: 1 }]);
  };

  const removeOperation = (oid) => {
    setOperations(prev => prev.filter(o => o.id !== oid));
  };

  const updateOperation = (oid, field, value) => {
    setOperations(prev => prev.map(o => o.id !== oid ? o : { ...o, [field]: value }));
  };

  const handleFinishedProductChange = (e) => {
    const pid = e.target.value;
    const prod = allProducts.find(p => p.id === pid);
    setForm(prev => ({
      ...prev,
      finishedProductId: pid,
      finishedProductName: prod ? prod.name : '',
      name: prod ? `${prod.name} BoM` : prev.name,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.finishedProductId) {
      toast('Please select a finished product', 'error');
      return;
    }
    if (components.some(c => !c.componentId)) {
      toast('All components must have a product selected', 'error');
      return;
    }
    if (operations.some(o => !o.name.trim())) {
      toast('All operations must have a name', 'error');
      return;
    }

    const bomId = isEdit ? id : nextRef('BOM').replace('-', '');

    const bomRecord = {
      id: bomId,
      name: form.name || `${form.finishedProductName} BoM`,
      finishedProductId: form.finishedProductId,
      finishedProductName: form.finishedProductName,
      components,
      operations,
    };

    upsert(STORES.BOM, bomRecord);

    addAuditLog({
      user: user?.name,
      role: user?.role,
      module: 'BoM',
      action: isEdit ? 'Modified' : 'Created',
      reference: bomId,
      newValue: bomRecord,
    });

    toast(`BoM ${isEdit ? 'updated' : 'created'} successfully`, 'success');
    navigate('/bom');
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to="/bom" className="btn-ghost btn-icon text-text-secondary hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">{isEdit ? 'Edit BoM' : 'Create Bill of Materials'}</h1>
            <p className="page-subtitle">Define component materials and work center operations for manufacturing.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
        {/* Header Info */}
        <div className="card bg-bg-surface">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">General Info</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="form-group">
              <label className="label">Finished Product *</label>
              <select className="select" value={form.finishedProductId} onChange={handleFinishedProductChange} required>
                <option value="">Select product to manufacture</option>
                {allProducts.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label">BoM Name</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Teak Wood Chair BoM"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Components Section */}
        <div className="card bg-bg-surface">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Components / Raw Materials</h2>
            <button type="button" onClick={addComponent} className="btn-secondary btn-sm flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add Component
            </button>
          </div>

          <div className="space-y-3">
            {components.map((comp, idx) => (
              <div key={comp.id} className="flex items-start gap-3 p-3 rounded-card bg-bg-light/30 border border-border">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="label">Component {idx + 1} *</label>
                    <select
                      className="select"
                      value={comp.componentId}
                      onChange={e => updateComponent(comp.id, 'componentId', e.target.value)}
                      required
                    >
                      <option value="">Select material...</option>
                      {allProducts.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="label">Quantity Required *</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="input"
                      placeholder="1"
                      value={comp.qty}
                      onChange={e => updateComponent(comp.id, 'qty', parseFloat(e.target.value) || 1)}
                      required
                    />
                  </div>
                </div>
                {components.length > 1 && (
                  <button type="button" onClick={() => removeComponent(comp.id)} className="btn-danger btn-icon mt-5 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Operations Section */}
        <div className="card bg-bg-surface">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Work Center Operations</h2>
            <button type="button" onClick={addOperation} className="btn-secondary btn-sm flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Add Operation
            </button>
          </div>

          <div className="space-y-3">
            {operations.map((op, idx) => (
              <div key={op.id} className="flex items-start gap-3 p-3 rounded-card bg-bg-light/30 border border-border">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="form-group">
                    <label className="label">Operation Name *</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Cutting"
                      value={op.name}
                      onChange={e => updateOperation(op.id, 'name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Work Center</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Wood Shop"
                      value={op.workCenter}
                      onChange={e => updateOperation(op.id, 'workCenter', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Duration (hrs)</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      className="input"
                      placeholder="1"
                      value={op.duration}
                      onChange={e => updateOperation(op.id, 'duration', parseFloat(e.target.value) || 1)}
                    />
                  </div>
                </div>
                {operations.length > 1 && (
                  <button type="button" onClick={() => removeOperation(op.id)} className="btn-danger btn-icon mt-5 shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link to="/bom" className="btn-secondary flex items-center gap-1.5">
            <X className="w-4 h-4" />
            Cancel
          </Link>
          <button type="submit" className="btn-primary flex items-center gap-1.5">
            <Save className="w-4 h-4" />
            {isEdit ? 'Save Changes' : 'Create BoM'}
          </button>
        </div>
      </form>
    </PageWrapper>
  );
}
