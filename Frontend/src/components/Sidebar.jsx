import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Truck,
  Factory, BookOpen, Warehouse, ScrollText,
  Zap, LogOut, ChevronRight, Users,
} from 'lucide-react';
import { useAuth, ROLE_PERMISSIONS } from '../context/AuthContext';

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
      { label: 'Customer Management', to: '/customers', icon: Users, module: 'customers' },
      { label: 'Vendor Management', to: '/vendors', icon: Users, module: 'vendors' },
      { label: 'User Management', to: '/users', icon: Users, module: 'users' },
      { label: 'Password Requests', to: '/admin/password-requests', icon: Users, module: 'users' },
    ],
  },
];

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColor = {
    'Admin': 'text-primary',
    'Sales User': 'text-accent',
    'Purchase User': 'text-warning',
    'Manufacturing User': 'text-status-progress',
    'Inventory Manager': 'text-success',
  };

  return (
    <aside className={`sidebar ${isMobileMenuOpen ? '!translate-x-0' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="w-9 h-9 rounded-btn bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-glow">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-text-primary leading-tight truncate">Odoo Mini-ERP</p>
          <p className="text-[10px] text-text-muted truncate">Shiv Furniture Works</p>
        </div>
      </div>

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
                  transition={{ delay: i * 0.05 }}
                >
                  <NavLink
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                          <ChevronRight className="w-3 h-3 ml-auto shrink-0" />
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
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-btn bg-bg-light/50">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-text-primary truncate">{user?.name || 'User'}</p>
            <p className={`text-[10px] truncate font-medium ${roleColor[user?.role] || 'text-text-muted'}`}>
              {user?.role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
