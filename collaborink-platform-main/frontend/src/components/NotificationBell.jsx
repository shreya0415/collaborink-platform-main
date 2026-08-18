import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/notificationStore';
import { on, off } from '../services/socket';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState([]);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const { unreadCount, fetchUnreadCount, fetchNotifications, markAllAsRead, addNotification } = useNotificationStore();

  useEffect(() => {
    fetchUnreadCount();
    on('notification:new', (data) => {
      addNotification(data);
    });
    return () => off('notification:new');
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications({ page: 1 }).then(data => setPreview(data?.notifications?.slice(0, 5) || []));
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const handleMarkAll = async () => {
    await markAllAsRead();
    setPreview(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClick = (n) => {
    if (n.link) navigate(n.link);
    setOpen(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 text-gray-400 hover:text-white transition rounded-lg hover:bg-gray-700"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <h3 className="font-semibold text-white text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {preview.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No notifications</p>
            ) : (
              preview.map(n => (
                <div
                  key={n._id}
                  onClick={() => handleClick(n)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-750 transition border-b border-gray-700/50 ${
                    !n.isRead ? 'bg-gray-750' : ''
                  }`}
                >
                  {!n.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                  )}
                  <div className={!n.isRead ? '' : 'ml-5'}>
                    <p className="text-sm text-white leading-snug">{n.title || n.type}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{n.message}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-gray-700">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-blue-400 hover:text-blue-300 py-1 transition"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
