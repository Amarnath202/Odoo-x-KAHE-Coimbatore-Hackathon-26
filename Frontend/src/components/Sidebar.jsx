import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Truck,
  Factory, BookOpen, Warehouse, ScrollText,
  LogOut, ChevronRight, Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ALL_NAV = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard, module: 'dashboard' },
    ],
  },
  {
    section: 'Operations',
    items: [
      { label: 'Sales', to: '/sales', icon: ShoppingCart, module: 'sales' },
      { label: 'Purchase', to: '/purchase', icon: Truck, module: 'purchase' },
      { label: 'Manufacturing', to: '/manufacturing', icon: Factory, module: 'manufacturing' },
    ],
  },
  {
    section: 'Products',
    items: [
      { label: 'Products', to: '/products', icon: Package, module: 'products' },
      { label: 'Bill of Materials', to: '/bom', icon: BookOpen, module: 'bom' },
    ],
  },
  {
    section: 'Warehouse',
    items: [
      { label: 'Inventory', to: '/inventory', icon: Warehouse, module: 'inventory' },
      { label: 'Audit Logs', to: '/audit', icon: ScrollText, module: 'audit' },
    ],
  },
  {
    section: 'Others',
    items: [
      { label: 'Customers', to: '/customers', icon: Users, module: 'customers' },
      { label: 'Vendors', to: '/vendors', icon: Users, module: 'vendors' },
      { label: 'Users', to: '/users', icon: Users, module: 'users' },
      { label: 'Password Requests', to: '/admin/password-requests', icon: Users, module: 'users' },
    ],
  },
];

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
    }
  };

  const roleLabel = {
    ADMIN: 'Admin',
    BUSINESS_OWNER: 'Business Owner',
    SALES_USER: 'Sales',
    PURCHASE_USER: 'Purchase',
    MANUFACTURING_USER: 'Manufacturing',
    INVENTORY_MANAGER: 'Inventory',
  };

  return (
    <aside className={`sidebar ${isMobileMenuOpen ? '!translate-x-0' : ''}`}>
      {/* Logo */}
      <Link
        to="/dashboard"
        onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
        className="sidebar-logo hover:opacity-90 transition-opacity duration-200 cursor-pointer no-underline flex items-center gap-3 px-4 py-4"
      >
        <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
          <img src="/logo-new.png" alt="Shiv Furniture" className="w-9 h-9 object-contain" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-white truncate leading-tight">Shiv Furniture</span>
          <span
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'rgba(0,200,197,0.85)' }}
          >
            ERP
          </span>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {ALL_NAV.map((section) => {
          const visibleItems = section.items.filter(item => hasPermission(item.module));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.section}>
              <p className="nav-section-label">{section.section}</p>
              {visibleItems.map((item, i) => (
                <motion.div
                  key={item.to}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <NavLink
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                          <ChevronRight className="w-3 h-3 ml-auto shrink-0 opacity-60" />
                        )}
                      </>
                    )}
                  </NavLink>
                </motion.div>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #9a6b8e, #00A09D)' }}
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate leading-tight">{user?.name || 'User'}</p>
            <p className="text-[10px] truncate font-medium" style={{ color: 'rgba(0,200,197,0.75)' }}>
              {roleLabel[user?.role] || user?.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
