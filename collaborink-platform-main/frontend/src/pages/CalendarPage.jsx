import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, X, Loader, Calendar, Clock, MapPin } from 'lucide-react';
import Layout from '../layouts/Layout';
import { useCalendarStore } from '../store/calendarStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import toast from 'react-hot-toast';

const WEEKDAYS    = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS      = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const EVENT_COLORS = ['#2dd4bf', '#6366f1', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'];

function getDaysInMonth(year, month)  { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfWeek(year, month) { return new Date(year, month, 1).getDay(); }
function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth()    === d2.getMonth()    &&
    d1.getDate()     === d2.getDate();
}
function formatDateLocal(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

const BLANK_FORM = {
  title: '', description: '', date: formatDateLocal(new Date()),
  startTime: '09:00', endTime: '10:00', allDay: false,
  location: '', type: 'meeting', color: EVENT_COLORS[0],
};

const MODAL_BACKDROP = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit:    { opacity: 0, transition: { duration: 0.14 } },
};
const MODAL_PANEL = {
  hidden:  { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,
    transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: 8,  scale: 0.98,
    transition: { duration: 0.16 } },
};

export default function CalendarPage() {
  const today     = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [viewEvent,   setViewEvent]   = useState(null);
  const [form,        setForm]        = useState(BLANK_FORM);
  const [saving,      setSaving]      = useState(false);
  const [calendarId,  setCalendarId]  = useState(null);

  const { workspaces, fetchWorkspaces }                            = useWorkspaceStore();
  const { events, fetchEvents, createEvent, deleteEvent, ensureCalendar, isLoading } = useCalendarStore();

  useEffect(() => { fetchWorkspaces(); }, []);

  useEffect(() => {
    if (workspaces.length === 0) return;
    ensureCalendar(workspaces[0]._id)
      .then(cal => setCalendarId(cal._id))
      .catch(() => {});
  }, [workspaces]);

  const loadEvents = useCallback(() => {
    if (!calendarId) return;
    const start = new Date(viewYear, viewMonth, 1).toISOString();
    const end   = new Date(viewYear, viewMonth + 1, 0, 23, 59, 59).toISOString();
    fetchEvents(calendarId, start, end);
  }, [calendarId, viewYear, viewMonth]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const eventsOnDay = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    return events.filter(e => {
      const start = new Date(e.startTime);
      const end   = new Date(e.endTime);
      return (start <= d && d <= end) || isSameDay(start, d);
    });
  };

  const openCreate = (day) => {
    const dateStr = formatDateLocal(new Date(viewYear, viewMonth, day));
    setForm({ ...BLANK_FORM, date: dateStr });
    setSelectedDay(day);
    setModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !calendarId) return;
    setSaving(true);
    try {
      const startTime = form.allDay
        ? new Date(`${form.date}T00:00:00`).toISOString()
        : new Date(`${form.date}T${form.startTime}`).toISOString();
      const endTime = form.allDay
        ? new Date(`${form.date}T23:59:59`).toISOString()
        : new Date(`${form.date}T${form.endTime}`).toISOString();

      await createEvent({
        calendar: calendarId, title: form.title, description: form.description,
        startTime, endTime, allDay: form.allDay, location: form.location,
        type: form.type, color: form.color,
      });
      toast.success('Event created');
      setModalOpen(false);
      setForm(BLANK_FORM);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (eventId) => {
    try {
      await deleteEvent(eventId);
      setViewEvent(null);
      toast.success('Event deleted');
    } catch {
      toast.error('Failed to delete event');
    }
  };

  const daysInMonth  = getDaysInMonth(viewYear, viewMonth);
  const firstDow     = getFirstDayOfWeek(viewYear, viewMonth);
  const totalCells   = Math.ceil((firstDow + daysInMonth) / 7) * 7;

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <motion.button
                onClick={prevMonth}
                whileTap={{ scale: 0.9 }}
                className="icon-button h-8 w-8"
                aria-label="Previous month"
              >
                <ChevronLeft size={16} />
              </motion.button>
              <h1 className="text-[15px] font-semibold text-white min-w-[160px] text-center">
                {MONTHS[viewMonth]} {viewYear}
              </h1>
              <motion.button
                onClick={nextMonth}
                whileTap={{ scale: 0.9 }}
                className="icon-button h-8 w-8"
                aria-label="Next month"
              >
                <ChevronRight size={16} />
              </motion.button>
            </div>

            <button
              onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); }}
              className="text-xs px-3 py-1.5 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
              style={{ background: 'rgba(15,23,42,.6)', border: '1px solid rgba(71,85,105,.4)' }}
            >
              Today
            </button>
          </div>

          <motion.button
            onClick={() => { setForm(BLANK_FORM); setModalOpen(true); }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} /> New Event
          </motion.button>
        </div>

        {/* Calendar grid */}
        <div
          className="flex-1 flex flex-col rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(7,11,22,.6)',
            border: '1px solid rgba(71,85,105,.3)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Day headers */}
          <div
            className="grid grid-cols-7 flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(71,85,105,.25)' }}
          >
            {WEEKDAYS.map(d => (
              <div key={d} className="py-2.5 text-center text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center gap-3">
              <motion.div
                className="h-5 w-5 rounded-full border-2 border-teal-500/20 border-t-teal-400"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
              <span className="text-xs text-slate-500">Loading events…</span>
            </div>
          ) : (
            <div className="grid grid-cols-7 flex-1" style={{ gridAutoRows: '1fr' }}>
              {Array.from({ length: totalCells }, (_, i) => {
                const dayNum    = i - firstDow + 1;
                const isValid   = dayNum >= 1 && dayNum <= daysInMonth;
                const isToday   = isValid && isSameDay(new Date(viewYear, viewMonth, dayNum), today);
                const dayEvents = isValid ? eventsOnDay(dayNum) : [];
                const isRightEdge = i % 7 === 6;

                return (
                  <div
                    key={i}
                    onClick={() => isValid && openCreate(dayNum)}
                    className="p-1.5 min-h-[88px] relative transition-colors duration-100"
                    style={{
                      borderRight: isRightEdge ? 'none' : '1px solid rgba(71,85,105,.18)',
                      borderBottom: '1px solid rgba(71,85,105,.18)',
                      background: isValid ? 'transparent' : 'rgba(7,11,22,.3)',
                      cursor: isValid ? 'pointer' : 'default',
                    }}
                    onMouseEnter={e => { if (isValid) e.currentTarget.style.background = 'rgba(30,41,59,.35)'; }}
                    onMouseLeave={e => { if (isValid) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {isValid && (
                      <>
                        <span
                          className="inline-flex items-center justify-center h-6 w-6 text-xs font-medium rounded-full mb-1"
                          style={isToday ? {
                            background: '#2dd4bf',
                            color: '#042f2e',
                            fontWeight: 700,
                            boxShadow: '0 0 8px rgba(45,212,191,.5)',
                          } : {
                            color: '#94a3b8',
                          }}
                        >
                          {dayNum}
                        </span>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map(ev => (
                            <div
                              key={ev._id}
                              onClick={e => { e.stopPropagation(); setViewEvent(ev); }}
                              className="text-[11px] px-1.5 py-0.5 rounded-md truncate cursor-pointer transition-opacity hover:opacity-80"
                              style={{
                                background: `${ev.color || '#2dd4bf'}22`,
                                color: ev.color || '#2dd4bf',
                                border: `1px solid ${ev.color || '#2dd4bf'}40`,
                              }}
                            >
                              {ev.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <p className="text-[10px] text-slate-600 pl-1">
                              +{dayEvents.length - 3} more
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Event Modal */}
      <AnimatePresence>
        {modalOpen && (
          <CalModal
            title="New Event"
            onClose={() => { setModalOpen(false); setForm(BLANK_FORM); }}
          >
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input
                  autoFocus
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Event title"
                  className="control w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="control w-full"
                  />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="control w-full"
                  >
                    <option value="meeting" className="bg-slate-900">Meeting</option>
                    <option value="task"    className="bg-slate-900">Task</option>
                    <option value="reminder"className="bg-slate-900">Reminder</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div
                  onClick={() => setForm(f => ({ ...f, allDay: !f.allDay }))}
                  className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                  style={{ background: form.allDay ? '#2dd4bf' : 'rgba(71,85,105,.5)' }}
                >
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform"
                    style={{ transform: form.allDay ? 'translateX(18px)' : 'translateX(2px)' }}
                  />
                </div>
                <span className="text-sm text-slate-300">All day</span>
              </label>

              {!form.allDay && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Start time</label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                      className="control w-full"
                    />
                  </div>
                  <div>
                    <label className="label">End time</label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                      className="control w-full"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="label">Location</label>
                <input
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="Optional location"
                  className="control w-full"
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={2}
                  className="control w-full resize-none"
                />
              </div>

              <div>
                <label className="label">Color</label>
                <div className="flex gap-2 mt-1">
                  {EVENT_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, color: c }))}
                      className="h-6 w-6 rounded-full transition-transform"
                      style={{
                        background: c,
                        outline: form.color === c ? `2px solid ${c}` : 'none',
                        outlineOffset: '2px',
                        transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-ghost text-sm px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.title.trim()}
                  className="btn-primary flex items-center gap-2 disabled:opacity-40"
                >
                  {saving && <Loader size={14} className="animate-spin" />}
                  Create Event
                </button>
              </div>
            </form>
          </CalModal>
        )}
      </AnimatePresence>

      {/* View Event Modal */}
      <AnimatePresence>
        {viewEvent && (
          <CalModal title="Event Details" onClose={() => setViewEvent(null)}>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span
                  className="h-3 w-3 rounded-full mt-1.5 flex-shrink-0"
                  style={{
                    background: viewEvent.color || '#2dd4bf',
                    boxShadow: `0 0 6px ${viewEvent.color || '#2dd4bf'}80`,
                  }}
                />
                <div>
                  <h3 className="text-[15px] font-semibold text-white">{viewEvent.title}</h3>
                  {viewEvent.type && (
                    <span className="text-xs text-slate-500 capitalize">{viewEvent.type}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-slate-600" />
                  <span>
                    {new Date(viewEvent.startTime).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                </div>
                {!viewEvent.allDay && (
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-slate-600" />
                    <span>
                      {new Date(viewEvent.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      {' – '}
                      {new Date(viewEvent.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
                {viewEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={13} className="text-slate-600" />
                    <span>{viewEvent.location}</span>
                  </div>
                )}
              </div>

              {viewEvent.description && (
                <p
                  className="text-sm text-slate-400 rounded-xl p-3"
                  style={{ background: 'rgba(30,41,59,.5)', border: '1px solid rgba(71,85,105,.25)' }}
                >
                  {viewEvent.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => handleDelete(viewEvent._id)}
                  className="text-sm text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Delete event
                </button>
                <button
                  onClick={() => setViewEvent(null)}
                  className="btn-ghost text-sm px-4 py-2"
                >
                  Close
                </button>
              </div>
            </div>
          </CalModal>
        )}
      </AnimatePresence>
    </Layout>
  );
}

function CalModal({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
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
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background: 'rgba(7,11,22,.97)',
          border: '1px solid rgba(71,85,105,.4)',
          boxShadow: '0 0 0 1px rgba(255,255,255,.04) inset, 0 40px 80px -24px rgba(0,0,0,.95)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="h-px w-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(45,212,191,.4), transparent)' }}
        />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-[15px] font-semibold text-white">{title}</h3>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="icon-button h-8 w-8"
            >
              <X size={17} />
            </motion.button>
          </div>
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
