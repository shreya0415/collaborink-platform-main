import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

/* Page transition variants */
const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 10, filter: 'blur(3px)' },
  animate: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0, y: -6, filter: 'blur(2px)',
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
  },
};

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const { user }             = useAuthStore();
  const { initializeSocket } = useChatStore();
  const location             = useLocation();

  /* Scroll progress for the inner content area */
  const mainRef     = useRef(null);
  const rawProgress = useMotionValue(0);
  const progress    = useSpring(rawProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const max = scrollHeight - clientHeight;
      rawProgress.set(max > 0 ? scrollTop / max : 0);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [rawProgress]);

  /* Socket initialization (unchanged) */
  useEffect(() => {
    if (user) initializeSocket(user._id);
  }, [user, initializeSocket]);

  return (
    <div className="app-shell app-grid flex h-screen overflow-hidden">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(o => !o)} />

        {/* Scroll progress bar — sits right below the navbar */}
        <div className="relative h-px w-full flex-shrink-0" style={{ background: 'rgba(71,85,105,0.2)' }}>
          <motion.div
            className="absolute inset-y-0 left-0 origin-left"
            style={{
              scaleX: progress,
              background: 'linear-gradient(90deg, #2dd4bf, #6366f1, #8b5cf6)',
            }}
          />
        </div>

        <main
          ref={mainRef}
          className="relative flex-1 overflow-auto p-4 sm:p-6 lg:p-8"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto h-full w-full max-w-[1600px]"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
