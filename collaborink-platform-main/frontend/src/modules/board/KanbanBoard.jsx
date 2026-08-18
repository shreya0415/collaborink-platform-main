import { useEffect, useState, useMemo, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MoreHorizontal, Loader, X, CheckSquare, Square, Trash2 } from 'lucide-react';
import boardApi from '../../services/boardApi';
import { initSocket, joinRoom, leaveRoom, on, off, emit } from '../../services/socket';
import api from '../../services/api';
import TaskCard from './TaskCard';
import TaskDetail from './TaskDetail';
import FilterPanel from './FilterPanel';
import toast from 'react-hot-toast';

export default function KanbanBoard({ projectId }) {
  const [board, setBoard]   = useState(null);
  const [tasks, setTasks]   = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    q: '', priorities: [], statuses: [], assigneeId: '', dueDateFrom: '', dueDateTo: '',
  });

  const [selectMode, setSelectMode]         = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);

  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [addColOpen, setAddColOpen]         = useState(false);
  const [newColTitle, setNewColTitle]       = useState('');
  const [addTaskCol, setAddTaskCol]         = useState(null);
  const [newTaskTitle, setNewTaskTitle]     = useState('');
  const [saving, setSaving]                 = useState(false);

  useEffect(() => {
    initSocket();
    const room = `project:${projectId}`;
    joinRoom(room);

    on('board:updated', (updated) => {
      if (updated) setBoard(updated);
      else fetchBoard();
    });
    on('task:moved', () => { fetchTasks(); });

    Promise.all([fetchBoard(), fetchTasks(), fetchProject()]).finally(() => setLoading(false));

    return () => {
      off('board:updated');
      off('task:moved');
      leaveRoom(room);
    };
  }, [projectId]);

  async function fetchBoard() {
    try {
      const res = await boardApi.getBoard(projectId);
      setBoard(res.data);
    } catch (err) {
      console.error('fetchBoard failed', err);
    }
  }

  async function fetchTasks() {
    try {
      const res = await api.get(`/projects/${projectId}/tasks`);
      setTasks(res.data || []);
    } catch (err) {
      console.error('fetchTasks failed', err);
    }
  }

  async function fetchProject() {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data);
    } catch (err) {
      console.error('fetchProject failed', err);
    }
  }

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filters.q && !t.title?.toLowerCase().includes(filters.q.toLowerCase())) return false;
      if (filters.priorities?.length && !filters.priorities.includes(t.priority)) return false;
      if (filters.statuses?.length && !filters.statuses.includes(t.status)) return false;
      if (filters.assigneeId) {
        const aid = t.assignee?._id || t.assignee;
        if (aid?.toString() !== filters.assigneeId) return false;
      }
      if (filters.dueDateFrom && t.dueDate && new Date(t.dueDate) < new Date(filters.dueDateFrom)) return false;
      if (filters.dueDateTo   && t.dueDate && new Date(t.dueDate) > new Date(filters.dueDateTo))   return false;
      return true;
    });
  }, [tasks, filters]);

  const tasksInColumn = (columnId) =>
    filteredTasks
      .filter(t => t.column?.toString() === columnId.toString())
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    setTasks(prev =>
      prev.map(t =>
        t._id === draggableId
          ? { ...t, column: destination.droppableId, position: destination.index }
          : t
      )
    );

    try {
      await api.put(`/tasks/${draggableId}`, {
        column: destination.droppableId,
        position: destination.index,
      });
      await boardApi.taskMoved(projectId, {
        taskId: draggableId,
        fromColumnId: source.droppableId,
        toColumnId: destination.droppableId,
        position: destination.index,
      });
      emit('task:moved', {
        room: `project:${projectId}`,
        taskId: draggableId,
        fromColumnId: source.droppableId,
        toColumnId: destination.droppableId,
        position: destination.index,
      });
    } catch {
      toast.error('Failed to move task');
      fetchTasks();
    }
  };

  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColTitle.trim()) return;
    setSaving(true);
    try {
      const res = await boardApi.addColumn(projectId, newColTitle.trim());
      setBoard(res.data);
      setAddColOpen(false);
      setNewColTitle('');
      toast.success('Column added');
    } catch {
      toast.error('Failed to add column');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !addTaskCol) return;
    setSaving(true);
    try {
      const res = await api.post('/tasks', {
        title: newTaskTitle.trim(),
        project: projectId,
        column: addTaskCol,
        position: tasksInColumn(addTaskCol).length,
      });
      setTasks(prev => [...prev, res.data]);
      setAddTaskCol(null);
      setNewTaskTitle('');
      toast.success('Task created');
    } catch {
      toast.error('Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const toggleTaskSelect = useCallback((taskId) => {
    setSelectedTaskIds(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  }, []);

  const handleBulkUpdate = useCallback(async (field, value) => {
    if (selectedTaskIds.length === 0) return;
    try {
      await Promise.all(selectedTaskIds.map(id => api.put(`/tasks/${id}`, { [field]: value })));
      setTasks(prev => prev.map(t => selectedTaskIds.includes(t._id) ? { ...t, [field]: value } : t));
      toast.success(`Updated ${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? 's' : ''}`);
      setSelectedTaskIds([]);
      setSelectMode(false);
    } catch {
      toast.error('Bulk update failed');
    }
  }, [selectedTaskIds]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedTaskIds.length === 0) return;
    if (!confirm(`Delete ${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? 's' : ''}?`)) return;
    try {
      await Promise.all(selectedTaskIds.map(id => api.delete(`/tasks/${id}`)));
      setTasks(prev => prev.filter(t => !selectedTaskIds.includes(t._id)));
      toast.success(`Deleted ${selectedTaskIds.length} task${selectedTaskIds.length > 1 ? 's' : ''}`);
      setSelectedTaskIds([]);
      setSelectMode(false);
    } catch {
      toast.error('Delete failed');
    }
  }, [selectedTaskIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3">
        <motion.div
          className="h-5 w-5 rounded-full border-2 border-teal-500/20 border-t-teal-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
        <span className="text-[10px] text-slate-500 tracking-widest uppercase">Loading board…</span>
      </div>
    );
  }

  if (!board) {
    return <div className="text-slate-500 text-center py-10">Board not found.</div>;
  }

  const columns = [...board.columns].sort((a, b) => a.order - b.order);

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0 gap-3">
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => { setSelectMode(s => !s); setSelectedTaskIds([]); }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl transition-colors font-medium"
            style={selectMode ? {
              background: 'rgba(45,212,191,.1)',
              border: '1px solid rgba(45,212,191,.35)',
              color: '#5eead4',
            } : {
              background: 'rgba(15,23,42,.6)',
              border: '1px solid rgba(71,85,105,.4)',
              color: '#94a3b8',
            }}
          >
            {selectMode ? <CheckSquare size={13} /> : <Square size={13} />}
            {selectMode ? 'Selecting' : 'Select'}
          </motion.button>

          {/* Bulk action bar */}
          <AnimatePresence>
            {selectMode && selectedTaskIds.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                style={{
                  background: 'rgba(7,11,22,.85)',
                  border: '1px solid rgba(71,85,105,.4)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                  {selectedTaskIds.length} selected
                </span>
                <div className="w-px h-4" style={{ background: 'rgba(71,85,105,.5)' }} />
                <select
                  defaultValue=""
                  onChange={e => { if (e.target.value) handleBulkUpdate('priority', e.target.value); e.target.value = ''; }}
                  className="text-xs bg-transparent text-slate-300 outline-none cursor-pointer"
                >
                  <option value="" disabled>Set priority</option>
                  {['urgent', 'high', 'medium', 'low'].map(p => (
                    <option key={p} value={p} className="bg-slate-900 capitalize">{p}</option>
                  ))}
                </select>
                <div className="w-px h-4" style={{ background: 'rgba(71,85,105,.5)' }} />
                <select
                  defaultValue=""
                  onChange={e => { if (e.target.value) handleBulkUpdate('status', e.target.value); e.target.value = ''; }}
                  className="text-xs bg-transparent text-slate-300 outline-none cursor-pointer"
                >
                  <option value="" disabled>Set status</option>
                  {['todo', 'in-progress', 'review', 'done'].map(s => (
                    <option key={s} value={s} className="bg-slate-900">{s}</option>
                  ))}
                </select>
                <div className="w-px h-4" style={{ background: 'rgba(71,85,105,.5)' }} />
                <button
                  onClick={handleBulkDelete}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <FilterPanel
          members={project?.members || []}
          filters={filters}
          onChange={setFilters}
        />
      </div>

      {/* Board canvas */}
      <div className="h-full overflow-x-auto pb-4">
        <DragDropContext onDragEnd={selectMode ? () => {} : onDragEnd}>
          <div className="flex gap-4 h-full items-start min-w-max">
            {columns.map((col) => {
              const colTasks    = tasksInColumn(col._id);
              const accentColor = col.color || '#2dd4bf';

              return (
                <div
                  key={col._id}
                  className="w-72 flex flex-col rounded-2xl flex-shrink-0"
                  style={{
                    background: 'rgba(7,11,22,.7)',
                    border: '1px solid rgba(71,85,105,.28)',
                    backdropFilter: 'blur(12px)',
                    maxHeight: 'calc(100vh - 220px)',
                  }}
                >
                  {/* Column header */}
                  <div
                    className="flex items-center justify-between px-4 py-3 flex-shrink-0 rounded-t-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}12 0%, transparent 100%)`,
                      borderBottom: '1px solid rgba(71,85,105,.22)',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ background: accentColor, boxShadow: `0 0 6px 1px ${accentColor}55` }}
                      />
                      <span className="font-semibold text-slate-200 text-sm">{col.title}</span>
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: `${accentColor}18`,
                          color: accentColor,
                          border: `1px solid ${accentColor}30`,
                        }}
                      >
                        {colTasks.length}
                      </span>
                    </div>
                    <button
                      className="h-7 w-7 grid place-items-center rounded-lg text-slate-600 hover:text-slate-300 transition-colors"
                      style={{ background: 'transparent' }}
                    >
                      <MoreHorizontal size={15} />
                    </button>
                  </div>

                  {/* Droppable task list */}
                  <Droppable droppableId={col._id.toString()}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1 overflow-y-auto px-3 py-2 transition-colors duration-150"
                        style={{
                          minHeight: '100px',
                          background: snapshot.isDraggingOver ? 'rgba(45,212,191,.04)' : 'transparent',
                        }}
                      >
                        {colTasks.length === 0 && !snapshot.isDraggingOver && (
                          <div className="flex items-center justify-center py-6">
                            <p className="text-xs text-slate-700">Drop tasks here</p>
                          </div>
                        )}
                        {colTasks.map((task, index) => (
                          <Draggable draggableId={task._id} index={index} key={task._id}>
                            {(prov, snapDrag) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                style={{
                                  ...prov.draggableProps.style,
                                  opacity: snapDrag.isDragging ? 0.82 : 1,
                                  transform: snapDrag.isDragging
                                    ? `${prov.draggableProps.style?.transform || ''} rotate(1.5deg)`
                                    : prov.draggableProps.style?.transform,
                                }}
                              >
                                <TaskCard
                                  task={task}
                                  onClick={selectMode ? undefined : () => setSelectedTaskId(task._id)}
                                  selectable={selectMode}
                                  selected={selectedTaskIds.includes(task._id)}
                                  onSelect={toggleTaskSelect}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {/* Add task area */}
                  <div
                    className="px-3 pb-3 flex-shrink-0"
                    style={{ borderTop: colTasks.length > 0 ? '1px solid rgba(71,85,105,.18)' : 'none' }}
                  >
                    <AnimatePresence mode="wait">
                      {addTaskCol === col._id ? (
                        <motion.form
                          key="task-form"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.15 }}
                          onSubmit={handleAddTask}
                          className="pt-2 space-y-2"
                        >
                          <input
                            autoFocus
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            placeholder="Task title…"
                            className="control w-full text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={saving || !newTaskTitle.trim()}
                              className="btn-primary flex-1 text-xs py-1.5 disabled:opacity-40"
                            >
                              {saving
                                ? <Loader size={12} className="animate-spin mx-auto" />
                                : 'Add Task'
                              }
                            </button>
                            <button
                              type="button"
                              onClick={() => { setAddTaskCol(null); setNewTaskTitle(''); }}
                              className="icon-button h-8 w-8"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </motion.form>
                      ) : (
                        <motion.button
                          key="task-trigger"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => { setAddTaskCol(col._id); setNewTaskTitle(''); }}
                          className="flex items-center gap-1.5 text-slate-600 hover:text-slate-300 text-xs w-full py-2 transition-colors mt-1"
                        >
                          <Plus size={13} />
                          Add task
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}

            {/* Add column */}
            <div className="w-72 flex-shrink-0">
              <AnimatePresence mode="wait">
                {addColOpen ? (
                  <motion.form
                    key="col-form"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    onSubmit={handleAddColumn}
                    className="rounded-2xl p-4 space-y-3"
                    style={{
                      background: 'rgba(7,11,22,.7)',
                      border: '1px solid rgba(71,85,105,.35)',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <input
                      autoFocus
                      value={newColTitle}
                      onChange={e => setNewColTitle(e.target.value)}
                      placeholder="Column name…"
                      className="control w-full text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={saving || !newColTitle.trim()}
                        className="btn-primary flex-1 text-sm disabled:opacity-40"
                      >
                        {saving
                          ? <Loader size={14} className="animate-spin mx-auto" />
                          : 'Add Column'
                        }
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAddColOpen(false); setNewColTitle(''); }}
                        className="icon-button"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.button
                    key="col-trigger"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setAddColOpen(true)}
                    whileHover={{ borderColor: 'rgba(45,212,191,.3)' }}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-300 rounded-2xl px-4 py-3.5 w-full text-sm transition-colors"
                    style={{
                      background: 'rgba(7,11,22,.4)',
                      border: '1.5px dashed rgba(71,85,105,.4)',
                    }}
                  >
                    <Plus size={16} />
                    Add Column
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </DragDropContext>
      </div>

      {/* Task detail modal */}
      {selectedTaskId && (
        <TaskDetail
          taskId={selectedTaskId}
          projectId={projectId}
          workspaceId={project?.workspace?._id || project?.workspace}
          projectMembers={project?.members || []}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={(updated) => {
            setTasks(prev => prev.map(t => t._id === updated._id ? updated : t));
          }}
          onDeleted={(id) => {
            setTasks(prev => prev.filter(t => t._id !== id));
          }}
        />
      )}
    </>
  );
}
