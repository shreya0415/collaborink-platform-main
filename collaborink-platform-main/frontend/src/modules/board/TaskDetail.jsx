import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X, Trash2, Loader, Calendar, User, MessageSquare,
  Paperclip, Activity, Send,
} from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import FileUpload from '../../components/FileUpload';
import toast from 'react-hot-toast';
import { on, off } from '../../services/socket';

const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'];
const STATUS_OPTIONS   = ['todo', 'in-progress', 'review', 'done'];

const TABS = [
  { key: 'details',     label: 'Details',     icon: User         },
  { key: 'comments',    label: 'Comments',    icon: MessageSquare },
  { key: 'attachments', label: 'Attachments', icon: Paperclip     },
  { key: 'activity',    label: 'Activity',    icon: Activity      },
];

const ACTIVITY_LABELS = {
  task_created: 'created this task',
  task_updated: 'updated this task',
  task_moved:   'moved this task',
  comment_added:'added a comment',
  task_deleted: 'deleted this task',
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
  'linear-gradient(135deg, #2dd4bf 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #f472b6 0%, #a855f7 100%)',
  'linear-gradient(135deg, #fb923c 0%, #f59e0b 100%)',
];

const MODAL_BACKDROP = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.16 } },
};

const MODAL_PANEL = {
  hidden:  { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: 8,  scale: 0.98,
    transition: { duration: 0.18 } },
};

