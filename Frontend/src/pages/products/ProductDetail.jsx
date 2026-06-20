import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, DollarSign, Settings, Layers, Package, History } from 'lucide-react';
import PageWrapper from '../../components/UI';
import { formatINR, formatDateTime } from '../../components/UI';
import { productsApi, stockLedgerApi } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [product, setProduct] = useState(null);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [prodRes, ledgerRes] = await Promise.all([
          productsApi.getById(id),
          stockLedgerApi.list({ productId: id, limit: 20 }).catch(() => null),
        ]);
        const prod = prodRes?.data ?? prodRes;
        if (!prod) {
          toast('Product not found', 'error');
          navigate('/products');
          return;
        }
        setProduct(prod);
        const items = ledgerRes?.data?.items ?? ledgerRes?.data ?? [];
        setMovements(items);
      } catch {
        toast('Failed to load product', 'error');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate, toast]);

  if (loading) return (
    <PageWrapper>
      <div className="flex items-center justify-center py-20">
        <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </PageWrapper>
  );

  if (!product) return null;

  // Aggregate stock from inventory array if present
  const inventories = product.inventories ?? [];
  const totalOnHand = inventories.reduce((s, i) => s + (i.onHandQty ?? 0), 0);
  const totalReserved = inventories.reduce((s, i) => s + (i.reservedQty ?? 0), 0);
  const totalFree = inventories.reduce((s, i) => s + (i.freeToUseQty ?? 0), 0);

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
            <p className="page-subtitle">SKU: <span className="font-mono text-accent font-semibold">{product.sku}</span></p>
          </div>
        </div>
        <Link to={`/products/${product.id}/edit`} className="btn-primary btn-sm flex items-center gap-1.5">
          <Edit className="w-4 h-4" />
          Edit Product
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="card bg-bg-surface">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              General Specifications
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <p className="text-xs text-text-muted mb-0.5">Procurement Type</p>
                <p className="text-sm font-semibold text-text-primary">{product.procurementType ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-0.5">Category</p>
                <p className="text-sm font-semibold text-text-primary">{product.category?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-0.5">Unit of Measure</p>
                <p className="text-sm font-semibold text-text-primary">{product.unit?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-0.5">Procure on Demand</p>
                <p className="text-sm font-semibold text-text-primary">{product.procureOnDemand ? 'Yes (MTO)' : 'No (MTS)'}</p>
              </div>
              {product.vendor && (
                <div className="md:col-span-2 border-t border-border pt-4">
                  <p className="text-xs text-text-muted mb-0.5">Preferred Vendor</p>
                  <p className="text-sm font-semibold text-text-primary">{product.vendor?.name ?? '—'}</p>
                </div>
              )}
              {product.bom && (
                <div className="md:col-span-2 border-t border-border pt-4">
                  <p className="text-xs text-text-muted mb-0.5">Bill of Materials</p>
                  <Link to={`/bom/${product.bom.id}`} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    {product.bom.name}
                  </Link>
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
                    <th className="px-4 py-2.5 text-right text-xs text-text-secondary uppercase">Balance After</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-text-muted text-sm bg-white">
                        No stock ledger entries recorded yet.
                      </td>
                    </tr>
                  ) : (
                    movements.map(m => (
                      <tr key={m.id} className="border-b border-border hover:bg-black/[0.01]">
                        <td className="px-4 py-3 text-xs text-text-muted">{formatDateTime(m.createdAt ?? m.date)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            m.movementType === 'IN' ? 'bg-green-100 text-green-700' :
                            m.movementType === 'OUT' ? 'bg-red-100 text-red-700' :
                            m.movementType === 'RESERVE' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {m.movementType ?? m.type}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right text-sm font-medium ${m.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-accent">{m.reference ?? '—'}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">{m.balanceAfter ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
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
                <span className="text-xl font-bold text-text-primary">{totalOnHand}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm text-text-secondary">Reserved Stock</span>
                <span className="text-xl font-bold text-orange-600">{totalReserved}</span>
              </div>
              <div className="flex items-center justify-between pb-1">
                <span className="text-sm text-text-secondary font-semibold">Free to Use</span>
                <span className="text-xl font-bold text-green-600">{totalFree}</span>
              </div>
            </div>
          </div>

          {/* Pricing Card */}
          <div className="card bg-bg-surface">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Financial Information
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm text-text-secondary">Sales Price</span>
                <span className="text-lg font-bold text-text-primary">{formatINR(product.salesPrice ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm text-text-secondary">Cost Price</span>
                <span className="text-lg font-semibold text-text-secondary">{formatINR(product.costPrice ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary font-semibold">Projected Margin</span>
                <span className="text-lg font-bold text-green-600">
                  {formatINR((product.salesPrice ?? 0) - (product.costPrice ?? 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
