import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, Edit, SlidersHorizontal, Tag } from 'lucide-react';
import PageWrapper from '../../components/UI';
import { getStore, STORES, getProductStock } from '../../utils/storage';
import { formatINR } from '../../components/UI';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [strategyFilter, setStrategyFilter] = useState('All'); // 'All' | 'MTS' | 'MTO'

  useEffect(() => {
    setProducts(getStore(STORES.PRODUCTS));
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.id && p.id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStrategy = strategyFilter === 'All' || p.procurementStrategy === strategyFilter;
    return matchesSearch && matchesStrategy;
  });

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage inventory items, pricing, and procurement strategies.</p>
        </div>
        <Link to="/products/create" className="btn-primary btn-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Create Product
        </Link>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-center justify-between">
        <div className="search-bar w-full md:max-w-md">
          <Search className="search-icon text-text-muted" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search by product name or code..."
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
            <option value="All">All Strategies</option>
            <option value="MTS">MTS (Make to Stock)</option>
            <option value="MTO">MTO (Make to Order)</option>
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
                <th className="px-6 py-4 text-right font-semibold text-text-secondary text-xs uppercase tracking-wider">Sales Price</th>
                <th className="px-6 py-4 text-right font-semibold text-text-secondary text-xs uppercase tracking-wider">Cost Price</th>
                <th className="px-6 py-4 text-center font-semibold text-text-secondary text-xs uppercase tracking-wider">On Hand</th>
                <th className="px-6 py-4 text-center font-semibold text-text-secondary text-xs uppercase tracking-wider">Reserved</th>
                <th className="px-6 py-4 text-center font-semibold text-text-secondary text-xs uppercase tracking-wider">Free to Use</th>
                <th className="px-6 py-4 text-center font-semibold text-text-secondary text-xs uppercase tracking-wider">Strategy</th>
                <th className="px-6 py-4 text-center font-semibold text-text-secondary text-xs uppercase tracking-wider">Procurement</th>
                <th className="px-6 py-4 text-center font-semibold text-text-secondary text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-text-muted text-sm bg-white">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => {
                  const stock = getProductStock(p.id);
                  return (
                    <tr key={p.id} className="border-b border-border hover:bg-black/[0.01]">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Tag className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">{p.name}</p>
                            <p className="text-xs text-text-muted">{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-text-primary">
                        {formatINR(p.salesPrice)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-text-secondary">
                        {formatINR(p.costPrice)}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-text-primary">
                        {stock.onHand}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-text-secondary">
                        {stock.reserved}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-accent">
                        {stock.freeToUse}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          p.procurementStrategy === 'MTO' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {p.procurementStrategy}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-xs text-text-secondary font-medium">
                        {p.procurementType}
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
                            <span className="tooltip-content">Edit Product</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PageWrapper>
  );
}
