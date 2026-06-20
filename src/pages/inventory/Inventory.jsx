import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, AlertTriangle, TrendingUp, Warehouse } from 'lucide-react';
import { PageWrapper, formatINR } from '../../components/UI';
import { getStore, STORES, getProductStock } from '../../utils/storage';

const STOCK_LEVEL = (onHand) => {
  if (onHand === 0) return { label: 'Out of Stock', cls: 'bg-red-100 text-red-700', row: 'stock-low' };
  if (onHand <= 5) return { label: 'Low Stock', cls: 'bg-yellow-100 text-yellow-700', row: 'stock-mid' };
  return { label: 'In Stock', cls: 'bg-green-100 text-green-700', row: '' };
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');

  useEffect(() => {
    setProducts(getStore(STORES.PRODUCTS));
  }, []);

  const enriched = products.map(p => {
    const stock = getProductStock(p.id);
    const level = STOCK_LEVEL(stock.onHand);
    return { ...p, ...stock, level };
  });

  const filtered = enriched.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLevel = levelFilter === 'All' || p.level.label === levelFilter;
    return matchSearch && matchLevel;
  });

  const outOfStock = enriched.filter(p => p.onHand === 0).length;
  const lowStock = enriched.filter(p => p.onHand > 0 && p.onHand <= 5).length;
  const totalValue = enriched.reduce((sum, p) => sum + (p.onHand * p.costPrice), 0);

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Monitor stock levels, reserved quantities, and warehouse value.</p>
        </div>
        <Link to="/inventory/ledger" className="btn-secondary btn-sm flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4" />
          Stock Ledger
        </Link>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="card bg-red-50 border-l-4 border-danger flex items-center gap-4 py-4">
          <AlertTriangle className="w-8 h-8 text-danger shrink-0" />
          <div>
            <p className="text-2xl font-bold text-danger">{outOfStock}</p>
            <p className="text-xs text-red-600 font-medium">Out of Stock Products</p>
          </div>
        </div>
        <div className="card bg-yellow-50 border-l-4 border-warning flex items-center gap-4 py-4">
          <AlertTriangle className="w-8 h-8 text-warning shrink-0" />
          <div>
            <p className="text-2xl font-bold text-warning">{lowStock}</p>
            <p className="text-xs text-yellow-600 font-medium">Low Stock Products (≤5)</p>
          </div>
        </div>
        <div className="card bg-green-50 border-l-4 border-success flex items-center gap-4 py-4">
          <Warehouse className="w-8 h-8 text-success shrink-0" />
          <div>
            <p className="text-2xl font-bold text-success">{formatINR(totalValue)}</p>
            <p className="text-xs text-green-600 font-medium">Total Inventory Value (Cost)</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-center">
        <div className="search-bar w-full md:max-w-sm">
          <Search className="search-icon" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search product..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="select w-full md:w-48" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
          <option value="All">All Levels</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr className="bg-bg-surface/50 border-b border-border">
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Product</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-text-secondary font-semibold">On Hand</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-text-secondary font-semibold">Reserved</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-text-secondary font-semibold">Free to Use</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-text-secondary font-semibold">Status</th>
                <th className="px-6 py-4 text-right text-xs uppercase tracking-wider text-text-secondary font-semibold">Stock Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-text-muted text-sm bg-white">
                    No products match your filter.
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className={`border-b border-border ${p.level.row}`}>
                    <td className="px-6 py-4">
                      <Link to={`/products/${p.id}`} className="hover:text-primary transition-colors">
                        <p className="text-sm font-semibold text-text-primary">{p.name}</p>
                        <p className="text-xs text-text-muted">{p.id} · {p.procurementStrategy}</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-center text-lg font-bold text-text-primary">{p.onHand}</td>
                    <td className="px-6 py-4 text-center text-sm text-orange-600 font-medium">{p.reserved}</td>
                    <td className="px-6 py-4 text-center text-sm text-green-600 font-bold">{p.freeToUse}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${p.level.cls}`}>
                        {p.level.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-text-primary">
                      {formatINR(p.onHand * p.costPrice)}
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
