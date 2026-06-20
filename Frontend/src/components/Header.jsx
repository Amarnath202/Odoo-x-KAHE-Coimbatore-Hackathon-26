import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Bell, Search, ChevronRight, Menu, LogOut, User as UserIcon } from 'lucide-react';
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

export default function Header({ setIsMobileMenuOpen }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileRef]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
      <div className="flex items-center gap-3">
        <button 
          className="md:hidden btn-ghost btn-icon -ml-2"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Breadcrumb */}
        <div className="hidden sm:flex items-center gap-1.5 text-sm">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-text-muted" />}
            <span className={i === crumbs.length - 1 ? 'text-text-primary font-medium' : 'text-text-muted'}>
              {crumb}
            </span>
          </React.Fragment>
        ))}
        </div>
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
        <div className="relative" ref={profileRef}>
          <button 
            className="flex items-center gap-2 hover:bg-bg-light/50 p-1.5 rounded-btn transition-colors text-left"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold text-white shadow-glow shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block">
              <p className="text-xs font-semibold text-text-primary leading-tight">{user?.name}</p>
              <p className="text-[10px] text-text-muted">{user?.role}</p>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-bg-surface border border-border rounded-xl shadow-xl py-1 z-50">
              <Link 
                to="/profile" 
                className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-bg-light transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <UserIcon className="w-4 h-4" />
                Profile
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-danger/10 w-full text-left transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
