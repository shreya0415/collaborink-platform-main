import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2, Loader } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import Layout from '../layouts/Layout';

const TYPE_LABELS = {
  task_assigned:    'Task Assigned',
  task_updated:     'Task Updated',
  comment_added:    'Comment Added',
  workspace_invite: 'Workspace Invite',
  mention:          'Mention',
  reminder:         'Reminder',
};

const TYPE_COLORS = {
  task_assigned:    { bg: 'rgba(45,212,191,.1)',  text: '#5eead4', border: 'rgba(45,212,191,.25)'  },
  task_updated:     { bg: 'rgba(99,102,241,.1)',  text: '#a5b4fc', border: 'rgba(99,102,241,.25)'  },
  comment_added:    { bg: 'rgba(251,146,60,.1)',  text: '#fdba74', border: 'rgba(251,146,60,.25)'  },
  workspace_invite: { bg: 'rgba(244,63,94,.1)',   text: '#fb7185', border: 'rgba(244,63,94,.25)'   },
  mention:          { bg: 'rgba(234,179,8,.1)',   text: '#fde047', border: 'rgba(234,179,8,.25)'   },
  reminder:         { bg: 'rgba(139,92,246,.1)',  text: '#c4b5fd', border: 'rgba(139,92,246,.25)'  },
};

const TABS = [
  { key: '',              label: 'All'      },
  { key: 'unread',        label: 'Unread'   },
  { key: 'task_assigned', label: 'Tasks'    },
  { key: 'comment_added', label: 'Comments' },
];

const LIST_VARIANTS = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.04 } },
};
const ROW_VARIANTS = {
  hidden:  { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22 } },
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('');
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);

  const {
    notifications, unreadCount, isLoading,
    fetchNotifications, markAsRead, markAllAsRead, deleteNotification,
  } = useNotificationStore();

  const PAGE_SIZE  = 25;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => { loadPage(1); }, [activeTab]);

  const loadPage = async (p) => {
    setPage(p);
    const isUnreadTab = activeTab === 'unread';
    const typeFilter  = !isUnreadTab && activeTab ? activeTab : '';
    const data = await fetchNotifications({ page: p, unread: isUnreadTab, type: typeFilter }).catch(() => null);
    if (data) setTotal(data.total || 0);
  };

  const handleMarkAll = () => markAllAsRead();
  const handleDelete  = (id) => deleteNotification(id);
  const handleRead    = (n) => { if (!n.isRead) markAsRead(n._id); };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(45,212,191,.15) 0%, rgba(99,102,241,.1) 100%)', border: '1px solid rgba(45,212,191,.2)' }}
            >
              <Bell size={16} className="text-teal-400" />
            </span>
            <div>
              <h1 className="text-[17px] font-semibold text-white tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-[11px] text-slate-500 mt-0.5">{unreadCount} unread</p>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <motion.button
              onClick={handleMarkAll}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300 transition-colors"
            >
              <CheckCheck size={15} />
              Mark all read
            </motion.button>
          )}
        </div>

        {/* Tab strip */}
        <div
          className="flex gap-1 mb-4 p-1 rounded-xl"
          style={{ background: 'rgba(7,11,22,.6)', border: '1px solid rgba(71,85,105,.3)' }}
        >
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="relative flex-1 text-sm py-1.5 rounded-lg transition-colors font-medium z-[1]"
              style={{ color: activeTab === tab.key ? '#fff' : '#64748b' }}
            >
              {activeTab === tab.key && (
                <motion.span
                  layoutId="notif-tab-pill"
                  className="absolute inset-0 rounded-lg z-[-1]"
                  style={{ background: 'rgba(45,212,191,.12)', border: '1px solid rgba(45,212,191,.2)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(7,11,22,.6)',
            border: '1px solid rgba(71,85,105,.3)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <motion.div
                className="h-5 w-5 rounded-full border-2 border-teal-500/20 border-t-teal-400"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
              <span className="text-xs text-slate-500">Loading…</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell size={36} className="mx-auto mb-3" style={{ color: 'rgba(71,85,105,.4)' }} />
              <p className="text-sm text-slate-600">No notifications</p>
            </div>
          ) : (
            <motion.div variants={LIST_VARIANTS} initial="hidden" animate="visible">
              {notifications.map((n, i) => {
                const meta  = TYPE_COLORS[n.type] || TYPE_COLORS.task_updated;
                const isLast = i === notifications.length - 1;
                return (
                  <motion.div
                    key={n._id}
                    variants={ROW_VARIANTS}
                    onClick={() => handleRead(n)}
                    className="flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors"
                    style={{
                      background: !n.isRead ? 'rgba(45,212,191,.03)' : 'transparent',
                      borderBottom: isLast ? 'none' : '1px solid rgba(71,85,105,.18)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,41,59,.4)'}
                    onMouseLeave={e => e.currentTarget.style.background = !n.isRead ? 'rgba(45,212,191,.03)' : 'transparent'}
                  >
                    {/* Unread dot */}
                    <div className="flex-shrink-0 mt-[7px]">
                      {!n.isRead ? (
                        <span
                          className="block h-2 w-2 rounded-full"
                          style={{ background: '#2dd4bf', boxShadow: '0 0 6px rgba(45,212,191,.6)' }}
                        />
                      ) : (
                        <span className="block h-2 w-2" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-medium text-slate-200 leading-snug">
                          {n.title || TYPE_LABELS[n.type] || n.type}
                        </p>
                        {n.type && (
                          <span
                            className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0"
                            style={{ background: meta.bg, color: meta.text, border: `1px solid ${meta.border}` }}
                          >
                            {TYPE_LABELS[n.type] || n.type}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 line-clamp-2">{n.message}</p>
                      <p className="text-[11px] text-slate-700 mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(n._id); }}
                      className="flex-shrink-0 p-1.5 text-slate-700 hover:text-rose-400 transition-colors rounded-lg"
                    >
                      <Trash2 size={13} />
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              disabled={page <= 1}
              onClick={() => loadPage(page - 1)}
              className="px-4 py-1.5 text-sm rounded-xl transition-colors disabled:opacity-40 text-slate-400 hover:text-slate-200"
              style={{ background: 'rgba(15,23,42,.6)', border: '1px solid rgba(71,85,105,.4)' }}
            >
              Previous
            </button>
            <span className="text-sm text-slate-500">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => loadPage(page + 1)}
              className="px-4 py-1.5 text-sm rounded-xl transition-colors disabled:opacity-40 text-slate-400 hover:text-slate-200"
              style={{ background: 'rgba(15,23,42,.6)', border: '1px solid rgba(71,85,105,.4)' }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
