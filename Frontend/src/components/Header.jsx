import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, Search, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BREADCRUMB_MAP = {
  '/dashboard': ['Dashboard'],
  '/products': ['Products'],
  '/products/create': ['Products', 'Create Product'],
  '/bom': ['Bill of Materials'],
  '/bom/create': ['Bill of Materials', 'Create BoM'],
  '/sales': ['Sales', 'Orders'],
  '/sales/create': ['Sales', 'Create Order'],
  '/purchase': ['Purchase', 'Orders'],
  '/purchase/create': ['Purchase', 'Create Order'],
  '/manufacturing': ['Manufacturing', 'Orders'],
  '/manufacturing/create': ['Manufacturing', 'Create Order'],
  '/inventory': ['Inventory'],
  '/audit': ['Audit Logs'],
};

export default function Header() {
  const { user } = useAuth();
  const location = useLocation();

  const crumbs = (() => {
    // exact match
    if (BREADCRUMB_MAP[location.pathname]) return BREADCRUMB_MAP[location.pathname];
    // partial match for detail pages
    const base = Object.keys(BREADCRUMB_MAP).find(k =>
      location.pathname.startsWith(k) && k !== '/'
    );
    if (base) {
      const crumb = [...BREADCRUMB_MAP[base]];
      const tail = location.pathname.replace(base, '').replace(/^\//, '');
      if (tail && tail !== 'create') crumb.push(tail.toUpperCase());
      return crumb;
    }
    return [];
  })();

  const now = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <header className="header">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-text-muted" />}
            <span className={i === crumbs.length - 1 ? 'text-text-primary font-medium' : 'text-text-muted'}>
              {crumb}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-text-muted hidden sm:block">{now}</span>

        <div className="w-px h-5 bg-border" />
        {/* Notification Bell */}
        <button className="btn-ghost btn-icon relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger border-2 border-bg-surface" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white shadow-glow">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-text-primary leading-tight">{user?.name}</p>
            <p className="text-[10px] text-text-muted">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
