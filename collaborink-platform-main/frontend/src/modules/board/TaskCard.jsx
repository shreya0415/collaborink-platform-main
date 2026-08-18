import { memo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, AlertCircle } from 'lucide-react';

const PRIORITY_ACCENT = {
  urgent: { bar: '#f43f5e', bg: 'rgba(244,63,94,.13)', text: '#fb7185', border: 'rgba(244,63,94,.3)' },
  high:   { bar: '#fb923c', bg: 'rgba(251,146,60,.13)', text: '#fdba74', border: 'rgba(251,146,60,.3)' },
  medium: { bar: '#eab308', bg: 'rgba(234,179,8,.13)',  text: '#fde047', border: 'rgba(234,179,8,.3)'  },
  low:    { bar: '#2dd4bf', bg: 'rgba(45,212,191,.11)', text: '#5eead4', border: 'rgba(45,212,191,.3)' },
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)',
  'linear-gradient(135deg, #2dd4bf 0%, #06b6d4 100%)',
  'linear-gradient(135deg, #f472b6 0%, #a855f7 100%)',
  'linear-gradient(135deg, #fb923c 0%, #f59e0b 100%)',
];

function TaskCard({ task, onClick, selectable = false, selected = false, onSelect }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const assignee = task.assignee;
  const initials = assignee
    ? `${assignee.firstName?.[0] || ''}${assignee.lastName?.[0] || ''}`.toUpperCase()
    : null;
  const accent = PRIORITY_ACCENT[task.priority] || PRIORITY_ACCENT.medium;

  const handleClick = () => {
    if (selectable) onSelect?.(task._id);
    else onClick?.();
  };

  return (
    <motion.div
      onClick={handleClick}
      whileHover={!selectable ? { y: -1 } : undefined}
      whileTap={{ scale: 0.99 }}
      className="relative rounded-xl mb-2 cursor-pointer select-none overflow-hidden"
      style={{
        background: selected ? 'rgba(45,212,191,.07)' : 'rgba(15,23,42,.8)',
        border: `1px solid ${selected ? 'rgba(45,212,191,.4)' : 'rgba(71,85,105,.32)'}`,
        boxShadow: selected ? '0 0 0 1px rgba(45,212,191,.12)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s, transform 0.15s',
      }}
    >
      {/* Priority left accent bar */}
      {task.priority && (
        <span
          className="absolute inset-y-0 left-0 w-[3px] rounded-l-xl"
          style={{ background: accent.bar }}
        />
      )}

      <div className="px-3 py-3 pl-[14px]">
        {/* Checkbox in select mode */}
        {selectable && (
          <div className="absolute top-2.5 right-2.5">
            <div
              className="h-4 w-4 rounded-[4px] border-2 flex items-center justify-center transition-all"
              style={selected
                ? { background: '#2dd4bf', borderColor: '#2dd4bf' }
                : { background: 'transparent', borderColor: 'rgba(71,85,105,.6)' }
              }
            >
              {selected && (
                <svg className="w-2.5 h-2.5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        )}

        {/* Priority badge + title */}
        <div className={`flex items-start justify-between gap-2 mb-1.5 ${selectable ? 'pr-6' : ''}`}>
          <p className="text-sm font-medium text-slate-100 leading-snug flex-1">{task.title}</p>
          {task.priority && !selectable && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 leading-none capitalize"
              style={{
                background: accent.bg,
                color: accent.text,
                border: `1px solid ${accent.border}`,
              }}
            >
              {task.priority}
            </span>
          )}
        </div>

        {/* Description preview */}
        {task.description && !selectable && (
          <p className="text-xs text-slate-500 mb-2 line-clamp-2 leading-relaxed">{task.description}</p>
        )}

        {/* Footer */}
        {!selectable && (
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {task.dueDate && (
                <span
                  className="flex items-center gap-1 text-[11px]"
                  style={{ color: isOverdue ? '#fb7185' : '#64748b' }}
                >
                  {isOverdue && <AlertCircle size={10} />}
                  <Calendar size={10} />
                  {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
            {assignee && (
              <span
                title={`${assignee.firstName} ${assignee.lastName}`}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold overflow-hidden"
                style={{ background: AVATAR_GRADIENTS[0], color: '#042f2e' }}
              >
                {assignee.avatar
                  ? <img src={assignee.avatar} alt={initials} className="h-full w-full rounded-full object-cover" />
                  : initials
                }
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default memo(TaskCard);
