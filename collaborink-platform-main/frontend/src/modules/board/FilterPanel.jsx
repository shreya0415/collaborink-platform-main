import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, X, SlidersHorizontal } from 'lucide-react';

const PRIORITIES = ['urgent', 'high', 'medium', 'low'];
const STATUSES   = ['todo', 'in-progress', 'review', 'done'];

const PRIORITY_META = {
  urgent: { color: '#fb7185', bg: 'rgba(244,63,94,.13)',  border: 'rgba(244,63,94,.35)'  },
  high:   { color: '#fdba74', bg: 'rgba(251,146,60,.13)', border: 'rgba(251,146,60,.35)' },
  medium: { color: '#fde047', bg: 'rgba(234,179,8,.13)',  border: 'rgba(234,179,8,.35)'  },
  low:    { color: '#5eead4', bg: 'rgba(45,212,191,.11)', border: 'rgba(45,212,191,.35)' },
};

const PANEL_VARIANTS = {
  hidden:  { opacity: 0, y: -8, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -4, scale: 0.97,
    transition: { duration: 0.14 } },
};

export default function FilterPanel({ members = [], filters, onChange }) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState(filters.q || '');
  const panelRef          = useRef(null);
  const debounceRef       = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange({ ...filters, q: query });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    const handle = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const toggleArray = (key, value) => {
    const arr  = filters[key] || [];
    const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
    onChange({ ...filters, [key]: next });
  };

  const clearAll = () => {
    setQuery('');
    onChange({ q: '', priorities: [], statuses: [], assigneeId: '', dueDateFrom: '', dueDateTo: '' });
  };

  const activeCount = [
    ...(filters.priorities || []),
    ...(filters.statuses   || []),
    filters.assigneeId,
    filters.dueDateFrom,
    filters.dueDateTo,
  ].filter(Boolean).length;

  return (
    <div className="flex items-center gap-2">
      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search tasks…"
          className="control pl-8 pr-8 py-2 text-sm w-48"
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => setQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={12} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Filter toggle */}
      <div className="relative" ref={panelRef}>
        <motion.button
          onClick={() => setOpen(o => !o)}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl transition-colors"
          style={open || activeCount > 0 ? {
            background: 'rgba(45,212,191,.1)',
            border: '1px solid rgba(45,212,191,.35)',
            color: '#5eead4',
          } : {
            background: 'rgba(15,23,42,.6)',
            border: '1px solid rgba(71,85,105,.4)',
            color: '#94a3b8',
          }}
        >
          <SlidersHorizontal size={13} />
          Filters
          <AnimatePresence>
            {activeCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold"
                style={{ background: '#2dd4bf', color: '#042f2e' }}
              >
                {activeCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              variants={PANEL_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute right-0 mt-2 w-72 rounded-2xl z-40"
              style={{
                background: 'rgba(7,11,22,.97)',
                border: '1px solid rgba(71,85,105,.4)',
                boxShadow: '0 0 0 1px rgba(255,255,255,.04) inset, 0 24px 48px -12px rgba(0,0,0,.9)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Top accent */}
              <div
                className="h-px w-full rounded-t-2xl"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(45,212,191,.4), transparent)' }}
              />

              <div className="p-4 space-y-4">
                {/* Priority */}
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Priority</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRIORITIES.map(p => {
                      const meta   = PRIORITY_META[p];
                      const active = (filters.priorities || []).includes(p);
                      return (
                        <button
                          key={p}
                          onClick={() => toggleArray('priorities', p)}
                          className="text-xs px-2.5 py-1 rounded-full transition-all capitalize"
                          style={active ? {
                            background: meta.bg,
                            color: meta.color,
                            border: `1px solid ${meta.border}`,
                          } : {
                            background: 'transparent',
                            color: '#64748b',
                            border: '1px solid rgba(71,85,105,.4)',
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUSES.map(s => {
                      const active = (filters.statuses || []).includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => toggleArray('statuses', s)}
                          className="text-xs px-2.5 py-1 rounded-full transition-all"
                          style={active ? {
                            background: 'rgba(45,212,191,.12)',
                            color: '#5eead4',
                            border: '1px solid rgba(45,212,191,.35)',
                          } : {
                            background: 'transparent',
                            color: '#64748b',
                            border: '1px solid rgba(71,85,105,.4)',
                          }}
                        >
                          {s.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Assignee */}
                {members.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Assignee</p>
                    <select
                      value={filters.assigneeId || ''}
                      onChange={e => onChange({ ...filters, assigneeId: e.target.value })}
                      className="control w-full text-sm"
                    >
                      <option value="">Anyone</option>
                      {members.map(m => {
                        const u = m.user || m;
                        return (
                          <option key={u._id} value={u._id} className="bg-slate-900">
                            {u.firstName} {u.lastName}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* Due date range */}
                <div>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Due Date</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-600 mb-1 block">From</label>
                      <input
                        type="date"
                        value={filters.dueDateFrom || ''}
                        onChange={e => onChange({ ...filters, dueDateFrom: e.target.value })}
                        className="control w-full text-xs py-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 mb-1 block">To</label>
                      <input
                        type="date"
                        value={filters.dueDateTo || ''}
                        onChange={e => onChange({ ...filters, dueDateTo: e.target.value })}
                        className="control w-full text-xs py-1.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Clear */}
                {activeCount > 0 && (
                  <button onClick={clearAll} className="btn-ghost w-full text-xs py-1.5">
                    Clear all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
