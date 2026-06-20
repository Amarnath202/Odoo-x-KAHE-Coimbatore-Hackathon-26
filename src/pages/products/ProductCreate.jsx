import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import PageWrapper from '../../components/UI';
import { getStore, STORES, getOne, upsert, nextRef, addLedgerEntry, addAuditLog } from '../../utils/storage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function ProductCreate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    salesPrice: '',
    costPrice: '',
    initialStock: '0',
    procurementStrategy: 'MTS',
    procurementType: 'Manufacturing',
    vendor: '',
    bomId: '',
  });

  const [boms, setBoms] = useState([]);

  useEffect(() => {
    // Load BoMs for selection
    const allBoms = getStore(STORES.BOM);
    setBoms(allBoms);

    if (isEdit) {
      const product = getOne(STORES.PRODUCTS, id);
      if (product) {
        setFormData({
          name: product.name || '',
          salesPrice: product.salesPrice || '',
          costPrice: product.costPrice || '',
          initialStock: product.onHand || '0',
          procurementStrategy: product.procurementStrategy || 'MTS',
          procurementType: product.procurementType || 'Manufacturing',
          vendor: product.vendor || '',
          bomId: product.bomId || '',
        });
      } else {
        toast('Product not found', 'error');
        navigate('/products');
      }
    }
  }, [id, isEdit, navigate, toast]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast('Product Name is required', 'error');
      return;
    }

    const sPrice = parseFloat(formData.salesPrice);
    const cPrice = parseFloat(formData.costPrice);
    if (isNaN(sPrice) || sPrice < 0) {
      toast('Sales Price must be a positive number', 'error');
      return;
    }
    if (isNaN(cPrice) || cPrice < 0) {
      toast('Cost Price must be a positive number', 'error');
      return;
    }

    if (isEdit) {
      const oldProduct = getOne(STORES.PRODUCTS, id);
      const updatedProduct = {
        ...oldProduct,
        name: formData.name,
        salesPrice: sPrice,
        costPrice: cPrice,
        procurementStrategy: formData.procurementStrategy,
        procurementType: formData.procurementType,
        vendor: formData.procurementType === 'Purchase' ? formData.vendor : '',
        bomId: formData.procurementType === 'Manufacturing' ? formData.bomId : '',
      };
      upsert(STORES.PRODUCTS, updatedProduct);

      addAuditLog({
        user: user?.name,
        role: user?.role,
        module: 'Products',
        action: 'Modified',
        reference: id,
        oldValue: oldProduct,
        newValue: updatedProduct,
      });

      toast('Product updated successfully', 'success');
    } else {
      // Generate ID
      const newRef = nextRef('P');
      const newId = newRef.replace('-', ''); // Convert P-007 to P007 style
      const stockVal = parseFloat(formData.initialStock) || 0;

      const newProduct = {
        id: newId,
        name: formData.name,
        salesPrice: sPrice,
        costPrice: cPrice,
        onHand: stockVal,
        reserved: 0,
        procurementStrategy: formData.procurementStrategy,
        procurementType: formData.procurementType,
        vendor: formData.procurementType === 'Purchase' ? formData.vendor : '',
        bomId: formData.procurementType === 'Manufacturing' ? formData.bomId : '',
      };
      upsert(STORES.PRODUCTS, newProduct);

      if (stockVal > 0) {
        addLedgerEntry({
          productId: newId,
          productName: formData.name,
          type: 'IN',
          qty: stockVal,
          reference: 'Initial Stock',
          note: 'Initial stock on product creation',
        });
      }

      addAuditLog({
        user: user?.name,
        role: user?.role,
        module: 'Products',
        action: 'Created',
        reference: newId,
        newValue: newProduct,
      });

      toast('Product created successfully', 'success');
    }

    navigate('/products');
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to="/products" className="btn-ghost btn-icon text-text-secondary hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">{isEdit ? 'Edit Product' : 'Create Product'}</h1>
            <p className="page-subtitle">{isEdit ? `Edit details for ${formData.name}` : 'Add a new product to your inventory system'}</p>
          </div>
        </div>
      </div>

      <div className="card max-w-3xl mx-auto bg-bg-surface">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Product Name */}
            <div className="form-group md:col-span-2">
              <label className="label">Product Name *</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Luxury Leather Sofa"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Sales Price */}
            <div className="form-group">
              <label className="label">Sales Price (INR) *</label>
              <input
                type="number"
                step="0.01"
                className="input"
                placeholder="e.g. 15000"
                value={formData.salesPrice}
                onChange={e => setFormData({ ...formData, salesPrice: e.target.value })}
                required
              />
            </div>

            {/* Cost Price */}
            <div className="form-group">
              <label className="label">Cost Price (INR) *</label>
              <input
                type="number"
                step="0.01"
                className="input"
                placeholder="e.g. 9500"
                value={formData.costPrice}
                onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
                required
              />
            </div>

            {/* Initial Stock Quantity */}
            <div className="form-group">
              <label className="label">Initial Stock Quantity</label>
              <input
                type="number"
                className="input"
                placeholder="e.g. 10"
                value={formData.initialStock}
                onChange={e => setFormData({ ...formData, initialStock: e.target.value })}
                disabled={isEdit}
              />
              {isEdit && <p className="text-[10px] text-text-muted mt-1">Stock quantity adjustments should be made in Warehouse Operations.</p>}
            </div>

            {/* Procurement Strategy */}
            <div className="form-group">
              <label className="label">Procurement Strategy</label>
              <select
                className="select"
                value={formData.procurementStrategy}
                onChange={e => setFormData({ ...formData, procurementStrategy: e.target.value })}
              >
                <option value="MTS">MTS (Make to Stock)</option>
                <option value="MTO">MTO (Make to Order)</option>
              </select>
            </div>

            {/* Procurement Type */}
            <div className="form-group">
              <label className="label">Procurement Type</label>
              <select
                className="select"
                value={formData.procurementType}
                onChange={e => setFormData({ ...formData, procurementType: e.target.value })}
              >
                <option value="Manufacturing">Manufacturing</option>
                <option value="Purchase">Purchase</option>
              </select>
            </div>

            {/* Vendor Name - Conditional */}
            {formData.procurementType === 'Purchase' && (
              <div className="form-group">
                <label className="label">Vendor *</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Rajasthan Timber Co."
                  value={formData.vendor}
                  onChange={e => setFormData({ ...formData, vendor: e.target.value })}
                  required
                />
              </div>
            )}

            {/* Bill of Materials - Conditional */}
            {formData.procurementType === 'Manufacturing' && (
              <div className="form-group">
                <label className="label">Bill of Materials</label>
                <select
                  className="select"
                  value={formData.bomId}
                  onChange={e => setFormData({ ...formData, bomId: e.target.value })}
                >
                  <option value="">No associated BoM (or select one)</option>
                  {boms.map(bom => (
                    <option key={bom.id} value={bom.id}>{bom.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="divider" />
          <div className="flex items-center justify-end gap-3">
            <Link to="/products" className="btn-secondary flex items-center gap-1.5">
              <X className="w-4 h-4" />
              Cancel
            </Link>
            <button type="submit" className="btn-primary flex items-center gap-1.5">
              <Save className="w-4 h-4" />
              {isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
}