/* ─── Comment item ─── */
function CommentItem({ comment, currentUserId, onDelete }) {
  const isOwn  = (comment.author?._id || comment.author) === currentUserId;
  const author = comment.author || {};
  const initials = `${author.firstName?.[0] || ''}${author.lastName?.[0] || ''}`.toUpperCase();

  return (
    <div className="flex gap-3">
      <span
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold mt-0.5"
        style={{ background: AVATAR_GRADIENTS[0], color: '#042f2e' }}
      >
        {initials || '?'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-sm font-semibold text-slate-200">
            {author.firstName} {author.lastName}
          </span>
          <span className="text-[11px] text-slate-600">
            {new Date(comment.createdAt).toLocaleString()}
          </span>
        </div>
        {comment.isDeleted ? (
          <p className="text-sm text-slate-700 italic">Comment deleted</p>
        ) : (
          <p className="text-sm text-slate-300 break-words leading-relaxed">{comment.content}</p>
        )}
        {isOwn && !comment.isDeleted && (
          <button
            onClick={() => onDelete(comment._id)}
            className="text-xs text-slate-700 hover:text-rose-400 transition-colors mt-1"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export default function TaskDetail({
  taskId, projectId, workspaceId, projectMembers = [],
  onClose, onUpdated, onDeleted,
}) {
  const { user } = useAuthStore();

  const [task,    setTask]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [deleting,setDeleting]= useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({});
  const [tab,  setTab]  = useState('details');

  const [comments,      setComments]      = useState([]);
  const [commentInput,  setCommentInput]  = useState('');
  const [sendingComment,setSendingComment]= useState(false);

  const [attachments,        setAttachments]        = useState([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);

  const [activityLog,    setActivityLog]    = useState([]);
  const [loadingActivity,setLoadingActivity]= useState(false);

  const commentsEndRef = useRef(null);

  /* Close on Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    setLoading(true);
    api.get(`/tasks/${taskId}`)
      .then(r => {
        setTask(r.data);
        setForm({
          title:       r.data.title       || '',
          description: r.data.description || '',
          priority:    r.data.priority    || 'medium',
          status:      r.data.status      || 'todo',
          dueDate:     r.data.dueDate ? r.data.dueDate.slice(0, 10) : '',
          assignee:    r.data.assignee?._id || r.data.assignee || '',
        });
      })
      .catch(() => { toast.error('Failed to load task'); onClose(); })
      .finally(() => setLoading(false));
  }, [taskId]);

  useEffect(() => {
    if (tab === 'comments')    fetchComments();
    if (tab === 'attachments') fetchAttachments();
    if (tab === 'activity')    fetchActivity();
  }, [tab]);

  useEffect(() => {
    on('comment:added', handleIncomingComment);
    return () => off('comment:added', handleIncomingComment);
  }, [taskId]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleIncomingComment = (data) => {
    if (data.task === taskId || data.taskId === taskId) {
      setComments(prev => [...prev, data]);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await api.get(`/comments/tasks/${taskId}`);
      setComments(Array.isArray(res.data) ? res.data : res.data.comments || []);
    } catch {
      toast.error('Failed to load comments');
    }
  };

  const fetchAttachments = async () => {
    if (!task?.attachments?.length) { setAttachments([]); return; }
    setLoadingAttachments(true);
    try {
      const res   = await api.get(`/files?projectId=${projectId}`);
      const files = Array.isArray(res.data) ? res.data : res.data.files || [];
      const attached = files.filter(f =>
        task.attachments?.includes(f._id) ||
        task.attachments?.some(a => (a._id || a) === f._id)
      );
      setAttachments(attached);
    } catch {
      toast.error('Failed to load attachments');
    } finally {
      setLoadingAttachments(false);
    }
  };

  const fetchActivity = async () => {
    setLoadingActivity(true);
    try {
      const res = await api.get(`/tasks/${taskId}/activities`);
      setActivityLog(Array.isArray(res.data) ? res.data : res.data.activities || []);
    } catch {
      toast.error('Failed to load activity');
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (!payload.dueDate)  delete payload.dueDate;
      if (!payload.assignee) delete payload.assignee;
      const r = await api.put(`/tasks/${taskId}`, payload);
      setTask(r.data);
      toast.success('Task saved');
      onUpdated?.(r.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await api.delete(`/tasks/${taskId}`);
      toast.success('Task deleted');
      onDeleted?.(taskId);
      onClose();
    } catch {
      toast.error('Delete failed');
      setDeleting(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || sendingComment) return;
    setSendingComment(true);
    try {
      const res = await api.post(`/comments/tasks/${taskId}`, { content: commentInput.trim() });
      setComments(prev => [...prev, res.data]);
      setCommentInput('');
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(prev => prev.map(c => c._id === commentId ? { ...c, isDeleted: true } : c));
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleDeleteAttachment = async (fileId) => {
    try {
      await api.delete(`/files/${fileId}`);
      setAttachments(prev => prev.filter(f => f._id !== fileId));
      toast.success('Attachment removed');
    } catch {
      toast.error('Failed to remove attachment');
    }
  };

  const handleUploaded = (uploaded) => {
    setAttachments(prev => [...prev, ...uploaded]);
    setTask(prev => prev ? {
      ...prev,
      attachments: [...(prev.attachments || []), ...uploaded.map(f => f._id)],
    } : prev);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="task-detail-backdrop"
        variants={MODAL_BACKDROP}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(4,8,16,.78)', backdropFilter: 'blur(10px)' }}
        onClick={onClose}
      >
        <motion.div
          variants={MODAL_PANEL}
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl"
          style={{
            background: 'rgba(7,11,22,.97)',
            border: '1px solid rgba(71,85,105,.4)',
            boxShadow: '0 0 0 1px rgba(255,255,255,.04) inset, 0 40px 80px -24px rgba(0,0,0,.95), 0 0 60px -20px rgba(45,212,191,.06)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Top accent */}
          <div
            className="h-px w-full flex-shrink-0"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(45,212,191,.5), rgba(99,102,241,.3), transparent)' }}
          />

          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(71,85,105,.25)' }}
          >
            <h3 className="font-semibold text-white text-[15px] truncate pr-4">
              {task?.title || 'Task Detail'}
            </h3>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="icon-button h-8 w-8 flex-shrink-0"
              aria-label="Close"
            >
              <X size={17} />
            </motion.button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3">
              <motion.div
                className="h-5 w-5 rounded-full border-2 border-teal-500/20 border-t-teal-400"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
              <span className="text-xs text-slate-500">Loading…</span>
            </div>
          ) : (
            <>
              {/* Tab strip with sliding indicator */}
              <div
                className="relative flex px-6 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(71,85,105,.25)' }}
              >
                {TABS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className="relative flex items-center gap-1.5 text-sm py-3 px-3 transition-colors -mb-px"
                    style={{ color: tab === key ? '#5eead4' : '#64748b' }}
                  >
                    {tab === key && (
                      <motion.span
                        layoutId="task-detail-tab"
                        className="absolute bottom-0 inset-x-0 h-[2px] rounded-t-full"
                        style={{ background: 'linear-gradient(90deg, #2dd4bf, #6366f1)' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto">
                {/* DETAILS */}
                {tab === 'details' && (
                  <div className="p-6 space-y-5">
                    <div>
                      <label className="label">Title</label>
                      <input
                        value={form.title}
                        onChange={e => handleChange('title', e.target.value)}
                        className="control w-full"
                      />
                    </div>

                    <div>
                      <label className="label">Description</label>
                      <textarea
                        value={form.description}
                        onChange={e => handleChange('description', e.target.value)}
                        rows={3}
                        placeholder="Add a description…"
                        className="control w-full resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Priority</label>
                        <select
                          value={form.priority}
                          onChange={e => handleChange('priority', e.target.value)}
                          className="control w-full"
                        >
                          {PRIORITY_OPTIONS.map(p => (
                            <option key={p} value={p} className="bg-slate-900 capitalize">
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">Status</label>
                        <select
                          value={form.status}
                          onChange={e => handleChange('status', e.target.value)}
                          className="control w-full"
                        >
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s} className="bg-slate-900">
                              {s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Due Date</label>
                        <div className="relative">
                          <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                          <input
                            type="date"
                            value={form.dueDate}
                            onChange={e => handleChange('dueDate', e.target.value)}
                            className="control w-full pl-8"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="label">Assignee</label>
                        <div className="relative">
                          <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                          <select
                            value={form.assignee}
                            onChange={e => handleChange('assignee', e.target.value)}
                            className="control w-full pl-8"
                          >
                            <option value="">Unassigned</option>
                            {projectMembers.map(m => {
                              const u = m.user || m;
                              return (
                                <option key={u._id} value={u._id} className="bg-slate-900">
                                  {u.firstName} {u.lastName}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    </div>

                    {task && (
                      <p className="text-xs text-slate-600 pt-2" style={{ borderTop: '1px solid rgba(71,85,105,.2)' }}>
                        Created {new Date(task.createdAt).toLocaleDateString()}
                        {task.createdBy && ` by ${task.createdBy.firstName} ${task.createdBy.lastName}`}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl transition-all ${
                            confirmDelete
                              ? 'btn-danger'
                              : 'text-rose-400 hover:text-rose-300 hover:bg-rose-400/8'
                          }`}
                        >
                          {deleting
                            ? <Loader size={14} className="animate-spin" />
                            : <Trash2 size={14} />
                          }
                          {confirmDelete ? 'Confirm Delete' : 'Delete'}
                        </button>
                        {confirmDelete && (
                          <button
                            onClick={() => setConfirmDelete(false)}
                            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary flex items-center gap-2 disabled:opacity-40"
                      >
                        {saving && <Loader size={14} className="animate-spin" />}
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {/* COMMENTS */}
                {tab === 'comments' && (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                      {comments.length === 0 ? (
                        <div className="text-center py-10">
                          <MessageSquare size={28} className="mx-auto mb-2" style={{ color: 'rgba(71,85,105,.5)' }} />
                          <p className="text-sm text-slate-600">No comments yet</p>
                        </div>
                      ) : (
                        comments.map(c => (
                          <CommentItem
                            key={c._id}
                            comment={c}
                            currentUserId={user?._id}
                            onDelete={handleDeleteComment}
                          />
                        ))
                      )}
                      <div ref={commentsEndRef} />
                    </div>

                    <form
                      onSubmit={handleSendComment}
                      className="flex gap-3 px-6 py-4 flex-shrink-0"
                      style={{ borderTop: '1px solid rgba(71,85,105,.25)' }}
                    >
                      <input
                        value={commentInput}
                        onChange={e => setCommentInput(e.target.value)}
                        placeholder="Write a comment…"
                        className="control flex-1 text-sm"
                      />
                      <button
                        type="submit"
                        disabled={!commentInput.trim() || sendingComment}
                        className="btn-primary px-3 disabled:opacity-40"
                        aria-label="Send comment"
                      >
                        {sendingComment
                          ? <Loader size={15} className="animate-spin" />
                          : <Send size={15} />
                        }
                      </button>
                    </form>
                  </div>
                )}

                {/* ATTACHMENTS */}
                {tab === 'attachments' && (
                  <div className="p-6 space-y-4">
                    <FileUpload
                      workspaceId={workspaceId}
                      projectId={projectId}
                      taskId={taskId}
                      onUploaded={handleUploaded}
                    />
                    {loadingAttachments ? (
                      <div className="flex justify-center py-4">
                        <motion.div
                          className="h-5 w-5 rounded-full border-2 border-teal-500/20 border-t-teal-400"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        />
                      </div>
                    ) : attachments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                          Attached Files
                        </p>
                        {attachments.map(f => (
                          <div
                            key={f._id}
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                            style={{
                              background: 'rgba(15,23,42,.6)',
                              border: '1px solid rgba(71,85,105,.3)',
                            }}
                          >
                            <Paperclip size={13} className="text-slate-500 flex-shrink-0" />
                            <span className="text-sm text-slate-200 flex-1 truncate">
                              {f.originalName || f.filename}
                            </span>
                            <span className="text-xs text-slate-600 flex-shrink-0">
                              {f.size ? `${(f.size / 1024).toFixed(0)} KB` : ''}
                            </span>
                            <a
                              href={f.url || `/uploads/${f.filename}`}
                              download
                              className="text-xs text-teal-400 hover:text-teal-300 transition-colors flex-shrink-0"
                            >
                              Download
                            </a>
                            <button
                              onClick={() => handleDeleteAttachment(f._id)}
                              className="text-slate-600 hover:text-rose-400 transition-colors flex-shrink-0"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ACTIVITY */}
                {tab === 'activity' && (
                  <div className="p-6 space-y-3">
                    {loadingActivity ? (
                      <div className="flex justify-center py-8">
                        <motion.div
                          className="h-5 w-5 rounded-full border-2 border-teal-500/20 border-t-teal-400"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        />
                      </div>
                    ) : activityLog.length === 0 ? (
                      <div className="text-center py-10">
                        <Activity size={28} className="mx-auto mb-2" style={{ color: 'rgba(71,85,105,.5)' }} />
                        <p className="text-sm text-slate-600">No activity yet</p>
                      </div>
                    ) : (
                      activityLog.map(a => {
                        const u    = a.user || {};
                        const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Someone';
                        return (
                          <div key={a._id} className="flex items-start gap-3">
                            <span
                              className="grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold flex-shrink-0 mt-0.5"
                              style={{ background: AVATAR_GRADIENTS[1], color: '#042f2e' }}
                            >
                              {name[0]}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-300">
                                <span className="font-medium text-slate-100">{name}</span>
                                {' '}{ACTIVITY_LABELS[a.type] || a.type}
                              </p>
                              {a.description && (
                                <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>
                              )}
                              <p className="text-[11px] text-slate-700 mt-0.5">
                                {new Date(a.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
