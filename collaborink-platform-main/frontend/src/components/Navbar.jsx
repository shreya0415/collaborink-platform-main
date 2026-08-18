import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown, LogOut, Menu, Search,
  Settings, User, ArrowRight,
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useAuthStore } from '../store/authStore';
import { SIDEBAR_MENU } from './Sidebar';

/* ─── Page title map ─── */
const TITLES = {
  '/dashboard':    'Overview',
  '/chat':         'Messages',
  '/calendar':     'Calendar',
  '/files':        'Files',
  '/notifications':'Notifications',
  '/settings':     'Settings',
};

/* ─── Dropdown animation ─── */
const DROPDOWN_VARIANTS = {
  hidden:  { opacity: 0, y: -6, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -4, scale: 0.97,
    transition: { duration: 0.13 } },
};

const PALETTE_BACKDROP = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.15 } },
};

const PALETTE_PANEL = {
  hidden:  { opacity: 0, y: -16, scale: 0.96 },
  visible: { opacity: 1, y: 0,   scale: 1,
    transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -12, scale: 0.97,
    transition: { duration: 0.18 } },
};

/* ─── Command palette ─── */
function CommandPalette({ onClose }) {
  const [query, setQuery]   = useState('');
  const inputRef            = useRef(null);
  const navigate            = useNavigate();

  /* Auto-focus input */
  useEffect(() => { inputRef.current?.focus(); }, []);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const filtered = SIDEBAR_MENU.filter(item =>
    !query || item.label.toLowerCase().includes(query.toLowerCase())
  );

  const go = (path) => { navigate(path); onClose(); };

  return (
    <motion.div
      key="palette-backdrop"
      variants={PALETTE_BACKDROP}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh] px-4"
      style={{ background: 'rgba(4,8,16,.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        variants={PALETTE_PANEL}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl"
        style={{
          background: 'rgba(7,11,22,.95)',
          border: '1px solid rgba(71,85,105,.45)',
          boxShadow: '0 0 0 1px rgba(255,255,255,.05) inset, 0 40px 80px -24px rgba(0,0,0,.9), 0 0 40px -12px rgba(45,212,191,.08)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top accent */}
        <div
          className="h-px w-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(45,212,191,.45), transparent)' }}
        />

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(71,85,105,.3)' }}>
          <Search size={16} className="text-slate-500 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Navigate to..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
          />
          <kbd
            className="hidden sm:inline-flex items-center gap-1 text-[10px] text-slate-600 rounded-md px-1.5 py-0.5"
            style={{ border: '1px solid rgba(71,85,105,.4)' }}
          >
            Esc
          </kbd>
        </div>

        {/* Navigation results */}
        <div className="p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-slate-600">No results for "{query}"</p>
          ) : (
            <>
              <p className="px-3 py-1.5 text-[10px] font-semibold tracking-widest uppercase text-slate-600">
                Navigate
              </p>
              {filtered.map(({ icon: Icon, label, path }) => (
                <button
                  key={path}
                  onClick={() => go(path)}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition-colors hover:text-white"
                  style={{ background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,41,59,.7)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors"
                    style={{ background: 'rgba(30,41,59,.8)', border: '1px solid rgba(71,85,105,.3)' }}
                  >
                    <Icon size={14} className="text-slate-500 group-hover:text-teal-400 transition-colors" />
                  </span>
                  <span className="flex-1 text-left">{label}</span>
                  <ArrowRight size={13} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-2.5"
          style={{ borderTop: '1px solid rgba(71,85,105,.25)' }}
        >
          <span className="text-[10px] text-slate-600">Type to search</span>
          <div className="flex items-center gap-3 text-[10px] text-slate-600">
            <span className="flex items-center gap-1">
              <kbd className="inline-flex items-center rounded px-1 py-0.5" style={{ border: '1px solid rgba(71,85,105,.4)' }}>↵</kbd>
              to open
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex items-center rounded px-1 py-0.5" style={{ border: '1px solid rgba(71,85,105,.4)' }}>Esc</kbd>
              to close
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main Navbar ─── */
export default function Navbar({ onToggleSidebar }) {
  const { user, logout }    = useAuthStore();
  const navigate            = useNavigate();
  const location            = useLocation();
  const [dropdown, setDropdown] = useState(false);
  const [cmdOpen, setCmdOpen]   = useState(false);
  const dropdownRef             = useRef(null);

  /* Derive page title */
  const isBoard    = location.pathname.startsWith('/board/');
  const isSettings = location.pathname.includes('/projects/');
  const title = isBoard
    ? 'Project Board'
    : isSettings
      ? 'Project Settings'
      : (TITLES[location.pathname] || 'Collaborink');

  const sectionLabel = isBoard || isSettings ? 'Projects' : 'Workspace';

  /* User initials */
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U';

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ⌘K / Ctrl+K opens command palette */
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/auth'); };

  return (
    <>
      <header
        className="relative z-20 flex h-[73px] shrink-0 items-center justify-between px-4 sm:px-6"
        style={{
          background: 'rgba(7,11,22,.82)',
          borderBottom: '1px solid rgba(71,85,105,.3)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        }}
      >
        {/* Left — mobile toggle + page title */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <motion.button
            onClick={onToggleSidebar}
            className="icon-button lg:hidden"
            aria-label="Toggle navigation"
            whileTap={{ scale: 0.9 }}
          >
            <Menu size={20} />
          </motion.button>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-teal-400/75 leading-none mb-0.5">
              {sectionLabel}
            </p>
            <h1 className="truncate text-[15px] font-semibold tracking-tight text-white leading-none">
              {title}
            </h1>
          </div>
        </div>

        {/* Right — search, bell, settings, avatar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Command palette trigger */}
          <motion.button
            onClick={() => setCmdOpen(true)}
            className="hidden md:flex h-9 w-52 items-center gap-2 rounded-xl px-3 text-left text-xs text-slate-500 transition-colors hover:text-slate-300"
            style={{
              background: 'rgba(7,11,22,.6)',
              border: '1px solid rgba(71,85,105,.4)',
            }}
            whileHover={{ borderColor: 'rgba(71,85,105,.7)' }}
            aria-label="Open command palette"
          >
            <Search size={14} className="flex-shrink-0" />
            <span className="flex-1">Search...</span>
            <kbd
              className="flex items-center gap-0.5 text-[10px] text-slate-600 rounded px-1.5 py-0.5"
              style={{ border: '1px solid rgba(71,85,105,.45)', background: 'rgba(15,23,42,.5)' }}
            >
              <span className="text-[11px] leading-none">⌘</span>K
            </kbd>
          </motion.button>

          {/* Notification bell */}
          <NotificationBell />

          {/* Settings link */}
          <Link to="/settings" className="icon-button hidden sm:inline-flex" aria-label="Settings">
            <Settings size={18} />
          </Link>

          {/* Divider */}
          <div className="hidden sm:block h-6 w-px mx-1" style={{ background: 'rgba(71,85,105,.4)' }} />

          {/* User avatar + dropdown */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              onClick={() => setDropdown(o => !o)}
              aria-expanded={dropdown}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-xl p-1.5 outline-none transition-colors hover:bg-slate-800/60 focus-ring"
              whileTap={{ scale: 0.97 }}
            >
              {/* Avatar */}
              <span
                className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg text-xs font-bold"
                style={{
                  background: 'linear-gradient(135deg, #818cf8 0%, #2dd4bf 100%)',
                  boxShadow: '0 0 0 2px rgba(45,212,191,.2)',
                  color: '#042f2e',
                }}
              >
                {user?.avatar
                  ? <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                  : initials
                }
              </span>

              <span className="hidden text-left sm:block">
                <span className="block max-w-24 truncate text-xs font-semibold text-slate-200 leading-none mb-0.5">
                  {user?.firstName || 'Account'}
                </span>
                <span className="block text-[10px] text-slate-500 leading-none">Personal</span>
              </span>

              <motion.span
                animate={{ rotate: dropdown ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="hidden sm:block"
              >
                <ChevronDown size={14} className="text-slate-500" />
              </motion.span>
            </motion.button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {dropdown && (
                <motion.div
                  key="user-dropdown"
                  role="menu"
                  variants={DROPDOWN_VARIANTS}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl"
                  style={{
                    background: 'rgba(7,11,22,.97)',
                    border: '1px solid rgba(71,85,105,.4)',
                    boxShadow: '0 0 0 1px rgba(255,255,255,.045) inset, 0 24px 48px -12px rgba(0,0,0,.85), 0 0 30px -10px rgba(45,212,191,.06)',
                  }}
                >
                  {/* User info header */}
                  <div
                    className="px-4 py-3"
                    style={{ borderBottom: '1px solid rgba(71,85,105,.3)' }}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <span
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #818cf8 0%, #2dd4bf 100%)',
                          color: '#042f2e',
                        }}
                      >
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-200">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">{user?.email}</p>
                      </div>
                    </div>
                    {/* Online status */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ background: '#2dd4bf', boxShadow: '0 0 4px rgba(45,212,191,.6)' }}
                      />
                      <span className="text-[10px] text-slate-500">Online</span>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-1.5">
                    <Link
                      to="/settings"
                      onClick={() => setDropdown(false)}
                      role="menuitem"
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white"
                    >
                      <User size={15} className="text-slate-500" />
                      Profile &amp; settings
                    </Link>

                    <div className="my-1 h-px" style={{ background: 'rgba(71,85,105,.25)' }} />

                    <button
                      onClick={handleLogout}
                      role="menuitem"
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-rose-400 transition-colors hover:bg-rose-400/8"
                    >
                      <LogOut size={15} className="text-rose-500" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Command palette overlay */}
      <AnimatePresence>
        {cmdOpen && (
          <CommandPalette onClose={() => setCmdOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
