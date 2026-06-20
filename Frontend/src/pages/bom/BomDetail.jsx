import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Layers, Package, Clock } from 'lucide-react';
import { PageWrapper } from '../../components/UI';
import { bomsApi } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function BomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [bom, setBom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bomsApi.getById(id)
      .then(res => setBom(res?.data ?? res))
      .catch(() => { toast('BoM not found', 'error'); navigate('/bom'); })
      .finally(() => setLoading(false));
  }, [id, navigate, toast]);

  if (loading) return (
    <PageWrapper><div className="flex items-center justify-center py-20">
      <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div></PageWrapper>
  );
  if (!bom) return null;

  const components = bom.components ?? [];
  const operations = bom.operations ?? [];
  const totalDuration = operations.reduce((s, o) => s + (o.durationMinutes ?? 0), 0);

  return (
    <PageWrapper>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to="/bom" className="btn-ghost btn-icon text-text-secondary hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">{bom.name}</h1>
            <p className="page-subtitle">
              Finished product: <span className="font-semibold text-text-primary">{bom.product?.name ?? '—'}</span>
              &nbsp;·&nbsp;Version: <span className="font-mono text-accent">{bom.version ?? 'v1.0'}</span>
            </p>
          </div>
        </div>
        <Link to={`/bom/${id}/edit`} className="btn-primary btn-sm flex items-center gap-1.5">
          <Edit className="w-4 h-4" />Edit BoM
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Components */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />Components ({components.length})
            </h2>
            {components.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">No components defined.</p>
            ) : (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th><th>Component</th><th className="text-center">Qty</th><th>Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {components.map((c, i) => (
                      <tr key={c.id ?? i}>
                        <td className="text-text-muted text-xs">{i + 1}</td>
                        <td>
                          <p className="font-medium text-text-primary">{c.product?.name ?? c.component?.name ?? '—'}</p>
                          <p className="text-xs text-text-muted font-mono">{c.product?.sku ?? c.component?.sku ?? ''}</p>
                        </td>
                        <td className="text-center font-semibold">{c.quantity}</td>
                        <td className="text-text-muted text-sm">{c.unit?.name ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Operations */}
          <div className="card">
            <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent" />Operations ({operations.length})
              {totalDuration > 0 && (
                <span className="ml-auto text-xs text-text-muted font-normal flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />Total: {totalDuration} min
                </span>
              )}
            </h2>
            {operations.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-4">No operations defined.</p>
            ) : (
              <div className="space-y-2">
                {[...operations].sort((a, b) => a.sequence - b.sequence).map((op, i) => (
                  <div key={op.id ?? i} className="flex items-center gap-4 p-3 rounded-btn bg-bg-light border border-border">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {op.sequence ?? i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{op.operation?.name ?? op.name ?? '—'}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-text-muted shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      {op.durationMinutes ?? '—'} min
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card border-l-4 border-primary">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Finished Product</span>
                <span className="font-medium text-text-primary">{bom.product?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">SKU</span>
                <span className="font-mono text-accent text-xs">{bom.product?.sku ?? '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Version</span>
                <span className="font-mono">{bom.version ?? '1.0'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Components</span>
                <span className="font-semibold text-text-primary">{components.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Operations</span>
                <span className="font-semibold text-text-primary">{operations.length}</span>
              </div>
              {totalDuration > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Total Duration</span>
                  <span className="font-semibold text-text-primary">{totalDuration} min</span>
                </div>
              )}
            </div>
          </div>
          <Link to="/manufacturing/create" className="card block hover:border-primary transition-colors cursor-pointer">
            <p className="text-sm font-semibold text-text-primary mb-1">Use This BoM</p>
            <p className="text-xs text-text-muted">Create a Manufacturing Order using this Bill of Materials.</p>
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
