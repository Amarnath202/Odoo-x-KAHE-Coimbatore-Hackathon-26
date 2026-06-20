import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Calendar, DollarSign, Settings, Layers, Package, History } from 'lucide-react';
import PageWrapper from '../../components/UI';
import { getStore, STORES, getOne, getProductStock } from '../../utils/storage';
import { formatINR, formatDateTime } from '../../components/UI';
import { useToast } from '../../context/ToastContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState(null);
  const [stock, setStock] = useState({ onHand: 0, reserved: 0, freeToUse: 0 });
  const [movements, setMovements] = useState([]);
  const [associatedBom, setAssociatedBom] = useState(null);

  useEffect(() => {
    const prod = getOne(STORES.PRODUCTS, id);
    if (!prod) {
      toast('Product not found', 'error');
      navigate('/products');
      return;
    }
    setProduct(prod);

    const st = getProductStock(id);
    setStock(st);

    const ledger = getStore(STORES.STOCK_LEDGER);
    const prodMovements = ledger
      .filter(m => m.productId === id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    setMovements(prodMovements);

    if (prod.bomId) {
      const bom = getOne(STORES.BOM, prod.bomId);
      setAssociatedBom(bom);
    }
  }, [id, navigate, toast]);

  if (!product) return null;

  return (
    <PageWrapper>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to="/products" className="btn-ghost btn-icon text-text-secondary hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">{product.name}</h1>
            <p className="page-subtitle">Product Reference: <span className="font-mono text-accent font-semibold">{product.id}</span></p>
          </div>
        </div>
        <Link to={`/products/${product.id}/edit`} className="btn-primary btn-sm flex items-center gap-1.5">
          <Edit className="w-4 h-4" />
          Edit Product
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Details & Stock Ledger */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="card bg-bg-surface">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              General Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <p className="text-xs text-text-muted mb-0.5">Procurement Strategy</p>
                <p className="text-sm font-semibold text-text-primary">
                  {product.procurementStrategy === 'MTO' ? 'Make to Order (MTO)' : 'Make to Stock (MTS)'}
                </p>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  {product.procurementStrategy === 'MTO' 
                    ? 'Procured only when a Sales Order is placed' 
                    : 'Kept in inventory based on forecast/min limits'}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-0.5">Procurement Type</p>
                <p className="text-sm font-semibold text-text-primary">{product.procurementType}</p>
              </div>

              {product.procurementType === 'Purchase' && (
                <div className="md:col-span-2 border-t border-border pt-4">
                  <p className="text-xs text-text-muted mb-0.5">Preferred Vendor</p>
                  <p className="text-sm font-semibold text-text-primary">{product.vendor || 'No vendor assigned'}</p>
                </div>
              )}

              {product.procurementType === 'Manufacturing' && (
                <div className="md:col-span-2 border-t border-border pt-4">
                  <p className="text-xs text-text-muted mb-0.5">Bill of Materials (BoM)</p>
                  {associatedBom ? (
                    <Link to={`/bom/${associatedBom.id}`} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      {associatedBom.name}
                    </Link>
                  ) : (
                    <p className="text-sm text-text-secondary">No BoM linked. Select or create one under the Bill of Materials module.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stock Movement History */}
          <div className="card bg-bg-surface">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              Stock Movement History
            </h2>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2.5 text-left text-xs text-text-secondary uppercase">Date/Time</th>
                    <th className="px-4 py-2.5 text-center text-xs text-text-secondary uppercase">Type</th>
                    <th className="px-4 py-2.5 text-right text-xs text-text-secondary uppercase">Quantity</th>
                    <th className="px-4 py-2.5 text-left text-xs text-text-secondary uppercase">Reference</th>
                    <th className="px-4 py-2.5 text-left text-xs text-text-secondary uppercase">Note</th>
                    <th className="px-4 py-2.5 text-right text-xs text-text-secondary uppercase">New Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-text-muted text-sm bg-white">
                        No stock ledger entries recorded yet.
                      </td>
                    </tr>
                  ) : (
                    movements.map(m => (
                      <tr key={m.id} className="border-b border-border hover:bg-black/[0.01]">
                        <td className="px-4 py-3 text-xs text-text-muted">{formatDateTime(m.date)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            m.type === 'IN' ? 'bg-green-100 text-green-700' :
                            m.type === 'OUT' ? 'bg-red-100 text-red-700' :
                            m.type === 'RESERVE' ? 'bg-yellow-100 text-yellow-700' :
                            m.type === 'UNRESERVE' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {m.type}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-medium ${m.qty > 0 ? 'text-green-600' : m.qty < 0 ? 'text-red-500' : 'text-text-secondary'}`}>
                          {m.qty > 0 ? `+${m.qty}` : m.qty}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-accent">{m.reference}</td>
                        <td className="px-4 py-3 text-xs text-text-secondary">{m.note || '—'}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">{m.balanceAfter ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Stats & Financials */}
        <div className="space-y-6">
          {/* Stock Level Card */}
          <div className="card bg-bg-surface border-l-4 border-primary">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Stock Summary
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm text-text-secondary">On Hand Stock</span>
                <span className="text-xl font-bold text-text-primary">{stock.onHand}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm text-text-secondary">Reserved Stock</span>
                <span className="text-xl font-bold text-orange-600">{stock.reserved}</span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="text-sm text-text-secondary font-semibold">Free to Use</span>
                <span className="text-xl font-bold text-green-600">{stock.freeToUse}</span>
              </div>
              <p className="text-[10px] text-text-muted text-center pt-2">
                Free to use = On Hand Stock − Reserved Stock
              </p>
            </div>
          </div>

          {/* Pricing Info Card */}
          <div className="card bg-bg-surface">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Financial Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm text-text-secondary">Sales Price</span>
                <span className="text-lg font-bold text-text-primary">{formatINR(product.salesPrice)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm text-text-secondary">Cost Price</span>
                <span className="text-lg font-semibold text-text-secondary">{formatINR(product.costPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary font-semibold">Projected Margin</span>
                <span className="text-lg font-bold text-green-600">
                  {formatINR(product.salesPrice - product.costPrice)} ({((product.salesPrice - product.costPrice) / (product.salesPrice || 1) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
