import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowDownRight, ArrowUpRight, Search, Activity, Package } from 'lucide-react';
import { PageWrapper } from '../../components/UI';
import { getStore, STORES } from '../../utils/storage';
import { formatDateTime } from '../../components/UI';

export default function StockLedger() {
  const [ledger, setLedger] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    // Sort ledger by date descending
    const rawLedger = getStore(STORES.STOCK_LEDGER).sort((a, b) => new Date(b.date) - new Date(a.date));
    setLedger(rawLedger);
    setProducts(getStore(STORES.PRODUCTS));
  }, []);

  const getProduct = (id) => products.find(p => p.id === id) || null;

  const filteredLedger = ledger.filter(entry => {
    const prod = getProduct(entry.productId);
    const searchMatch = (prod?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        entry.reference.toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = typeFilter === 'All' || entry.type === typeFilter;
    return searchMatch && typeMatch;
  });

  const getMovementIcon = (type, qty) => {
    if (['IN', 'RETURN'].includes(type) || qty > 0) return <ArrowDownRight className="w-4 h-4 text-green-600" />;
    if (['OUT', 'CONSUME', 'SCRAP'].includes(type) || qty < 0) return <ArrowUpRight className="w-4 h-4 text-red-600" />;
    return <Activity className="w-4 h-4 text-blue-600" />;
  };

  const getMovementColor = (type, qty) => {
    if (['IN', 'RETURN'].includes(type) || qty > 0) return 'text-green-600 bg-green-50';
    if (['OUT', 'CONSUME', 'SCRAP'].includes(type) || qty < 0) return 'text-red-600 bg-red-50';
    if (['RESERVE'].includes(type)) return 'text-orange-600 bg-orange-50';
    if (['FREE'].includes(type)) return 'text-blue-600 bg-blue-50';
    return 'text-text-secondary bg-bg-light';
  };

  return (
    <PageWrapper>
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link to="/inventory" className="btn-ghost btn-icon text-text-secondary hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="page-title">Stock Ledger</h1>
            <p className="page-subtitle">Track all inventory movements and adjustments.</p>
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
            placeholder="Search product or reference..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="select w-full md:w-48" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="All">All Movements</option>
          <option value="IN">Stock In</option>
          <option value="OUT">Stock Out</option>
          <option value="RESERVE">Reservation</option>
          <option value="FREE">Freed</option>
          <option value="ADJUST">Adjustment</option>
        </select>
      </div>

      {/* Ledger Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr className="bg-bg-surface/50 border-b border-border">
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Date</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Product</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Movement Type</th>
                <th className="px-6 py-4 text-right text-xs uppercase tracking-wider text-text-secondary font-semibold">Quantity</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Reference</th>
              </tr>
            </thead>
            <tbody>
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-text-muted text-sm bg-white">
                    No ledger entries found.
                  </td>
                </tr>
              ) : (
                filteredLedger.map(entry => {
                  const prod = getProduct(entry.productId);
                  return (
                    <tr key={entry.id} className="border-b border-border hover:bg-black/[0.01]">
                      <td className="px-6 py-4 text-sm text-text-secondary whitespace-nowrap">
                        {formatDateTime(entry.date)}
                      </td>
                      <td className="px-6 py-4">
                        {prod ? (
                          <Link to={`/products/${prod.id}`} className="flex items-center gap-2 hover:text-primary transition-colors group">
                            <Package className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                            <div>
                              <p className="text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">{prod.name}</p>
                              <p className="text-xs text-text-muted">{prod.id}</p>
                            </div>
                          </Link>
                        ) : (
                          <span className="text-sm text-text-muted">Unknown ({entry.productId})</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${getMovementColor(entry.type, entry.qty)}`}>
                          {getMovementIcon(entry.type, entry.qty)}
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-bold ${entry.qty > 0 ? 'text-green-600' : entry.qty < 0 ? 'text-red-600' : 'text-text-primary'}`}>
                          {entry.qty > 0 ? '+' : ''}{entry.qty}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-secondary font-mono">{entry.reference}</span>
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
