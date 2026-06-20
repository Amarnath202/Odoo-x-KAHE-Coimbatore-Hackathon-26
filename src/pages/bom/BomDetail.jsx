import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Package, Layers, Wrench, Clock } from 'lucide-react';
import { PageWrapper, formatINR } from '../../components/UI';
import { getOne, STORES, getStore } from '../../utils/storage';
import { useToast } from '../../context/ToastContext';

export default function BomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bom, setBom] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const b = getOne(STORES.BOM, id);
    if (!b) {
      toast('BoM not found', 'error');
      navigate('/bom');
      return;
    }
    setBom(b);
    setProducts(getStore(STORES.PRODUCTS));
  }, [id, navigate, toast]);

  const getProduct = (pid) => products.find(p => p.id === pid) || null;

  if (!bom) return null;

  const finishedProduct = getProduct(bom.finishedProductId);
  const totalDuration = bom.operations?.reduce((sum, op) => sum + (parseFloat(op.duration) || 0), 0) || 0;

  return (
    <PageWrapper>
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to="/bom" className="btn-ghost btn-icon text-text-secondary hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">{bom.name}</h1>
            <p className="page-subtitle">
              BoM Reference: <span className="font-mono text-accent font-semibold">{bom.id}</span>
            </p>
          </div>
        </div>
        <Link to={`/bom/${bom.id}/edit`} className="btn-primary btn-sm flex items-center gap-1.5">
          <Edit className="w-4 h-4" />
          Edit BoM
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Components Table */}
          <div className="card bg-bg-surface">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              Component Materials ({bom.components?.length ?? 0})
            </h2>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2.5 text-left text-xs text-text-secondary uppercase">#</th>
                    <th className="px-4 py-2.5 text-left text-xs text-text-secondary uppercase">Material / Component</th>
                    <th className="px-4 py-2.5 text-center text-xs text-text-secondary uppercase">Qty Required</th>
                    <th className="px-4 py-2.5 text-right text-xs text-text-secondary uppercase">Cost/Unit</th>
                    <th className="px-4 py-2.5 text-right text-xs text-text-secondary uppercase">Line Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {(bom.components || []).map((comp, idx) => {
                    const prod = getProduct(comp.componentId);
                    const lineCost = prod ? prod.costPrice * comp.qty : 0;
                    return (
                      <tr key={comp.id} className="border-b border-border hover:bg-black/[0.01]">
                        <td className="px-4 py-3 text-sm text-text-muted">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-text-primary">{comp.componentName}</p>
                          <p className="text-xs text-text-muted">{comp.componentId}</p>
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-text-primary">
                          {comp.qty}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-text-secondary">
                          {prod ? formatINR(prod.costPrice) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">
                          {prod ? formatINR(lineCost) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                  {(bom.components || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-text-muted text-sm bg-white">
                        No components defined.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operations Table */}
          <div className="card bg-bg-surface">
            <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              Work Center Operations ({bom.operations?.length ?? 0})
            </h2>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2.5 text-left text-xs text-text-secondary uppercase">Step</th>
                    <th className="px-4 py-2.5 text-left text-xs text-text-secondary uppercase">Operation Name</th>
                    <th className="px-4 py-2.5 text-left text-xs text-text-secondary uppercase">Work Center</th>
                    <th className="px-4 py-2.5 text-right text-xs text-text-secondary uppercase">Duration (hrs)</th>
                  </tr>
                </thead>
                <tbody>
                  {(bom.operations || []).map((op, idx) => (
                    <tr key={op.id} className="border-b border-border hover:bg-black/[0.01]">
                      <td className="px-4 py-3 text-sm text-text-muted">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-text-primary">{op.name}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{op.workCenter || '—'}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-text-primary">{op.duration}h</td>
                    </tr>
                  ))}
                  {(bom.operations || []).length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-text-muted text-sm bg-white">
                        No operations defined.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Summary */}
        <div className="space-y-6">
          {/* Finished Product Card */}
          {finishedProduct && (
            <div className="card bg-bg-surface border-l-4 border-primary">
              <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Finished Product
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-text-muted">Product Name</p>
                  <p className="text-sm font-semibold text-text-primary">{finishedProduct.name}</p>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs text-text-muted">Sales Price</span>
                  <span className="text-sm font-bold text-text-primary">{formatINR(finishedProduct.salesPrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">On Hand Stock</span>
                  <span className="text-sm font-semibold text-green-600">{finishedProduct.onHand ?? 0}</span>
                </div>
                <Link to={`/products/${finishedProduct.id}`} className="btn-secondary w-full text-center text-sm mt-2 flex justify-center">
                  View Product →
                </Link>
              </div>
            </div>
          )}

          {/* Cost Summary */}
          <div className="card bg-bg-surface">
            <h2 className="text-base font-semibold text-text-primary mb-4">Cost Summary</h2>
            <div className="space-y-3">
              {(bom.components || []).map(comp => {
                const prod = getProduct(comp.componentId);
                return (
                  <div key={comp.id} className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary truncate">{comp.componentName}</span>
                    <span className="text-text-primary font-medium shrink-0">
                      {prod ? formatINR(prod.costPrice * comp.qty) : '—'}
                    </span>
                  </div>
                );
              })}
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary">Total Material Cost</span>
                <span className="text-base font-bold text-primary">
                  {formatINR(
                    (bom.components || []).reduce((sum, comp) => {
                      const prod = getProduct(comp.componentId);
                      return sum + (prod ? prod.costPrice * comp.qty : 0);
                    }, 0)
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Operations Summary */}
          <div className="card bg-bg-surface">
            <h2 className="text-base font-semibold text-text-primary mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              Production Time
            </h2>
            <div className="text-center py-2">
              <p className="text-4xl font-bold text-accent">{totalDuration.toFixed(1)}</p>
              <p className="text-sm text-text-muted mt-1">Total Hours</p>
            </div>
            <div className="mt-4 space-y-2">
              {(bom.operations || []).map(op => (
                <div key={op.id} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{op.name}</span>
                  <span className="text-text-primary font-medium">{op.duration}h</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
