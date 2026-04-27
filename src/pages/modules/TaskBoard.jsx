import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useUser } from '@/lib/UserContext';
import { getUsers } from '@/lib/auth';
import { Plus, X, Flag, Calendar, User, CheckCircle2, Circle, ArrowUpCircle, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/shared/PageHeader';

const PRIORITY_STYLES = {
  low:    { badge: 'bg-slate-100 text-slate-600 border-slate-200',    dot: 'bg-slate-400' },
  medium: { badge: 'bg-amber-100 text-amber-700 border-amber-200',    dot: 'bg-amber-400' },
  high:   { badge: 'bg-red-100 text-red-700 border-red-200',          dot: 'bg-red-500' },
};

const STATUS_CONFIG = {
  todo:        { label: 'To Do',       icon: Circle,        color: 'text-slate-400' },
  in_progress: { label: 'In Progress', icon: ArrowUpCircle, color: 'text-blue-500' },
  done:        { label: 'Done',        icon: CheckCircle2,  color: 'text-green-500' },
};

const MODULES = ['Vocab / Reading', 'Writing', 'Cloze Exercises', 'Grammar', 'Essential Vocabulary', 'Speaking', 'Hot Issues', 'Other'];

function TaskFormModal({ task, editors, onSave, onClose }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assigned_to: task?.assigned_to || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    due_date: task?.due_date || '',
    module: task?.module || '',
    notes: task?.notes || '',
  });
  const s = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.title.trim()) return alert('Title is required.');
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">{task ? 'Edit Task' : 'New Task'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg"><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Title *</label>
          <Input placeholder="e.g. Add 5 new cloze exercises on environment" value={form.title} onChange={e => s('title', e.target.value)} />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Description</label>
          <textarea
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-20 resize-y focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Describe what needs to be done..."
            value={form.description}
            onChange={e => s('description', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Assign To</label>
            <select className="w-full rounded-xl border border-input px-3 py-2 text-sm bg-background" value={form.assigned_to} onChange={e => s('assigned_to', e.target.value)}>
              <option value="">— Unassigned —</option>
              {editors.map(e => <option key={e.username} value={e.username}>{e.username}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Module</label>
            <select className="w-full rounded-xl border border-input px-3 py-2 text-sm bg-background" value={form.module} onChange={e => s('module', e.target.value)}>
              <option value="">— Any —</option>
              {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Priority</label>
            <select className="w-full rounded-xl border border-input px-3 py-2 text-sm bg-background" value={form.priority} onChange={e => s('priority', e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground mb-1 block">Status</label>
            <select className="w-full rounded-xl border border-input px-3 py-2 text-sm bg-background" value={form.status} onChange={e => s('status', e.target.value)}>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Due Date</label>
          <Input type="date" value={form.due_date} onChange={e => s('due_date', e.target.value)} />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">Notes</label>
          <textarea
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-16 resize-y focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Any extra notes..."
            value={form.notes}
            onChange={e => s('notes', e.target.value)}
          />
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Task</Button>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, isAdmin, onEdit, onDelete, onStatusChange }) {
  const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
  const StatusIcon = status.icon;

  const isOverdue = task.due_date && new Date(task.due_date) < new Date(new Date().toDateString()) && task.status !== 'done';

  return (
    <div className={`bg-card rounded-2xl border p-4 space-y-3 transition-all hover:shadow-md ${task.status === 'done' ? 'opacity-70 border-border' : isOverdue ? 'border-red-300' : 'border-border'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <button
            onClick={() => {
              const next = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
              onStatusChange(task.id, next[task.status]);
            }}
            className="mt-0.5 shrink-0"
            title="Cycle status"
          >
            <StatusIcon className={`w-5 h-5 ${status.color}`} />
          </button>
          <div className="min-w-0">
            <p className={`font-semibold text-sm text-foreground ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
            {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{task.description}</p>}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-1 shrink-0">
            <button onClick={() => onEdit(task)} className="p-1.5 hover:bg-muted rounded-lg transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
            <button onClick={() => { if (confirm('Delete this task?')) onDelete(task.id); }} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priority.badge}`}>
          <Flag className="w-2.5 h-2.5 inline mr-0.5" />{task.priority}
        </span>
        {task.module && (
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{task.module}</span>
        )}
        {task.assigned_to && (
          <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
            <User className="w-2.5 h-2.5" />{task.assigned_to}
          </span>
        )}
        {task.due_date && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'}`}>
            <Calendar className="w-2.5 h-2.5" />
            {new Date(task.due_date).toLocaleDateString('en-HK', { day: 'numeric', month: 'short' })}
            {isOverdue && ' ⚠️'}
          </span>
        )}
      </div>

      {task.notes && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 italic">💬 {task.notes}</p>
      )}
    </div>
  );
}

export default function TaskBoard() {
  const { isEditor, currentUser } = useUser();
  const isAdmin = isEditor; // admins are editors
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');

  // Get list of editors for assignment
  const editors = getUsers().filter(u => u.isEditor);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.EditorTask.list('-created_date', 200);
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (formData) => {
    if (editingTask) {
      await base44.entities.EditorTask.update(editingTask.id, formData);
    } else {
      await base44.entities.EditorTask.create(formData);
    }
    setShowForm(false);
    setEditingTask(null);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.EditorTask.delete(id);
    load();
  };

  const handleStatusChange = async (id, newStatus) => {
    await base44.entities.EditorTask.update(id, { status: newStatus });
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const openEdit = (task) => { setEditingTask(task); setShowForm(true); };
  const openNew = () => { setEditingTask(null); setShowForm(true); };

  // For non-admin editors: only show their own tasks
  const myUsername = currentUser;
  const visibleTasks = isAdmin
    ? tasks.filter(t => {
        const statusOk = filterStatus === 'all' || t.status === filterStatus;
        const assigneeOk = filterAssignee === 'all' || t.assigned_to === filterAssignee;
        return statusOk && assigneeOk;
      })
    : tasks.filter(t => t.assigned_to === myUsername);

  const counts = {
    todo: visibleTasks.filter(t => t.status === 'todo').length,
    in_progress: visibleTasks.filter(t => t.status === 'in_progress').length,
    done: visibleTasks.filter(t => t.status === 'done').length,
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6 gap-4">
        <PageHeader
          icon="📋"
          title="Task Board"
          description={isAdmin ? "Assign and track tasks for editors." : "Your assigned tasks."}
        />
        {isAdmin && (
          <Button onClick={openNew} className="shrink-0">
            <Plus className="w-4 h-4 mr-1" /> New Task
          </Button>
        )}
      </div>

      {/* Summary pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        {[
          { key: 'all', label: 'All', count: visibleTasks.length },
          { key: 'todo', label: 'To Do', count: counts.todo },
          { key: 'in_progress', label: 'In Progress', count: counts.in_progress },
          { key: 'done', label: 'Done', count: counts.done },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setFilterStatus(s.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${filterStatus === s.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground hover:bg-muted'}`}
          >
            {s.label} {s.count > 0 && <span className="ml-1 opacity-70">{s.count}</span>}
          </button>
        ))}
        {isAdmin && (
          <select
            className="ml-auto rounded-full border border-input px-3 py-1.5 text-xs bg-background"
            value={filterAssignee}
            onChange={e => setFilterAssignee(e.target.value)}
          >
            <option value="all">All editors</option>
            {editors.map(e => <option key={e.username} value={e.username}>{e.username}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>
      ) : visibleTasks.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium">{isAdmin ? 'No tasks yet. Create one!' : 'No tasks assigned to you yet.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              isAdmin={isAdmin}
              onEdit={openEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {showForm && (
        <TaskFormModal
          task={editingTask}
          editors={editors}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingTask(null); }}
        />
      )}
    </div>
  );
}