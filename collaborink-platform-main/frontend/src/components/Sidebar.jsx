import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Boxes, CalendarDays, ChevronLeft, ChevronRight,
  Files, LayoutDashboard, MessageSquare, Settings, Bell, X,
  Sparkles,
} from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';

export const SIDEBAR_MENU = [
  { icon: LayoutDashboard, label: 'Overview',      path: '/dashboard' },
  { icon: MessageSquare,   label: 'Messages',      path: '/chat' },
  { icon: CalendarDays,    label: 'Calendar',      path: '/calendar' },
  { icon: Files,           label: 'Files',         path: '/files' },
  { icon: Bell,            label: 'Notifications', path: '/notifications' },
  { icon: Settings,        label: 'Settings',      path: '/settings' },
];

/* Workspace avatar — gradient initials bubble */
function WorkspaceAvatar({ name, size = 8 }) {
  const letter = name?.[0]?.toUpperCase() || 'W';
  return (
    <span
      className={`grid h-${size} w-${size} shrink-0 place-items-center rounded-lg text-xs font-bold`}
      style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,.35) 0%, rgba(45,212,191,.25) 100%)',
        border: '1px solid rgba(99,102,241,.3)',
        color: '#a5b4fc',
        boxShadow: '0 0 12px -4px rgba(99,102,241,.3)',
      }}
    >
      {letter}
    </span>
  );
}

