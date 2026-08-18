import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader } from 'lucide-react';
import Layout from '../layouts/Layout';
import ChatPanel from '../modules/chat/ChatPanel';
import { useWorkspaceStore } from '../store/workspaceStore';

export default function ChatPage() {
  const { workspaces, fetchWorkspaces } = useWorkspaceStore();
  const [selectedWsId, setSelectedWsId] = useState('');
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    fetchWorkspaces().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (workspaces.length > 0 && !selectedWsId) {
      setSelectedWsId(workspaces[0]._id);
    }
  }, [workspaces]);

  return (
    <Layout>
      <div className="flex flex-col h-full -m-4 sm:-m-6 lg:-m-8">
        {/* Workspace selector */}
        {workspaces.length > 1 && (
          <div
            className="flex gap-2 px-6 pt-4 pb-3 flex-shrink-0 overflow-x-auto"
            style={{ borderBottom: '1px solid rgba(71,85,105,.25)' }}
          >
            {workspaces.map(ws => (
              <motion.button
                key={ws._id}
                onClick={() => setSelectedWsId(ws._id)}
                whileTap={{ scale: 0.97 }}
                className="px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors"
                style={selectedWsId === ws._id ? {
                  background: 'rgba(45,212,191,.12)',
                  border: '1px solid rgba(45,212,191,.3)',
                  color: '#5eead4',
                } : {
                  background: 'rgba(15,23,42,.6)',
                  border: '1px solid rgba(71,85,105,.4)',
                  color: '#94a3b8',
                }}
              >
                {ws.name}
              </motion.button>
            ))}
          </div>
        )}

        {/* Chat panel */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full gap-3">
              <motion.div
                className="h-5 w-5 rounded-full border-2 border-teal-500/20 border-t-teal-400"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
              <span className="text-xs text-slate-500">Connecting…</span>
            </div>
          ) : selectedWsId ? (
            <ChatPanel workspaceId={selectedWsId} />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-slate-600">No workspaces found. Create one from the Dashboard.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
