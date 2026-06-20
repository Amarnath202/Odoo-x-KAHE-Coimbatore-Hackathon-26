import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, Edit, SlidersHorizontal, Tag, Trash2, Download } from 'lucide-react';
import PageWrapper from '../../components/UI';
import { formatINR } from '../../components/UI';
import { productsApi } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function Products() {
  const { user } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [strategyFilter, setStrategyFilter] = useState('All');
  const [exporting, setExporting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (strategyFilter !== 'All') params.procurementType = strategyFilter;
      const res = await productsApi.list(params);
      const items = res?.data?.items ?? res?.data ?? res?.items ?? [];
      setProducts(items);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, strategyFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsApi.delete(id);
      toast('Product deleted successfully', 'success');
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast(err.message || 'Failed to delete product', 'error');
    }
  };

  return (
    <PageWrapper>
      <div className="page-header flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage inventory items, pricing, and procurement strategies.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {(user?.role === 'ADMIN' || user?.role === 'BUSINESS_OWNER') && (
            <button 
              onClick={async () => {
                try {
                  setExporting(true);
                  await productsApi.export();
                  toast('Export downloaded successfully', 'success');
                } catch (err) {
                  toast('Export failed', 'error');
                } finally {
                  setExporting(false);
                }
              }}
              disabled={exporting}
              className="btn-secondary whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export Excel'}
            </button>
          )}
          <Link to="/products/create" className="btn-primary btn-sm flex items-center gap-1.5 whitespace-nowrap">
            <Plus className="w-4 h-4" />
            Create Product
          </Link>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-center justify-between">
        <div className="search-bar w-full md:max-w-md">
          <Search className="search-icon text-text-muted" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <SlidersHorizontal className="w-4 h-4 text-text-muted shrink-0" />
          <select
            className="select min-w-[150px] py-2"
            value={strategyFilter}
            onChange={e => setStrategyFilter(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="PURCHASE">Purchase</option>
            <option value="MANUFACTURING">Manufacturing</option>
          </select>
        </div>
      </div>

      {/* Product Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr className="bg-bg-surface/50 border-b border-border">
                <th className="px-6 py-4 text-left font-semibold text-text-secondary text-xs uppercase tracking-wider">Product Info</th>
                <th className="px-6 py-4 text-left font-semibold text-text-secondary text-xs uppercase tracking-wider">SKU</th>
                <th className="px-6 py-4 text-right font-semibold text-text-secondary text-xs uppercase tracking-wider">Sales Price</th>
                <th className="px-6 py-4 text-right font-semibold text-text-secondary text-xs uppercase tracking-wider">Cost Price</th>
                <th className="px-6 py-4 text-center font-semibold text-text-secondary text-xs uppercase tracking-wider">Procurement</th>
                <th className="px-6 py-4 text-center font-semibold text-text-secondary text-xs uppercase tracking-wider">Actions</th>
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
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-muted text-sm bg-white">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map(p => (
                  <tr key={p.id} className="border-b border-border hover:bg-black/[0.01]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{p.name}</p>
                          <p className="text-xs text-text-muted">{p.category?.name ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-text-secondary">{p.sku}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-text-primary">
                      {formatINR(p.salesPrice ?? 0)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-text-secondary">
                      {formatINR(p.costPrice ?? 0)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        p.procurementType === 'MANUFACTURING' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {p.procurementType ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/products/${p.id}`}
                          className="p-1 text-text-secondary hover:text-primary transition-colors tooltip"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="tooltip-content">View Details</span>
                        </Link>
                        <Link
                          to={`/products/${p.id}/edit`}
                          className="p-1 text-text-secondary hover:text-accent transition-colors tooltip"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="tooltip-content">Edit</span>
                        </Link>
                        {(user?.role === 'ADMIN' || user?.role === 'BUSINESS_OWNER') && (
                          <button onClick={() => handleDelete(p.id)} className="p-1 text-text-secondary hover:text-danger transition-colors tooltip">
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
      </div>
    </PageWrapper>
  );
}
