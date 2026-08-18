import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  File, FileText, Image, Film, Music, Archive,
  Download, Trash2, Upload, Loader, FolderOpen,
} from 'lucide-react';
import Layout from '../layouts/Layout';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';

const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

const FILE_TYPE_META = {
  image: { icon: Image,    color: '#5eead4', bg: 'rgba(45,212,191,.1)'  },
  video: { icon: Film,     color: '#a5b4fc', bg: 'rgba(99,102,241,.1)'  },
  audio: { icon: Music,    color: '#fdba74', bg: 'rgba(251,146,60,.1)'  },
  doc:   { icon: FileText, color: '#fde047', bg: 'rgba(234,179,8,.1)'   },
  zip:   { icon: Archive,  color: '#c4b5fd', bg: 'rgba(139,92,246,.1)'  },
  other: { icon: File,     color: '#94a3b8', bg: 'rgba(71,85,105,.15)'  },
};

function getFileMeta(mimeType = '') {
  if (mimeType.startsWith('image/'))                                              return FILE_TYPE_META.image;
  if (mimeType.startsWith('video/'))                                              return FILE_TYPE_META.video;
  if (mimeType.startsWith('audio/'))                                              return FILE_TYPE_META.audio;
  if (mimeType.includes('pdf') || mimeType.includes('text'))                     return FILE_TYPE_META.doc;
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('rar')) return FILE_TYPE_META.zip;
  return FILE_TYPE_META.other;
}

function humanSize(bytes = 0) {
  if (bytes < 1024)            return `${bytes} B`;
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ROW_VARIANTS = {
  hidden:  { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export default function FilesPage() {
  const { workspaces, fetchWorkspaces } = useWorkspaceStore();
  const { user }                        = useAuthStore();
  const [selectedWsId, setSelectedWsId] = useState('');
  const [files,       setFiles]         = useState([]);
  const [loading,     setLoading]       = useState(false);
  const [uploading,   setUploading]     = useState(false);
  const [page,        setPage]          = useState(1);
  const [totalPages,  setTotalPages]    = useState(1);

  useEffect(() => { fetchWorkspaces(); }, []);

  useEffect(() => {
    if (workspaces.length > 0 && !selectedWsId) {
      setSelectedWsId(workspaces[0]._id);
    }
  }, [workspaces]);

  const fetchFiles = useCallback(async (wsId, pg = 1) => {
    if (!wsId) return;
    setLoading(true);
    try {
      const res = await api.get(`/files?workspaceId=${wsId}&page=${pg}&limit=25`);
      setFiles(res.data.files || []);
      setTotalPages(res.data.totalPages || 1);
      setPage(pg);
    } catch {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFiles(selectedWsId, 1); }, [selectedWsId]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedWsId) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10 MB)'); return; }

    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    form.append('workspace', selectedWsId);
    try {
      await api.post('/files', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('File uploaded');
      fetchFiles(selectedWsId, page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (fileId) => {
    if (!confirm('Delete this file?')) return;
    try {
      await api.delete(`/files/${fileId}`);
      setFiles(prev => prev.filter(f => f._id !== fileId));
      toast.success('File deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <Layout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-teal-400/75 mb-1">Workspace</p>
            <h1 className="text-[17px] font-semibold tracking-tight text-white">Files</h1>
          </div>

          <label
            className={`btn-primary flex items-center gap-2 cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {uploading
              ? <Loader size={15} className="animate-spin" />
              : <Upload size={15} />
            }
            Upload File
            <input
              type="file"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading || !selectedWsId}
            />
          </label>
        </div>

        {/* Workspace selector */}
        {workspaces.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {workspaces.map(ws => (
              <button
                key={ws._id}
                onClick={() => setSelectedWsId(ws._id)}
                className="px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors"
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
              </button>
            ))}
          </div>
        )}

        {/* File list */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3">
            <motion.div
              className="h-5 w-5 rounded-full border-2 border-teal-500/20 border-t-teal-400"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
            <span className="text-xs text-slate-500">Loading files…</span>
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <FolderOpen size={48} style={{ color: 'rgba(71,85,105,.4)' }} />
            </motion.div>
            <p className="text-sm text-slate-600 mt-3">No files yet. Upload one to get started.</p>
          </div>
        ) : (
          <>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(7,11,22,.6)',
                border: '1px solid rgba(71,85,105,.3)',
                backdropFilter: 'blur(12px)',
              }}
            >
              {/* Table header */}
              <div
                className="grid grid-cols-12 gap-4 px-5 py-3"
                style={{ borderBottom: '1px solid rgba(71,85,105,.25)' }}
              >
                {['Name', 'Size', 'Uploaded by', 'Date', ''].map((h, i) => (
                  <div
                    key={i}
                    className={`text-[10px] font-semibold text-slate-600 uppercase tracking-widest ${
                      i === 0 ? 'col-span-5' : i === 4 ? 'col-span-1' : 'col-span-2'
                    }`}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {/* Rows */}
              <AnimatePresence>
                {files.map((file, idx) => {
                  const meta    = getFileMeta(file.mimeType);
                  const Icon    = meta.icon;
                  const isOwner = file.uploadedBy?._id === user?._id || file.uploadedBy === user?._id;
                  const isLast  = idx === files.length - 1;

                  return (
                    <motion.div
                      key={file._id}
                      variants={ROW_VARIANTS}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, x: -10 }}
                      className="grid grid-cols-12 gap-4 px-5 py-3 items-center transition-colors"
                      style={{ borderBottom: isLast ? 'none' : '1px solid rgba(71,85,105,.15)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(30,41,59,.4)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Name */}
                      <div className="col-span-5 flex items-center gap-3 min-w-0">
                        <span
                          className="grid h-8 w-8 place-items-center rounded-lg flex-shrink-0"
                          style={{ background: meta.bg }}
                        >
                          <Icon size={16} style={{ color: meta.color }} />
                        </span>
                        <span className="text-sm text-slate-200 truncate">
                          {file.originalName || file.filename}
                        </span>
                      </div>

                      <div className="col-span-2 text-sm text-slate-500">{humanSize(file.size)}</div>

                      <div className="col-span-2 text-sm text-slate-500 truncate">
                        {file.uploadedBy?.firstName} {file.uploadedBy?.lastName}
                      </div>

                      <div className="col-span-2 text-sm text-slate-500">
                        {new Date(file.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>

                      <div className="col-span-1 flex items-center justify-end gap-1">
                        <a
                          href={`${BACKEND}/api/files/${file._id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="icon-button h-7 w-7 text-slate-600 hover:text-teal-400"
                          title="Download"
                        >
                          <Download size={14} />
                        </a>
                        {isOwner && (
                          <button
                            onClick={() => handleDelete(file._id)}
                            className="icon-button h-7 w-7 text-slate-600 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => fetchFiles(selectedWsId, page - 1)}
                  className="px-4 py-1.5 text-sm rounded-xl transition-colors disabled:opacity-40 text-slate-400 hover:text-slate-200"
                  style={{ background: 'rgba(15,23,42,.6)', border: '1px solid rgba(71,85,105,.4)' }}
                >
                  Previous
                </button>
                <span className="text-sm text-slate-500">{page} / {totalPages}</span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => fetchFiles(selectedWsId, page + 1)}
                  className="px-4 py-1.5 text-sm rounded-xl transition-colors disabled:opacity-40 text-slate-400 hover:text-slate-200"
                  style={{ background: 'rgba(15,23,42,.6)', border: '1px solid rgba(71,85,105,.4)' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
