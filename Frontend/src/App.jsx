import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages — Foundation
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NotFound from './pages/NotFound';

// Products module
import Products from './pages/products/Products';
import ProductCreate from './pages/products/ProductCreate';
import ProductDetail from './pages/products/ProductDetail';

// BoM module
import BomList from './pages/bom/BomList';
import BomCreate from './pages/bom/BomCreate';
import BomDetail from './pages/bom/BomDetail';

// Inventory module
import Inventory from './pages/inventory/Inventory';
import StockLedger from './pages/inventory/StockLedger';
import AuditLogs from './pages/inventory/AuditLogs';

// Others module
import CustomerList from './pages/customers/CustomerList';
import VendorList from './pages/vendors/VendorList';

// Sales module (your friend builds these)
import Sales from './pages/sales/Sales';
import SalesCreate from './pages/sales/SalesCreate';
import SalesDetail from './pages/sales/SalesDetail';

// Purchase module (your friend builds these)
import Purchase from './pages/purchase/Purchase';
import PurchaseCreate from './pages/purchase/PurchaseCreate';
import PurchaseDetail from './pages/purchase/PurchaseDetail';

// Manufacturing module (your friend builds these)
import Manufacturing from './pages/manufacturing/Manufacturing';
import ManufacturingCreate from './pages/manufacturing/ManufacturingCreate';
import ManufacturingDetail from './pages/manufacturing/ManufacturingDetail';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

      {/* Protected App */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>} />

        {/* Products */}
        <Route path="/products" element={<ProtectedRoute module="products"><Products /></ProtectedRoute>} />
        <Route path="/products/create" element={<ProtectedRoute module="products"><ProductCreate /></ProtectedRoute>} />
        <Route path="/products/:id" element={<ProtectedRoute module="products"><ProductDetail /></ProtectedRoute>} />
        <Route path="/products/:id/edit" element={<ProtectedRoute module="products"><ProductCreate /></ProtectedRoute>} />

        {/* BoM */}
        <Route path="/bom" element={<ProtectedRoute module="bom"><BomList /></ProtectedRoute>} />
        <Route path="/bom/create" element={<ProtectedRoute module="bom"><BomCreate /></ProtectedRoute>} />
        <Route path="/bom/:id" element={<ProtectedRoute module="bom"><BomDetail /></ProtectedRoute>} />
        <Route path="/bom/:id/edit" element={<ProtectedRoute module="bom"><BomCreate /></ProtectedRoute>} />

        {/* Inventory */}
        <Route path="/inventory" element={<ProtectedRoute module="inventory"><Inventory /></ProtectedRoute>} />
        <Route path="/inventory/ledger" element={<ProtectedRoute module="inventory"><StockLedger /></ProtectedRoute>} />
        <Route path="/audit" element={<ProtectedRoute module="audit"><AuditLogs /></ProtectedRoute>} />

        {/* Sales (friend builds) */}
        <Route path="/sales" element={<ProtectedRoute module="sales"><Sales /></ProtectedRoute>} />
        <Route path="/sales/create" element={<ProtectedRoute module="sales"><SalesCreate /></ProtectedRoute>} />
        <Route path="/sales/:id" element={<ProtectedRoute module="sales"><SalesDetail /></ProtectedRoute>} />

        {/* Purchase (friend builds) */}
        <Route path="/purchase" element={<ProtectedRoute module="purchase"><Purchase /></ProtectedRoute>} />
        <Route path="/purchase/create" element={<ProtectedRoute module="purchase"><PurchaseCreate /></ProtectedRoute>} />
        <Route path="/purchase/:id" element={<ProtectedRoute module="purchase"><PurchaseDetail /></ProtectedRoute>} />

        {/* Manufacturing (friend builds) */}
        <Route path="/manufacturing" element={<ProtectedRoute module="manufacturing"><Manufacturing /></ProtectedRoute>} />
        <Route path="/manufacturing/create" element={<ProtectedRoute module="manufacturing"><ManufacturingCreate /></ProtectedRoute>} />
        <Route path="/manufacturing/:id" element={<ProtectedRoute module="manufacturing"><ManufacturingDetail /></ProtectedRoute>} />
        
        {/* Others */}
        <Route path="/customers" element={<ProtectedRoute module="customers"><CustomerList /></ProtectedRoute>} />
        <Route path="/vendors" element={<ProtectedRoute module="vendors"><VendorList /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
