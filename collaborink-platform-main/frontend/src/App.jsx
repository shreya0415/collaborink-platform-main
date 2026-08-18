import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Lenis from 'lenis';

import PrivateRoute from './components/PrivateRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuthStore } from './store/authStore';
import { initSocket } from './services/socket';
import ProjectSettings from './pages/ProjectSettings/ProjectSettings';


// Lazy-loaded pages — each route becomes its own JS chunk
const AuthPage          = lazy(() => import('./pages/AuthPage'));
const Dashboard         = lazy(() => import('./pages/Dashboard'));
const BoardPage         = lazy(() => import('./pages/BoardPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const CalendarPage      = lazy(() => import('./pages/CalendarPage'));
const FilesPage         = lazy(() => import('./pages/FilesPage'));
const SettingsPage      = lazy(() => import('./pages/SettingsPage'));
const ChatPage          = lazy(() => import('./pages/ChatPage'));
const NotFoundPage      = lazy(() => import('./pages/NotFoundPage'));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function PageLoader() {
  return (
    <div className="page-loader">
      <div className="relative">
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(45,212,191,.18) 0%, transparent 70%)' }}
        />
        {/* Spinner */}
        <div className="page-loader__ring" />
      </div>
      <span className="text-xs font-medium tracking-widest text-slate-500 uppercase">
        collaborink
      </span>
    </div>
  );
}

function App() {
  const { token, getCurrentUser, user } = useAuthStore();

  // Smooth scroll for window-level pages (auth, etc.)
  // Inner app pages use their own overflow-auto container (handled in Layout, Section 3)
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    if (token) {
      getCurrentUser().catch(() => {});
    }
  }, [token]);

  useEffect(() => {
    if (user?._id) {
      const socket = initSocket();
      socket.emit('user:online', user._id);
    }
  }, [user?._id]);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Router>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/auth" element={<AuthPage />} />

              {/* Protected */}
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/board/:projectId" element={<PrivateRoute><BoardPage /></PrivateRoute>} />
              <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
              <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
              <Route path="/files" element={<PrivateRoute><FilesPage /></PrivateRoute>} />
              <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
              <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
              <Route path="/projects/:projectId/settings" element={<PrivateRoute><ProjectSettings /></PrivateRoute>} />

              {/* Aliases */}
              <Route path="/projects" element={<Navigate to="/dashboard" replace />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </Router>
      </ErrorBoundary>

      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(12, 18, 32, 0.95)',
            color: '#f1f5f9',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            boxShadow: '0 20px 40px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.045) inset',
            backdropFilter: 'blur(16px)',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            padding: '0.75rem 1rem',
          },
          success: {
            iconTheme: { primary: '#2dd4bf', secondary: '#042f2e' },
            style: {
              background: 'rgba(12, 18, 32, 0.95)',
              border: '1px solid rgba(45, 212, 191, 0.25)',
            },
          },
          error: {
            iconTheme: { primary: '#f87171', secondary: '#fff' },
            style: {
              background: 'rgba(12, 18, 32, 0.95)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
