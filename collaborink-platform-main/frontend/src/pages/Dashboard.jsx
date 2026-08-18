import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus, Users, FolderOpen, Copy, Check,
  Loader, X, ArrowUpRight, Boxes, Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore }      from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useProjectStore }   from '../store/projectStore';
import Layout from '../layouts/Layout';

/* ═══════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════ */
const FADE_UP = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  }),
};

const GRID = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const CARD_ANIM = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
};

/* ═══════════════════════════════════════════════════
   STATUS COLOURS
   ═══════════════════════════════════════════════════ */
const STATUS = {
  active:    { bar: 'linear-gradient(90deg,#2dd4bf,#6366f1)', badge: 'badge-teal',   dot: '#2dd4bf' },
  completed: { bar: 'linear-gradient(90deg,#6366f1,#8b5cf6)', badge: 'badge-indigo', dot: '#6366f1' },
  planning:  { bar: 'linear-gradient(90deg,#f59e0b,#f97316)', badge: 'badge-amber',  dot: '#f59e0b' },
};
const DEFAULT_STATUS = { bar: 'linear-gradient(90deg,#334155,#475569)', badge: 'badge-slate', dot: '#475569' };
const getStatus = (s) => STATUS[s] || DEFAULT_STATUS;

/* ═══════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════ */
function StatCard({ icon: Icon, label, value, gradient, delay }) {
  return (
    <motion.div
      custom={delay}
      variants={FADE_UP}
      initial="hidden"
      animate="visible"
      className="surface rounded-2xl p-5 flex items-center gap-4 overflow-hidden relative"
    >
      {/* Glow blob */}
      <div
        className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-30 pointer-events-none"
        style={{ background: gradient, filter: 'blur(20px)' }}
      />
      {/* Icon bubble */}
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
        style={{ background: gradient, boxShadow: '0 6px 18px -4px rgba(0,0,0,.5)' }}
      >
        <Icon size={18} color="#fff" />
      </span>
      <div className="min-w-0">
        <AnimatePresence mode="wait">
          <motion.p
            key={value}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="text-2xl font-bold text-white leading-none"
          >
            {value}
          </motion.p>
        </AnimatePresence>
        <p className="mt-1 text-xs text-slate-500 font-medium">{label}</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   SKELETON CARD  (project loading placeholder)
   ═══════════════════════════════════════════════════ */
function SkeletonCard() {
  return (
    <div className="surface rounded-2xl overflow-hidden p-5 space-y-4">
      <div className="skeleton h-3.5 w-1/2" />
      <div className="space-y-2">
        <div className="skeleton h-2.5 w-full" />
        <div className="skeleton h-2.5 w-4/5" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="flex -space-x-2">
          {[0,1,2].map(i => <div key={i} className="skeleton h-7 w-7 rounded-full" />)}
        </div>
        <div className="skeleton h-8 w-24 rounded-xl" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PROJECT CARD
   ═══════════════════════════════════════════════════ */
function ProjectCard({ project }) {
  const { bar, badge, dot } = getStatus(project.status);
  const memberAvatars        = (project.members || []).slice(0, 3);

  /* Avatar gradient pool — cycles through palette */
  const AVATAR_GRADIENTS = [
    'linear-gradient(135deg,#2dd4bf,#6366f1)',
    'linear-gradient(135deg,#818cf8,#2dd4bf)',
    'linear-gradient(135deg,#8b5cf6,#ec4899)',
    'linear-gradient(135deg,#f59e0b,#ef4444)',
  ];

  return (
    <motion.div
      variants={CARD_ANIM}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      className="surface surface-hover rounded-2xl overflow-hidden flex flex-col"
    >
      {/* Status accent bar */}
      <div className="h-[3px] w-full shrink-0" style={{ background: bar }} />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Title + badge */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate leading-snug">{project.name}</h3>
            {project.description && (
              <p className="text-slate-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                {project.description}
              </p>
            )}
          </div>
          <span className={`${badge} shrink-0 mt-0.5 flex items-center gap-1`}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
            {project.status || 'planning'}
          </span>
        </div>

        {/* Footer: avatars + board link */}
        <div className="flex items-center justify-between mt-auto pt-1">
          {/* Member avatars */}
          <div className="flex -space-x-2">
            {memberAvatars.map((m, i) => {
              const user    = m.user || m;
              const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || '?';
              return (
                <div
                  key={i}
                  title={`${user.firstName || ''} ${user.lastName || ''}`.trim()}
                  className="h-7 w-7 rounded-full border-2 grid place-items-center text-[10px] font-bold overflow-hidden"
                  style={{
                    borderColor: 'rgba(7,11,22,1)',
                    background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
                    color: '#fff',
                  }}
                >
                  {user.avatar
                    ? <img src={user.avatar} alt={initials} className="h-full w-full object-cover" />
                    : initials
                  }
                </div>
              );
            })}
            {project.members?.length > 3 && (
              <div
                className="h-7 w-7 rounded-full border-2 grid place-items-center text-[10px] font-medium"
                style={{
                  borderColor: 'rgba(7,11,22,1)',
                  background: 'rgba(30,41,59,.8)',
                  color: '#94a3b8',
                }}
              >
                +{project.members.length - 3}
              </div>
            )}
            {memberAvatars.length === 0 && (
              <span className="text-xs text-slate-600">No members</span>
            )}
          </div>

          {/* View board */}
          <Link
            to={`/board/${project._id}`}
            className="group inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all duration-150"
            style={{
              background: 'rgba(45,212,191,.08)',
              border: '1px solid rgba(45,212,191,.18)',
              color: '#5eead4',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(45,212,191,.18)';
              e.currentTarget.style.borderColor = 'rgba(45,212,191,.35)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(45,212,191,.08)';
              e.currentTarget.style.borderColor = 'rgba(45,212,191,.18)';
            }}
          >
            Open board
            <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   MODAL  (animated, uses AnimatePresence from parent)
   ═══════════════════════════════════════════════════ */
function Modal({ title, onClose, children }) {
  /* Close on Escape */
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(4,8,16,.75)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Panel wrapper — centres without layout shift */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl pointer-events-auto"
          style={{
            background: 'rgba(7,11,22,.97)',
            border: '1px solid rgba(71,85,105,.45)',
            boxShadow:
              '0 0 0 1px rgba(255,255,255,.05) inset, 0 40px 80px -20px rgba(0,0,0,.9), 0 0 40px -12px rgba(45,212,191,.07)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Top accent */}
          <div
            className="h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(45,212,191,.5), transparent)' }}
          />

          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid rgba(71,85,105,.3)' }}
          >
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <motion.button
              onClick={onClose}
              className="icon-button h-8 w-8"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={16} />
            </motion.button>
          </div>

          {/* Content */}
          <div className="px-6 py-5">{children}</div>
        </motion.div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════ */
function EmptyProjects({ onOpen }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center py-20 rounded-2xl"
      style={{
        background: 'rgba(7,11,22,.5)',
        border: '1px dashed rgba(71,85,105,.4)',
      }}
    >
      {/* Animated icon container */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-5"
      >
        <div
          className="grid h-14 w-14 place-items-center rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(45,212,191,.12) 0%, rgba(99,102,241,.08) 100%)',
            border: '1px solid rgba(45,212,191,.2)',
          }}
        >
          <FolderOpen size={24} className="text-teal-400/70" />
        </div>
      </motion.div>
      <p className="text-sm font-medium text-slate-300 mb-1">No projects yet</p>
      <p className="text-xs text-slate-600 mb-5">Create your first project to get started</p>
      <button onClick={onOpen} className="btn-primary text-xs py-2 px-4">
        <Plus size={14} />
        New Project
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export default function Dashboard() {
  const { token }     = useAuthStore();
  const { workspaces, fetchWorkspaces, createWorkspace, isLoading: wsLoading } = useWorkspaceStore();
  const { projects,   fetchProjects,   createProject,  isLoading: projLoading } = useProjectStore();
  const navigate      = useNavigate();

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
  const [copiedCode, setCopiedCode]                   = useState(null);

  /* Modal state */
  const [wsModalOpen,  setWsModalOpen]  = useState(false);
  const [projModalOpen, setProjModalOpen] = useState(false);
  const [wsForm,   setWsForm]   = useState({ name: '', description: '' });
  const [projForm, setProjForm] = useState({ name: '', description: '', workspace: '' });
  const [saving, setSaving]     = useState(false);

  /* ─── Data fetching (unchanged logic) ─── */
  useEffect(() => {
    if (!token) { navigate('/auth'); return; }
    fetchWorkspaces();
  }, [token]);

  useEffect(() => {
    if (workspaces.length > 0 && !selectedWorkspaceId) {
      setSelectedWorkspaceId(workspaces[0]._id);
    }
  }, [workspaces]);

  useEffect(() => {
    if (selectedWorkspaceId) fetchProjects(selectedWorkspaceId);
  }, [selectedWorkspaceId]);

  const selectedWorkspace = workspaces.find(w => w._id === selectedWorkspaceId);

  /* ─── Handlers (unchanged logic) ─── */
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      toast.success('Invite code copied!');
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!wsForm.name.trim()) return;
    setSaving(true);
    try {
      const ws = await createWorkspace(wsForm);
      setSelectedWorkspaceId(ws._id);
      setWsModalOpen(false);
      setWsForm({ name: '', description: '' });
      toast.success('Workspace created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create workspace');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projForm.name.trim() || !projForm.workspace) return;
    setSaving(true);
    try {
      await createProject(projForm);
      setProjModalOpen(false);
      setProjForm({ name: '', description: '', workspace: '' });
      fetchProjects(selectedWorkspaceId);
      toast.success('Project created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSaving(false);
    }
  };

  const openCreateProject = () => {
    setProjForm({ name: '', description: '', workspace: selectedWorkspaceId || '' });
    setProjModalOpen(true);
  };

  const isBootLoading = wsLoading && workspaces.length === 0;

  return (
    <Layout>
      <div className="space-y-8 pb-4">

        {/* ── HEADER ── */}
        <motion.div
          className="flex items-end justify-between gap-4"
          initial="hidden" animate="visible" variants={GRID}
        >
          <motion.div variants={FADE_UP} custom={0}>
            <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-teal-400/80 mb-1.5">
              Team pulse
            </p>
            <h1 className="text-3xl font-bold tracking-tighter text-white leading-tight">
              Make meaningful{' '}
              <span className="gradient-text">progress.</span>
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Keep projects, people, and the next best action in view.
            </p>
          </motion.div>

          <motion.div variants={FADE_UP} custom={1} className="flex-shrink-0">
            <button onClick={() => setWsModalOpen(true)} className="btn-primary">
              <Plus size={15} />
              New Workspace
            </button>
          </motion.div>
        </motion.div>

        {/* ── STATS ROW ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            icon={Building2}
            label="Workspaces"
            value={isBootLoading ? '—' : workspaces.length}
            gradient="linear-gradient(135deg,#6366f1,#8b5cf6)"
            delay={0}
          />
          <StatCard
            icon={FolderOpen}
            label="Projects"
            value={projLoading && projects.length === 0 ? '—' : projects.length}
            gradient="linear-gradient(135deg,#2dd4bf,#06b6d4)"
            delay={1}
          />
          <StatCard
            icon={Users}
            label="Members"
            value={isBootLoading ? '—' : (selectedWorkspace?.members?.length ?? 0)}
            gradient="linear-gradient(135deg,#f59e0b,#ef4444)"
            delay={2}
          />
        </div>

        {/* ── FULL-PAGE LOAD ── */}
        {isBootLoading ? (
          <div className="flex flex-col gap-3">
            <div className="skeleton h-10 w-64 rounded-xl" />
            <div className="skeleton h-32 w-full rounded-2xl" />
            <div className="grid grid-cols-3 gap-4">
              {[0,1,2].map(i => <SkeletonCard key={i} />)}
            </div>
          </div>
        ) : (
          <>
            {/* ── WORKSPACE TABS ── */}
            {workspaces.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="flex gap-1.5 overflow-x-auto pb-1"
              >
                {workspaces.map(ws => {
                  const active = selectedWorkspaceId === ws._id;
                  return (
                    <button
                      key={ws._id}
                      onClick={() => setSelectedWorkspaceId(ws._id)}
                      className="relative px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap outline-none transition-colors focus-ring"
                      style={{ color: active ? '#042f2e' : '#94a3b8' }}
                    >
                      {active && (
                        <motion.span
                          layoutId="ws-tab-bg"
                          className="absolute inset-0 rounded-xl"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                          style={{ background: 'linear-gradient(135deg,#2dd4bf,#14b8a6)' }}
                        />
                      )}
                      <span className="relative z-10">{ws.name}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}

            {/* ── WORKSPACE CARD ── */}
            <AnimatePresence mode="wait">
              {selectedWorkspace && (
                <motion.div
                  key={selectedWorkspace._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="surface relative overflow-hidden rounded-2xl p-6"
                >
                  {/* Aurora decoration */}
                  <div
                    className="absolute -right-14 -top-14 h-44 w-44 rounded-full pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle, rgba(45,212,191,.22) 0%, transparent 70%)',
                      filter: 'blur(28px)',
                    }}
                  />
                  <div
                    className="absolute -left-8 bottom-0 h-28 w-28 rounded-full pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle, rgba(99,102,241,.18) 0%, transparent 70%)',
                      filter: 'blur(24px)',
                    }}
                  />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      {/* Workspace logo + name */}
                      <div className="flex items-center gap-3 mb-3">
                        <span
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold"
                          style={{
                            background: 'linear-gradient(135deg, rgba(99,102,241,.3) 0%, rgba(45,212,191,.2) 100%)',
                            border: '1px solid rgba(99,102,241,.3)',
                            color: '#a5b4fc',
                          }}
                        >
                          {selectedWorkspace.name?.[0]?.toUpperCase() || 'W'}
                        </span>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-teal-400/75 leading-none mb-1">
                            Active workspace
                          </p>
                          <h2 className="text-lg font-semibold tracking-tight text-white leading-none">
                            {selectedWorkspace.name}
                          </h2>
                        </div>
                      </div>

                      {selectedWorkspace.description && (
                        <p className="text-slate-500 text-sm mb-4 max-w-md leading-relaxed">
                          {selectedWorkspace.description}
                        </p>
                      )}

                      {/* Meta row */}
                      <div className="flex items-center gap-5">
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Users size={13} className="text-slate-600" />
                          {selectedWorkspace.members?.length ?? 0}{' '}
                          member{selectedWorkspace.members?.length !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <FolderOpen size={13} className="text-slate-600" />
                          {projects.length} project{projects.length !== 1 ? 's' : ''}
                        </span>
                        {/* Online indicator */}
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ background: '#2dd4bf', boxShadow: '0 0 5px rgba(45,212,191,.6)' }}
                          />
                          Active
                        </span>
                      </div>
                    </div>

                    {/* Invite code */}
                    {selectedWorkspace.inviteCode && (
                      <div className="flex-shrink-0">
                        <p className="text-[10px] font-medium text-slate-600 mb-2 text-right">
                          Invite code
                        </p>
                        <motion.button
                          onClick={() => handleCopyCode(selectedWorkspace.inviteCode)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-300 transition-all"
                          style={{
                            background: 'rgba(7,11,22,.6)',
                            border: copiedCode === selectedWorkspace.inviteCode
                              ? '1px solid rgba(45,212,191,.4)'
                              : '1px solid rgba(71,85,105,.4)',
                          }}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            {copiedCode === selectedWorkspace.inviteCode ? (
                              <motion.span
                                key="check"
                                initial={{ scale: 0, rotate: -90 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Check size={13} className="text-teal-400" />
                              </motion.span>
                            ) : (
                              <motion.span
                                key="copy"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ duration: 0.15 }}
                              >
                                <Copy size={13} className="text-slate-500" />
                              </motion.span>
                            )}
                          </AnimatePresence>
                          {selectedWorkspace.inviteCode}
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── PROJECTS SECTION ── */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-semibold text-white">Projects</h2>
                  {!projLoading && projects.length > 0 && (
                    <p className="text-xs text-slate-600 mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''} in this workspace</p>
                  )}
                </div>
                {selectedWorkspaceId && (
                  <button onClick={openCreateProject} className="btn-secondary text-xs py-2 px-3.5">
                    <Plus size={13} />
                    New Project
                  </button>
                )}
              </div>

              {/* Loading skeleton */}
              {projLoading && projects.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[0,1,2].map(i => <SkeletonCard key={i} />)}
                </div>
              ) : projects.length === 0 ? (
                <EmptyProjects onOpen={openCreateProject} />
              ) : (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  variants={GRID}
                  initial="hidden"
                  animate="visible"
                >
                  {projects.map(project => (
                    <ProjectCard key={project._id} project={project} />
                  ))}
                </motion.div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── MODALS ── */}
      <AnimatePresence>
        {wsModalOpen && (
          <Modal key="ws-modal" title="Create Workspace" onClose={() => setWsModalOpen(false)}>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input
                  autoFocus
                  value={wsForm.name}
                  onChange={e => setWsForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="My Team Workspace"
                  className="control"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={wsForm.description}
                  onChange={e => setWsForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What is this workspace for?"
                  rows={3}
                  className="control resize-none"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-1">
                <button type="button" onClick={() => setWsModalOpen(false)} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={saving || !wsForm.name.trim()} className="btn-primary">
                  {saving && <Loader size={13} className="animate-spin" />}
                  Create workspace
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {projModalOpen && (
          <Modal key="proj-modal" title="Create Project" onClose={() => setProjModalOpen(false)}>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input
                  autoFocus
                  value={projForm.name}
                  onChange={e => setProjForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Project name"
                  className="control"
                />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea
                  value={projForm.description}
                  onChange={e => setProjForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What will this project track?"
                  rows={3}
                  className="control resize-none"
                />
              </div>
              <div>
                <label className="label">Workspace *</label>
                <select
                  value={projForm.workspace}
                  onChange={e => setProjForm(f => ({ ...f, workspace: e.target.value }))}
                  className="control"
                >
                  <option value="">Select a workspace</option>
                  {workspaces.map(ws => (
                    <option key={ws._id} value={ws._id}>{ws.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2.5 pt-1">
                <button type="button" onClick={() => setProjModalOpen(false)} className="btn-ghost">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !projForm.name.trim() || !projForm.workspace}
                  className="btn-primary"
                >
                  {saving && <Loader size={13} className="animate-spin" />}
                  Create project
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </Layout>
  );
}
