import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, Edit, SlidersHorizontal, Tag, Trash2, Download, LayoutGrid, List } from 'lucide-react';
import PageWrapper from '../../components/UI';
import { formatINR } from '../../components/UI';
import { productsApi } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

// Category illustrations helper
const getProductIcon = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('table')) return { icon: LayoutGrid, color: 'from-amber-500/20 to-orange-500/5 text-amber-600' };
  if (lower.includes('chair') || lower.includes('stool')) return { icon: Tag, color: 'from-blue-500/20 to-indigo-500/5 text-blue-600' };
  if (lower.includes('screw') || lower.includes('bolt') || lower.includes('nail')) return { icon: Tag, color: 'from-slate-500/20 to-zinc-500/5 text-slate-600' };
  if (lower.includes('leg') || lower.includes('top') || lower.includes('wood') || lower.includes('teak')) return { icon: Tag, color: 'from-yellow-600/20 to-amber-700/5 text-yellow-700' };
  return { icon: Tag, color: 'from-primary/20 to-primary/5 text-primary' };
};

export default function Products() {
  const { user } = useAuth();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [strategyFilter, setStrategyFilter] = useState('All');
  const [exporting, setExporting] = useState(false);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('products_view_mode') || 'table');

  const toggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('products_view_mode', mode);
  };

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
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
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
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2">
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
          
          {/* Segmented Grid/Table Control */}
          <div className="flex items-center bg-bg-light/60 p-1 rounded-lg border border-border/30 shrink-0">
            <button
              type="button"
              onClick={() => toggleViewMode('table')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'table' ? 'bg-bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => toggleViewMode('grid')}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === 'grid' ? 'bg-bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-primary'
              }`}
              title="Grid Catalog"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Product Display Mode */}
      {viewMode === 'grid' ? (
        loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card p-6 h-56 flex flex-col justify-between animate-pulse bg-bg-surface border border-border/40">
                <div className="h-24 bg-bg-light rounded-md mb-4" />
                <div className="h-4 bg-bg-light rounded w-3/4 mb-2" />
                <div className="h-3 bg-bg-light rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="card py-12 text-center text-text-muted text-sm bg-bg-surface border border-border/40">
            No products found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
            {products.map(p => {
              const design = getProductIcon(p.name);
              const ProductIcon = design.icon;
              return (
                <div 
                  key={p.id} 
                  className="card hover:shadow-lg transition-all duration-300 flex flex-col justify-between border border-border/40 relative overflow-hidden group hover:scale-[1.01] bg-bg-surface"
                >
                  {/* Card Top / Illustration Header */}
                  <div className={`h-24 rounded-t-card -mx-6 -mt-6 mb-4 bg-gradient-to-br ${design.color} flex items-center justify-center relative overflow-hidden border-b border-border/20`}>
                    <ProductIcon className="w-8 h-8 drop-shadow-sm transition-transform duration-300 group-hover:scale-110" />
                    <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      p.procurementType === 'MANUFACTURING' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {p.procurementType}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-text-primary truncate text-base mb-1">
                      <Link to={`/products/${p.id}`} className="hover:text-primary transition-colors">{p.name}</Link>
                    </h3>
                    <p className="text-xs text-text-muted mb-3 font-mono">{p.sku}</p>
                    
                    <div className="flex items-center gap-1.5 mb-4">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-bg-light text-text-secondary">
                        {p.category?.name ?? 'No Category'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/40 text-xs">
                      <div>
                        <p className="text-[10px] text-text-muted">Sales Price</p>
                        <p className="font-bold text-text-primary text-sm mt-0.5">{formatINR(p.salesPrice ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted">Cost Price</p>
                        <p className="font-semibold text-text-secondary text-sm mt-0.5">{formatINR(p.costPrice ?? 0)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border/40">
                    <Link
                      to={`/products/${p.id}`}
                      className="p-1.5 text-text-secondary hover:text-primary transition-colors bg-bg-light/40 rounded-lg hover:bg-bg-light"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to={`/products/${p.id}/edit`}
                      className="p-1.5 text-text-secondary hover:text-accent transition-colors bg-bg-light/40 rounded-lg hover:bg-bg-light"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Link>
                    {(user?.role === 'ADMIN' || user?.role === 'BUSINESS_OWNER') && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-text-secondary hover:text-danger transition-colors bg-bg-light/40 rounded-lg hover:bg-bg-light"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="card p-0 overflow-hidden bg-bg-surface border border-border/40">
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
                    <td colSpan={6} className="text-center py-12 text-text-muted text-sm bg-bg-surface">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id} className="border-b border-border hover:bg-black/[0.01]">
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-text-primary">{p.name}</p>
                        <p className="text-xs text-text-muted">{p.category?.name ?? '—'}</p>
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
      )}
    </PageWrapper>
  );
}