export default function Sidebar({ isOpen, setIsOpen }) {
  const location         = useLocation();
  const { workspaces }   = useWorkspaceStore();
  const currentWorkspace = workspaces[0];
  const closeOnMobile    = () => { if (window.innerWidth < 1024) setIsOpen(false); };

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.button
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            aria-label="Close navigation"
            className="fixed inset-0 z-30 lg:hidden"
            style={{ background: 'rgba(4,8,16,.65)', backdropFilter: 'blur(4px)' }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.aside
        initial={false}
        animate={{ width: isOpen ? 272 : 76 }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        className={`
          fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col
          border-r border-slate-800/50 lg:relative
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          background: 'linear-gradient(180deg, rgba(7,11,22,.98) 0%, rgba(12,18,32,.96) 100%)',
          boxShadow: isOpen
            ? '1px 0 0 rgba(71,85,105,.25), 12px 0 40px -12px rgba(0,0,0,.6)'
            : '1px 0 0 rgba(71,85,105,.2)',
        }}
      >
        {/* ── Brand header ── */}
        <div className="flex h-[73px] flex-shrink-0 items-center justify-between px-4">
          <Link
            to="/dashboard"
            onClick={closeOnMobile}
            className="flex min-w-0 items-center gap-3 rounded-xl outline-none focus-ring"
            aria-label="Collaborink home"
          >
            {/* Logo mark */}
            <motion.span
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
              style={{
                background: 'linear-gradient(135deg, #2dd4bf 0%, #06b6d4 100%)',
                boxShadow: '0 6px 20px -6px rgba(45,212,191,.6), 0 0 0 1px rgba(255,255,255,.1) inset',
              }}
            >
              <Boxes size={20} strokeWidth={2.4} color="#042f2e" />
            </motion.span>

            {/* Wordmark — only when expanded */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: 0.04, duration: 0.2 } }}
                  exit={{ opacity: 0, x: -8, transition: { duration: 0.12 } }}
                  className="truncate text-[15px] font-bold tracking-tighter text-white select-none"
                >
                  collaborink
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {/* Desktop collapse toggle */}
          <motion.button
            onClick={() => setIsOpen(o => !o)}
            className="icon-button hidden h-8 w-8 lg:inline-flex"
            aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isOpen ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
          </motion.button>

          {/* Mobile close button */}
          <button
            onClick={() => setIsOpen(false)}
            className="icon-button h-8 w-8 lg:hidden"
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Workspace card ── */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto', transition: { duration: 0.22 } }}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.15 } }}
              className="overflow-hidden px-3 mb-4"
            >
              <div
                className="flex items-center gap-2.5 rounded-xl p-3"
                style={{
                  background: 'rgba(7,11,22,.6)',
                  border: '1px solid rgba(71,85,105,.3)',
                }}
              >
                <WorkspaceAvatar name={currentWorkspace?.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-200">
                    {currentWorkspace?.name || 'Your workspace'}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    {currentWorkspace?.members?.length || 0} collaborator{currentWorkspace?.members?.length !== 1 ? 's' : ''}
                  </p>
                </div>
                {/* Online indicator */}
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: '#2dd4bf', boxShadow: '0 0 6px 1px rgba(45,212,191,.5)' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed workspace dot */}
        {!isOpen && (
          <div className="flex justify-center mb-4 px-3">
            <WorkspaceAvatar name={currentWorkspace?.name} size={10} />
          </div>
        )}

        {/* ── Navigation ── */}
        <nav className="flex-1 space-y-0.5 px-2.5 overflow-y-auto" aria-label="Main navigation">
          {SIDEBAR_MENU.map(({ icon: Icon, label, path }) => {
            const active = location.pathname === path ||
              (path !== '/dashboard' && location.pathname.startsWith(path));

            return (
              <Link
                key={path}
                to={path}
                onClick={closeOnMobile}
                title={!isOpen ? label : undefined}
                aria-current={active ? 'page' : undefined}
                className={`
                  group relative flex h-11 items-center gap-3 rounded-xl px-3
                  text-sm font-medium outline-none transition-colors duration-150
                  focus-ring
                  ${active
                    ? 'text-teal-200'
                    : 'text-slate-500 hover:text-slate-100'
                  }
                  ${!isOpen ? 'justify-center px-0' : ''}
                `}
              >
                {/* Active gradient background */}
                {active && (
                  <motion.span
                    layoutId="nav-active-bg"
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(45,212,191,.1) 0%, rgba(99,102,241,.06) 100%)',
                      border: '1px solid rgba(45,212,191,.16)',
                    }}
                  />
                )}

                {/* Active left accent bar (expanded only) */}
                {active && isOpen && (
                  <motion.span
                    layoutId="nav-active-bar"
                    className="absolute left-0 inset-y-2.5 w-[3px] rounded-r-full pointer-events-none"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    style={{ background: 'linear-gradient(180deg, #2dd4bf 0%, #6366f1 100%)' }}
                  />
                )}

                {/* Hover glow (inactive only) */}
                {!active && (
                  <span
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
                    style={{ background: 'rgba(30,41,59,.6)' }}
                  />
                )}

                {/* Icon */}
                <Icon
                  size={18}
                  strokeWidth={active ? 2.2 : 1.8}
                  className="relative shrink-0 transition-transform duration-150 group-hover:scale-110"
                />

                {/* Label */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, transition: { delay: 0.05 } }}
                      exit={{ opacity: 0, transition: { duration: 0.08 } }}
                      className="relative truncate"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom CTA card (expanded only) ── */}
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto', transition: { duration: 0.22 } }}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.15 } }}
              className="overflow-hidden px-2.5 pb-3"
            >
              <div
                className="relative overflow-hidden rounded-xl p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,.12) 0%, rgba(45,212,191,.08) 100%)',
                  border: '1px solid rgba(99,102,241,.2)',
                }}
              >
                {/* Sparkle decoration */}
                <div
                  className="absolute -right-3 -top-3 h-16 w-16 rounded-full opacity-30"
                  style={{ background: 'radial-gradient(circle, rgba(45,212,191,.4) 0%, transparent 70%)' }}
                />
                <Sparkles size={14} className="text-indigo-300 mb-2" />
                <p className="text-xs font-semibold text-slate-200 leading-snug">
                  Bring work into focus
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  Projects, decisions, and momentum — all in one place.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </>
  );
}
