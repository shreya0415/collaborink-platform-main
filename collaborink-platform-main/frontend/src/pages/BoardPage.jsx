import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings } from 'lucide-react';
import Layout from '../layouts/Layout';
import KanbanBoard from '../modules/board/KanbanBoard';
import api from '../services/api';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
  'linear-gradient(135deg, #2dd4bf 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #f472b6 0%, #a855f7 100%)',
  'linear-gradient(135deg, #fb923c 0%, #f59e0b 100%)',
];

export default function BoardPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/projects/${projectId}`)
      .then(r => setProject(r.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full gap-3">
          <div
            className="grid h-10 w-10 place-items-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #2dd4bf 0%, #06b6d4 100%)' }}
          >
            <motion.div
              className="h-5 w-5 rounded-full border-2 border-white/25 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase">Loading board…</p>
        </div>
      </Layout>
    );
  }

  const members = project?.members || [];

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Board header */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link to="/dashboard" className="icon-button flex-shrink-0" aria-label="Back to dashboard">
              <ArrowLeft size={18} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-[17px] font-semibold tracking-tight text-white truncate">
                {project?.name}
              </h1>
              {project?.description && (
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">
                  {project.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            {members.length > 0 && (
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {members.slice(0, 4).map((m, i) => {
                    const u = m.user || m;
                    const initials = `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase();
                    return (
                      <span
                        key={u._id || i}
                        title={`${u.firstName} ${u.lastName}`}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-bold overflow-hidden"
                        style={{
                          background: AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length],
                          color: '#042f2e',
                          boxShadow: '0 0 0 2px rgba(7,11,22,1)',
                        }}
                      >
                        {u.avatar
                          ? <img src={u.avatar} alt={initials} className="h-full w-full object-cover" />
                          : initials
                        }
                      </span>
                    );
                  })}
                </div>
                {members.length > 4 && (
                  <span
                    className="ml-2 text-[11px] text-slate-400 font-medium px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(30,41,59,.7)', border: '1px solid rgba(71,85,105,.4)' }}
                  >
                    +{members.length - 4}
                  </span>
                )}
              </div>
            )}

            <div className="h-5 w-px" style={{ background: 'rgba(71,85,105,.4)' }} />

            <button className="icon-button" aria-label="Project settings">
              <Settings size={17} />
            </button>
          </div>
        </div>

        {/* Kanban board */}
        <div className="flex-1 overflow-hidden">
          <KanbanBoard projectId={projectId} />
        </div>
      </div>
    </Layout>
  );
}
