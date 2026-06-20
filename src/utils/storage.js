/**
 * localStorage utility — central data store for the ERP
 * All modules read/write through these helpers.
 */

const PREFIX = 'erp_';

export const STORES = {
  PRODUCTS: 'products',
  SALES_ORDERS: 'sales_orders',
  PURCHASE_ORDERS: 'purchase_orders',
  MANUFACTURING_ORDERS: 'manufacturing_orders',
  BOM: 'bom',
  STOCK_LEDGER: 'stock_ledger',
  AUDIT_LOGS: 'audit_logs',
  COUNTERS: 'counters',
};

/* ── Core helpers ──────────────────────────────────────── */

export function getStore(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setStore(key, data) {
  localStorage.setItem(PREFIX + key, JSON.stringify(data));
}

export function getOne(key, id) {
  return getStore(key).find(item => item.id === id) || null;
}

export function upsert(key, item) {
  const store = getStore(key);
  const idx = store.findIndex(i => i.id === item.id);
  if (idx >= 0) {
    store[idx] = { ...store[idx], ...item, updatedAt: new Date().toISOString() };
  } else {
    store.push({ ...item, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  setStore(key, store);
  return item;
}

export function removeItem(key, id) {
  const store = getStore(key).filter(i => i.id !== id);
  setStore(key, store);
}

/* ── Auto-incrementing reference numbers ───────────────── */

export function nextRef(prefix) {
  const counters = (() => {
    try {
      return JSON.parse(localStorage.getItem(PREFIX + STORES.COUNTERS) || '{}');
    } catch {
      return {};
    }
  })();
  const next = (counters[prefix] || 0) + 1;
  counters[prefix] = next;
  localStorage.setItem(PREFIX + STORES.COUNTERS, JSON.stringify(counters));
  return `${prefix}-${String(next).padStart(3, '0')}`;
}

/* ── Stock helpers ─────────────────────────────────────── */

export function getProductStock(productId) {
  const products = getStore(STORES.PRODUCTS);
  const p = products.find(p => p.id === productId);
  if (!p) return { onHand: 0, reserved: 0, freeToUse: 0 };
  const onHand = p.onHand ?? 0;
  const reserved = p.reserved ?? 0;
  return { onHand, reserved, freeToUse: onHand - reserved };
}

export function adjustStock(productId, { deltaOnHand = 0, deltaReserved = 0 }) {
  const products = getStore(STORES.PRODUCTS);
  const idx = products.findIndex(p => p.id === productId);
  if (idx < 0) return;
  products[idx].onHand = (products[idx].onHand ?? 0) + deltaOnHand;
  products[idx].reserved = (products[idx].reserved ?? 0) + deltaReserved;
  products[idx].updatedAt = new Date().toISOString();
  setStore(STORES.PRODUCTS, products);
}

/* ── Stock Ledger ──────────────────────────────────────── */

export function addLedgerEntry({ productId, productName, type, qty, reference, note = '' }) {
  const ledger = getStore(STORES.STOCK_LEDGER);
  const products = getStore(STORES.PRODUCTS);
  const p = products.find(p => p.id === productId);
  const balanceAfter = p ? (p.onHand ?? 0) : 0;

  ledger.push({
    id: `LE-${Date.now()}`,
    date: new Date().toISOString(),
    productId,
    productName,
    type,       // 'IN' | 'OUT' | 'RESERVE' | 'UNRESERVE' | 'ADJUST'
    qty,        // positive = in, negative = out
    reference,
    note,
    balanceAfter,
  });
  setStore(STORES.STOCK_LEDGER, ledger);
}

/* ── Audit Logs ────────────────────────────────────────── */

export function addAuditLog({ user, role, module, action, reference, oldValue = null, newValue = null }) {
  const logs = getStore(STORES.AUDIT_LOGS);
  logs.push({
    id: `AL-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: user || 'System',
    role: role || 'System',
    module,
    action,
    reference,
    oldValue: oldValue ? JSON.stringify(oldValue) : '',
    newValue: newValue ? JSON.stringify(newValue) : '',
  });
  setStore(STORES.AUDIT_LOGS, logs);
}

/* ── Seed demo data ─────────────────────────────────────── */

export function seedDemoData() {
  if (getStore(STORES.PRODUCTS).length > 0) return; // already seeded

  const products = [
    { id: 'P001', name: 'Teak Wood Chair', salesPrice: 4500, costPrice: 2800, onHand: 25, reserved: 5, procurementStrategy: 'MTS', procurementType: 'Manufacturing', vendor: '', bomId: 'BOM001' },
    { id: 'P002', name: 'Oak Dining Table', salesPrice: 12000, costPrice: 7500, onHand: 8, reserved: 2, procurementStrategy: 'MTS', procurementType: 'Manufacturing', vendor: '', bomId: 'BOM002' },
    { id: 'P003', name: 'Sheesham Wood', salesPrice: 800, costPrice: 500, onHand: 120, reserved: 30, procurementStrategy: 'MTS', procurementType: 'Purchase', vendor: 'Rajasthan Timber Co.' },
    { id: 'P004', name: 'Brass Handles', salesPrice: 150, costPrice: 80, onHand: 200, reserved: 20, procurementStrategy: 'MTS', procurementType: 'Purchase', vendor: 'Metal Craft Exports' },
    { id: 'P005', name: 'Custom Sofa Set', salesPrice: 35000, costPrice: 20000, onHand: 3, reserved: 1, procurementStrategy: 'MTO', procurementType: 'Manufacturing', vendor: '' },
    { id: 'P006', name: 'Fabric Upholstery', salesPrice: 600, costPrice: 350, onHand: 4, reserved: 0, procurementStrategy: 'MTS', procurementType: 'Purchase', vendor: 'Textile Hub' },
  ];

  const boms = [
    {
      id: 'BOM001', name: 'Teak Wood Chair BoM', finishedProductId: 'P001', finishedProductName: 'Teak Wood Chair',
      components: [
        { id: 'C1', componentId: 'P003', componentName: 'Sheesham Wood', qty: 2 },
        { id: 'C2', componentId: 'P004', componentName: 'Brass Handles', qty: 4 },
      ],
      operations: [
        { id: 'O1', name: 'Cutting', workCenter: 'Wood Shop', duration: 2 },
        { id: 'O2', name: 'Assembly', workCenter: 'Assembly Floor', duration: 3 },
        { id: 'O3', name: 'Finishing', workCenter: 'Paint Shop', duration: 1.5 },
      ],
    },
    {
      id: 'BOM002', name: 'Oak Dining Table BoM', finishedProductId: 'P002', finishedProductName: 'Oak Dining Table',
      components: [
        { id: 'C3', componentId: 'P003', componentName: 'Sheesham Wood', qty: 5 },
        { id: 'C4', componentId: 'P004', componentName: 'Brass Handles', qty: 2 },
      ],
      operations: [
        { id: 'O4', name: 'Planing', workCenter: 'Wood Shop', duration: 3 },
        { id: 'O5', name: 'Joinery', workCenter: 'Assembly Floor', duration: 4 },
        { id: 'O6', name: 'Polishing', workCenter: 'Paint Shop', duration: 2 },
      ],
    },
  ];

  setStore(STORES.PRODUCTS, products);
  setStore(STORES.BOM, boms);

  // seed a few orders for demo
  const now = new Date();
  const d = (n) => new Date(now - n * 86400000).toISOString();

  const salesOrders = [
    { id: 'SO-001', customer: 'Mehta Interiors', date: d(3), status: 'Confirmed', total: 9000, lines: [{ productId: 'P001', productName: 'Teak Wood Chair', qty: 2, unitPrice: 4500, subtotal: 9000 }] },
    { id: 'SO-002', customer: 'Delhi Decor', date: d(1), status: 'Draft', total: 12000, lines: [{ productId: 'P002', productName: 'Oak Dining Table', qty: 1, unitPrice: 12000, subtotal: 12000 }] },
    { id: 'SO-003', customer: 'Agarwal Furnishings', date: d(5), status: 'Done', total: 35000, lines: [{ productId: 'P005', productName: 'Custom Sofa Set', qty: 1, unitPrice: 35000, subtotal: 35000 }] },
    { id: 'SO-004', customer: 'Sharma House', date: d(2), status: 'Partial', total: 22500, lines: [{ productId: 'P001', productName: 'Teak Wood Chair', qty: 5, unitPrice: 4500, subtotal: 22500 }] },
    { id: 'SO-005', customer: 'Royal Stays', date: d(7), status: 'Cancelled', total: 8000, lines: [{ productId: 'P001', productName: 'Teak Wood Chair', qty: 2, unitPrice: 4000, subtotal: 8000 }] },
  ];

  const purchaseOrders = [
    { id: 'PO-001', vendor: 'Rajasthan Timber Co.', date: d(2), status: 'Confirmed', total: 15000, lines: [{ productId: 'P003', productName: 'Sheesham Wood', qty: 30, unitCost: 500, subtotal: 15000 }] },
    { id: 'PO-002', vendor: 'Metal Craft Exports', date: d(4), status: 'Partial', total: 8000, lines: [{ productId: 'P004', productName: 'Brass Handles', qty: 100, unitCost: 80, subtotal: 8000 }] },
    { id: 'PO-003', vendor: 'Textile Hub', date: d(1), status: 'Draft', total: 3500, lines: [{ productId: 'P006', productName: 'Fabric Upholstery', qty: 10, unitCost: 350, subtotal: 3500 }] },
  ];

  const manufacturingOrders = [
    { id: 'MO-001', productId: 'P001', productName: 'Teak Wood Chair', qty: 5, status: 'In Progress', assignee: 'Ravi Kumar', date: d(2), bomId: 'BOM001' },
    { id: 'MO-002', productId: 'P002', productName: 'Oak Dining Table', qty: 2, status: 'Draft', assignee: 'Suresh Patel', date: d(1), bomId: 'BOM002' },
    { id: 'MO-003', productId: 'P001', productName: 'Teak Wood Chair', qty: 3, status: 'Done', assignee: 'Amit Singh', date: d(6), bomId: 'BOM001' },
  ];

  setStore(STORES.SALES_ORDERS, salesOrders);
  setStore(STORES.PURCHASE_ORDERS, purchaseOrders);
  setStore(STORES.MANUFACTURING_ORDERS, manufacturingOrders);

  // counters
  localStorage.setItem(PREFIX + STORES.COUNTERS, JSON.stringify({ SO: 5, PO: 3, MO: 3, P: 6, BOM: 2 }));

  // audit logs
  const auditLogs = [
    { id: 'AL-1', timestamp: d(7), user: 'Admin', role: 'Admin', module: 'Sales', action: 'Created', reference: 'SO-005', oldValue: '', newValue: '' },
    { id: 'AL-2', timestamp: d(6), user: 'Admin', role: 'Admin', module: 'Manufacturing', action: 'Completed', reference: 'MO-003', oldValue: 'In Progress', newValue: 'Done' },
    { id: 'AL-3', timestamp: d(5), user: 'Admin', role: 'Admin', module: 'Sales', action: 'Cancelled', reference: 'SO-005', oldValue: 'Confirmed', newValue: 'Cancelled' },
    { id: 'AL-4', timestamp: d(4), user: 'Admin', role: 'Admin', module: 'Purchase', action: 'Confirmed', reference: 'PO-002', oldValue: 'Draft', newValue: 'Confirmed' },
    { id: 'AL-5', timestamp: d(3), user: 'Admin', role: 'Admin', module: 'Sales', action: 'Confirmed', reference: 'SO-001', oldValue: 'Draft', newValue: 'Confirmed' },
    { id: 'AL-6', timestamp: d(2), user: 'Admin', role: 'Admin', module: 'Purchase', action: 'Created', reference: 'PO-001', oldValue: '', newValue: '' },
    { id: 'AL-7', timestamp: d(2), user: 'Admin', role: 'Admin', module: 'Manufacturing', action: 'Started', reference: 'MO-001', oldValue: 'Draft', newValue: 'In Progress' },
    { id: 'AL-8', timestamp: d(1), user: 'Admin', role: 'Admin', module: 'Purchase', action: 'Created', reference: 'PO-003', oldValue: '', newValue: '' },
    { id: 'AL-9', timestamp: d(1), user: 'Admin', role: 'Admin', module: 'Sales', action: 'Created', reference: 'SO-002', oldValue: '', newValue: '' },
    { id: 'AL-10', timestamp: new Date().toISOString(), user: 'Admin', role: 'Admin', module: 'Sales', action: 'Partially Delivered', reference: 'SO-004', oldValue: 'Confirmed', newValue: 'Partial' },
  ];
  setStore(STORES.AUDIT_LOGS, auditLogs);
}
