import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Bell, Search, ChevronRight, Menu, LogOut, User as UserIcon, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';

const BREADCRUMB_MAP = {
  '/dashboard': ['Dashboard'],
  '/products': ['Products'],
  '/products/create': ['Products', 'Create Product'],
  '/bom': ['Bill of Materials'],
  '/bom/create': ['Bill of Materials', 'Create BoM'],
  '/sales': ['Sales', 'Orders'],
  '/sales/create': ['Sales', 'Orders', 'Create Order'],
  '/purchase': ['Purchase', 'Orders'],
  '/purchase/create': ['Purchase', 'Orders', 'Create Order'],
  '/manufacturing': ['Manufacturing', 'Orders'],
  '/manufacturing/create': ['Manufacturing', 'Orders', 'Create Order'],
  '/inventory': ['Inventory'],
  '/audit': ['Audit Logs'],
  '/customers': ['Others', 'Customer Management'],
  '/vendors': ['Others', 'Vendor Management'],
};

// Maps breadcrumb label -> route path for clickable parent crumbs
const CRUMB_LINK_MAP = {
  'Dashboard': '/dashboard',
  'Products': '/products',
  'Bill of Materials': '/bom',
  'Sales': '/sales',
  'Orders': null, // last crumb, or determined dynamically
  'Purchase': '/purchase',
  'Manufacturing': '/manufacturing',
  'Inventory': '/inventory',
  'Others': null,
};

export default function Header({ setIsMobileMenuOpen }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const profileRef = useRef(null);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'odoo');
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const themeRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setIsThemeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [themeRef]);

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
    setIsLogoutModalOpen(true);
    setIsProfileOpen(false);
  };

  const confirmLogout = () => {
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
    <>
    <header className="header">
      <div className="flex items-center gap-2">
        <button 
          className="md:hidden btn-ghost btn-icon -ml-2"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </button>
        {/* Breadcrumb */}
        <div className="hidden sm:flex items-center gap-1 text-xs">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1;
            let linkTo = CRUMB_LINK_MAP[crumb];
            if (crumb === 'Orders') {
              if (location.pathname.startsWith('/sales')) linkTo = '/sales';
              else if (location.pathname.startsWith('/purchase')) linkTo = '/purchase';
              else if (location.pathname.startsWith('/manufacturing')) linkTo = '/manufacturing';
            }
            return (
              <React.Fragment key={i}>
                {i > 0 && <ChevronRight className="w-3 h-3 text-border-strong" />}
                {isLast ? (
                  <span className="font-semibold text-text-primary">{crumb}</span>
                ) : linkTo ? (
                  <Link to={linkTo} className="text-text-muted hover:text-primary transition-colors">{crumb}</Link>
                ) : (
                  <span className="text-text-muted">{crumb}</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-medium text-text-muted hidden lg:block">{now}</span>
        <div className="w-px h-4 bg-border hidden sm:block" />

        {/* Notification Bell */}
        <button className="btn-ghost btn-icon relative">
          <Bell className="w-4 h-4 text-text-secondary" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-danger" />
        </button>

        {/* Theme Toggler */}
        <div className="relative" ref={themeRef}>
          <button
            className="btn-ghost btn-icon"
            onClick={() => setIsThemeOpen(!isThemeOpen)}
            title="Choose Theme"
          >
            <Palette className="w-4 h-4 text-text-secondary" />
          </button>
          {isThemeOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-bg-surface border border-border rounded-xl shadow-lift py-2 z-50">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">Theme</p>
              {[
                { name: 'Odoo Purple', value: 'odoo',        color: '#714B67' },
                { name: 'Warm Wood',   value: 'warm-wood',   color: '#8B5A2B' },
                { name: 'Sleek Slate', value: 'sleek-slate', color: '#818CF8' },
              ].map(t => (
                <button
                  key={t.value}
                  onClick={() => { setTheme(t.value); setIsThemeOpen(false); }}
                  className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium w-full text-left transition-colors hover:bg-primary-pale hover:text-primary ${
                    theme === t.value ? 'bg-primary-pale text-primary font-semibold' : 'text-text-primary'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: t.color }} />
                  {t.name}
                  {theme === t.value && <span className="ml-auto text-primary text-xs">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-4 bg-border" />

        {/* User Avatar */}
        <div className="relative" ref={profileRef}>
          <button
            className="flex items-center gap-2.5 hover:bg-primary-pale px-2.5 py-1.5 rounded-xl transition-colors text-left"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #714B67, #00A09D)' }}
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-text-primary leading-tight">{user?.name}</p>
              <p className="text-[10px] text-text-muted">{user?.role}</p>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-bg-surface border border-border rounded-xl shadow-lift py-2 z-50">
              <div className="px-4 py-2 border-b border-border mb-1">
                <p className="text-sm font-semibold text-text-primary">{user?.name}</p>
                <p className="text-xs text-text-muted">{user?.email || user?.role}</p>
              </div>
              <Link
                to="/profile"
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-primary hover:bg-primary-pale hover:text-primary transition-colors"
                onClick={() => setIsProfileOpen(false)}
              >
                <UserIcon className="w-4 h-4" />
                My Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-danger hover:bg-red-50 w-full text-left transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
    {/* Logout Confirmation Modal */}
    <Modal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} title="Confirm Logout">
      <div className="p-4">
        <p className="text-text-secondary text-sm">Are you sure you want to logout?</p>
      </div>
      <div className="flex items-center justify-end gap-3 px-6 py-4 bg-bg-light/50 border-t border-border rounded-b-2xl mt-4">
        <button type="button" onClick={() => setIsLogoutModalOpen(false)} className="btn-secondary">Cancel</button>
        <button type="button" onClick={confirmLogout} className="btn-danger">Logout</button>
      </div>
    </Modal>
    </>
  );
}
