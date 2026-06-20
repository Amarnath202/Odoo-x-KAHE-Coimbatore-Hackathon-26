import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/users.routes';
import companyRoutes from '../modules/companies/companies.routes';
import warehouseRoutes from '../modules/warehouses/warehouses.routes';
import unitRoutes from '../modules/units/units.routes';
import categoryRoutes from '../modules/categories/categories.routes';
import productRoutes from '../modules/products/products.routes';
import inventoryRoutes from '../modules/inventory/inventory.routes';
import salesRoutes from '../modules/sales/sales.routes';
import purchaseRoutes from '../modules/purchase/purchase.routes';
import bomRoutes from '../modules/bom/bom.routes';
import manufacturingRoutes from '../modules/manufacturing/manufacturing.routes';
import procurementRoutes from '../modules/procurement/procurement.routes';
import stockLedgerRoutes from '../modules/stock-ledger/stock-ledger.routes';
import auditLogRoutes from '../modules/audit-logs/audit-logs.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';

const router = Router();

// ============================================================
// ROUTE REGISTRATION
// ============================================================

// Auth (public — no authentication required)
router.use('/auth', authRoutes);

// User management
router.use('/users', userRoutes);

// Password Change
import { userPasswordChangeRoutes, adminPasswordChangeRoutes } from '../modules/password-change/password-change.routes';
router.use('/password-change', userPasswordChangeRoutes);
router.use('/admin/password-change-requests', adminPasswordChangeRoutes);

// Master data
router.use('/companies', companyRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/units', unitRoutes);
router.use('/categories', categoryRoutes);

// Core ERP — Products & Inventory
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);

// Sales module (handles /customers/* and /sales-orders/* internally)
router.use('/', salesRoutes);

// Purchase module (handles /vendors/* and /purchase-orders/* internally)
router.use('/', purchaseRoutes);

// Manufacturing
router.use('/boms', bomRoutes);
router.use('/manufacturing-orders', manufacturingRoutes);

// Automation & Traceability
router.use('/procurement', procurementRoutes);
router.use('/stock-ledger', stockLedgerRoutes);
router.use('/audit-logs', auditLogRoutes);

// Dashboard
router.use('/dashboard', dashboardRoutes);

export default router;
