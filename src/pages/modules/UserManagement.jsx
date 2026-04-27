import { useState } from 'react';
import { UserPlus, Shield, User, Pencil, X, CalendarDays, BarChart2, PauseCircle, PlayCircle, LayoutGrid } from 'lucide-react';

const ALL_MODULES = [
  { id: 'vocab',     label: '📖 Thematic Idea Bank' },
  { id: 'writing',   label: '✍️ Sample Writing' },
  { id: 'exercises', label: '🧩 Exercises' },
  { id: 'essential', label: '📘 Essential Vocabulary' },
  { id: 'speaking',  label: '🎤 Speaking Practice' },
  { id: 'hotissues', label: '🌐 Hot Issues' },
  { id: 'progress',  label: '📈 Progress' },
];
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/shared/PageHeader';
import { getUsers, saveUsers, isOwnerAccount } from '@/lib/auth';

const LEVELS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];

const LEVEL_COLORS = {
  'S1': 'bg-slate-100 text-slate-700',
  'S2': 'bg-blue-100 text-blue-700',
  'S3': 'bg-cyan-100 text-cyan-700',
  'S4': 'bg-amber-100 text-amber-700',
  'S5': 'bg-orange-100 text-orange-700',
  'S6': 'bg-green-100 text-green-700',
};

function isExpired(expiryDate) {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date(new Date().toDateString());
}

function EditUserModal({ user, onSave, onClose }) {
  const [level, setLevel] = useState(user.level || 'S1');
  const [expiryDate, setExpiryDate] = useState(user.expiryDate || '');
  // null = all modules allowed; array = restricted list
  const [allowedModules, setAllowedModules] = useState(user.allowedModules || null);

  const isRestricted = allowedModules !== null;

  const toggleRestricted = () => {
    if (isRestricted) setAllowedModules(null);
    else setAllowedModules(ALL_MODULES.map(m => m.id)); // start with all checked
  };

  const toggleModule = (id) => {
    if (!allowedModules) return;
    setAllowedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-sm p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground text-base">Edit — {user.username}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Level */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <BarChart2 className="w-4 h-4 text-primary" /> Proficiency Level
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {LEVELS.map(l => (
              <button key={l} onClick={() => setLevel(l)}
                className={`px-3 py-2 rounded-xl border text-sm font-medium text-center transition-all ${level === l ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:bg-muted text-foreground'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Expiry Date */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <CalendarDays className="w-4 h-4 text-primary" /> Account Expiry Date
          </label>
          <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
          {expiryDate && (
            <button onClick={() => setExpiryDate('')} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
              Clear expiry (no expiry)
            </button>
          )}
          {!expiryDate && <p className="text-xs text-muted-foreground">No expiry set — account never expires.</p>}
        </div>

        {/* Module Access */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <LayoutGrid className="w-4 h-4 text-primary" /> Page Access
            </label>
            <button
              onClick={toggleRestricted}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${isRestricted ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-green-100 text-green-700 border-green-300'}`}
            >
              {isRestricted ? 'Custom' : 'All pages'}
            </button>
          </div>
          {isRestricted && (
            <div className="space-y-1.5">
              {ALL_MODULES.map(mod => (
                <label key={mod.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={allowedModules.includes(mod.id)}
                    onChange={() => toggleModule(mod.id)}
                    className="rounded"
                  />
                  <span className="text-sm text-foreground">{mod.label}</span>
                </label>
              ))}
            </div>
          )}
          {!isRestricted && <p className="text-xs text-muted-foreground">User can access all pages. Click "All pages" to restrict.</p>}
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ level, expiryDate, allowedModules })}>Save</Button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState(() => getUsers().filter(u => !isOwnerAccount(u.username)));
  const [form, setForm] = useState({ username: '', password: '', isEditor: false });
  const [adding, setAdding] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');

  const update = (u) => { setUsers(u); saveUsers(u); };

  const addUser = () => {
    if (!form.username.trim() || !form.password.trim()) return setError('Username and password required.');
    if (users.find(u => u.username.toLowerCase() === form.username.toLowerCase())) return setError('Username already exists.');
    update([...users, { username: form.username.trim(), password: form.password, isEditor: form.isEditor, level: 'S1', expiryDate: '' }]);
    setForm({ username: '', password: '', isEditor: false });
    setAdding(false);
    setError('');
  };

  const togglePause = (username) => {
    if (isOwnerAccount(username)) return;
    const user = users.find(u => u.username === username);
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    // If currently expired/paused → resume by clearing expiry; if active → pause by setting expiry to yesterday
    const isCurrentlyPaused = user.expiryDate && new Date(user.expiryDate) < new Date(new Date().toDateString());
    if (isCurrentlyPaused) {
      // Resume: clear expiry date
      update(users.map(u => u.username === username ? { ...u, expiryDate: '' } : u));
    } else {
      // Pause: set expiry to yesterday
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
      const yDate = yesterday.toISOString().split('T')[0];
      update(users.map(u => u.username === username ? { ...u, expiryDate: yDate } : u));
    }
  };

  const toggleEditor = (username) => {
    update(users.map(u => u.username === username ? { ...u, isEditor: !u.isEditor } : u));
  };

  const saveUserEdit = ({ level, expiryDate, allowedModules }) => {
    update(users.map(u => u.username === editingUser.username ? { ...u, level, expiryDate, allowedModules } : u));
    setEditingUser(null);
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      <PageHeader icon="👥" title="User Management" description="Add and manage user accounts. Pause accounts to block access, or resume them to restore it." />

      <div className="mb-6">
        {!adding ? (
          <Button onClick={() => setAdding(true)}><UserPlus className="w-4 h-4 mr-2" />Add User</Button>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
            <Input placeholder="Username..." value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
            <Input type="password" placeholder="Password..." value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isEditor} onChange={e => setForm(p => ({ ...p, isEditor: e.target.checked }))} className="rounded" />
              <span className="text-foreground font-medium">Editor privileges</span>
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={addUser}>Add</Button>
              <Button variant="outline" onClick={() => { setAdding(false); setError(''); }}>Cancel</Button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {users.map(user => {
          const expired = isExpired(user.expiryDate);
          return (
            <div key={user.username} className={`bg-card rounded-2xl border shadow-sm px-5 py-4 flex items-center justify-between gap-4 ${expired ? 'border-red-300 bg-red-50/30' : 'border-border'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
                  {user.isEditor ? <Shield className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground text-sm">{user.username}</p>
                    {user.level && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${LEVEL_COLORS[user.level] || 'bg-muted text-muted-foreground'}`}>
                        {user.level}
                      </span>
                    )}
                    {expired && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">Expired</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user.isEditor ? 'Editor' : 'Student'}
                    {user.expiryDate && !expired && ` · Expires ${new Date(user.expiryDate).toLocaleDateString('en-HK', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    {expired && ` · Expired ${new Date(user.expiryDate).toLocaleDateString('en-HK', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    {!user.expiryDate && ' · No expiry'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={() => toggleEditor(user.username)}>
                  {user.isEditor ? 'Remove Editor' : 'Make Editor'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditingUser(user)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                {!isOwnerAccount(user.username) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => togglePause(user.username)}
                    className={expired ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'}
                    title={expired ? 'Resume account' : 'Pause account'}
                  >
                    {expired ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editingUser && (
        <EditUserModal user={editingUser} onSave={saveUserEdit} onClose={() => setEditingUser(null)} />
      )}
    </div>
  );
}