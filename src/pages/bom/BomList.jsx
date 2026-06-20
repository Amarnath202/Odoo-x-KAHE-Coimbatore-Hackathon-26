import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, Edit, BookOpen } from 'lucide-react';
import { PageWrapper } from '../../components/UI';
import { getStore, STORES } from '../../utils/storage';

export default function BomList() {
  const [boms, setBoms] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setBoms(getStore(STORES.BOM));
    setProducts(getStore(STORES.PRODUCTS));
  }, []);

  const getProduct = (id) => products.find(p => p.id === id) || null;

  const filteredBoms = boms.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.finishedProductName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PageWrapper>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bill of Materials</h1>
          <p className="page-subtitle">Define components and operations required to manufacture a product.</p>
        </div>
        <Link to="/bom/create" className="btn-primary btn-sm flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          Create BoM
        </Link>
      </div>

      {/* Search */}
      <div className="search-bar w-full md:max-w-md mb-6">
        <Search className="search-icon text-text-muted" />
        <input
          type="text"
          className="input pl-10"
          placeholder="Search BoM name or finished product..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* BoM Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr className="bg-bg-surface/50 border-b border-border">
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">BoM Name</th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-text-secondary font-semibold">Finished Product</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-text-secondary font-semibold">Components</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-text-secondary font-semibold">Operations</th>
                <th className="px-6 py-4 text-center text-xs uppercase tracking-wider text-text-secondary font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBoms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-text-muted text-sm bg-white">
                    No Bill of Materials found.
                  </td>
                </tr>
              ) : (
                filteredBoms.map(bom => (
                  <tr key={bom.id} className="border-b border-border hover:bg-black/[0.01]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{bom.name}</p>
                          <p className="text-xs text-text-muted">{bom.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-text-primary font-medium">{bom.finishedProductName}</p>
                      <p className="text-xs text-text-muted">{bom.finishedProductId}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {bom.components?.length ?? 0} items
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                        {bom.operations?.length ?? 0} ops
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link to={`/bom/${bom.id}`} className="p-1 text-text-secondary hover:text-primary transition-colors tooltip">
                          <Eye className="w-4 h-4" />
                          <span className="tooltip-content">View BoM</span>
                        </Link>
                        <Link to={`/bom/${bom.id}/edit`} className="p-1 text-text-secondary hover:text-accent transition-colors tooltip">
                          <Edit className="w-4 h-4" />
                          <span className="tooltip-content">Edit BoM</span>
                        </Link>
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
