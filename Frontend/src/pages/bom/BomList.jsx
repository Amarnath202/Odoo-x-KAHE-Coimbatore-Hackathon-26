import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Layers, Package, Trash2 } from 'lucide-react';
import { PageWrapper, EmptyState, Pagination } from '../../components/UI';
import { bomsApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

export default function BomList() {
  const toast = useToast();
  const { user } = useAuth();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [boms, setBoms] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchBoms = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (user?.companyId) params.companyId = user.companyId;
      if (search.trim()) params.search = search.trim();
      const res = await bomsApi.list(params);
      setBoms(res?.data?.items ?? res?.data ?? []);
    } catch { setBoms([]); } finally { setLoading(false); }
  }, [search, user?.companyId]);

  useEffect(() => { const t = setTimeout(fetchBoms, 300); return () => clearTimeout(t); }, [fetchBoms]);
  useEffect(() => { setCurrentPage(1); }, [search]);

  const totalPages = Math.ceil(boms.length / itemsPerPage);
  const paginatedBoms = boms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({ message: 'Are you sure you want to delete this BoM?' });
    if (!isConfirmed) return;
    try {
      await bomsApi.delete(id);
      toast('BoM deleted successfully', 'success');
      fetchBoms();
    } catch (err) {
      toast(err.message || 'Failed to delete BoM', 'error');
    }
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bill of Materials</h1>
        </div>
        <div className="flex items-center">
          <Link to="/bom/create" className="btn-primary">
            <Plus className="w-4 h-4" />Create BoM
          </Link>
        </div>
      </div>

      <div className="search-bar w-full md:max-w-md mb-6">
        <Search className="search-icon text-text-muted" />
        <input type="text" className="input pl-10" placeholder="Search BoMs…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr className="bg-bg-surface/50 border-b border-border">
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">BoM Name</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Finished Product</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-text-secondary font-semibold">Components</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-text-secondary font-semibold">Operations</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-text-secondary font-semibold">Version</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-text-secondary font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-4 bg-bg-light animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : boms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-0">
                    <EmptyState icon={Layers} title="No Bill of Materials found"
                      description={search ? 'Try a different search' : 'Create your first BoM to start manufacturing'}
                      action={!search && <Link to="/bom/create" className="btn-primary btn-sm mt-2"><Plus className="w-3.5 h-3.5" />Create BoM</Link>}
                    />
                  </td>
                </tr>
              ) : (
                paginatedBoms.map((bom) => (
                  <tr key={bom.id} className="border-b border-border hover:bg-black/[0.01] cursor-pointer"
                    onClick={() => navigate(`/bom/${bom.id}`)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <p className="text-sm font-semibold text-text-primary">{bom.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-text-primary">{bom.product?.name ?? '—'}</p>
                      <p className="text-xs text-text-muted font-mono">{bom.product?.sku ?? ''}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-text-primary">
                        <Package className="w-3.5 h-3.5 text-text-muted" />
                        {bom.components?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-text-secondary">
                      {bom.operations?.length ?? 0}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-mono text-text-muted">{bom.version ?? 'v1.0'}</span>
                    </td>
                    <td className="px-6 py-4 text-center" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <Link to={`/bom/${bom.id}`} className="p-1 text-text-secondary hover:text-primary transition-colors tooltip">
                          <Eye className="w-4 h-4" />
                          <span className="tooltip-content">View</span>
                        </Link>
                        <Link to={`/bom/${bom.id}/edit`} className="p-1 text-text-secondary hover:text-accent transition-colors tooltip">
                          <Edit className="w-4 h-4" />
                          <span className="tooltip-content">Edit</span>
                        </Link>
                        {(user?.role === 'ADMIN' || user?.role === 'BUSINESS_OWNER') && (
                          <button onClick={() => handleDelete(bom.id)} className="p-1 text-text-secondary hover:text-danger transition-colors tooltip">
                            <Trash2 className="w-4 h-4" />
                            <span className="tooltip-content">Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>
    </PageWrapper>
  );
}
