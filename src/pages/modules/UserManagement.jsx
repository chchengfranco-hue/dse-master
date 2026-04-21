import { useState } from 'react';
import { Trash2, UserPlus, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/shared/PageHeader';
import { getUsers, saveUsers } from '@/lib/auth';

export default function UserManagement() {
  const [users, setUsers] = useState(getUsers);
  const [form, setForm] = useState({ username: '', password: '', isEditor: false });
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const update = (u) => { setUsers(u); saveUsers(u); };

  const addUser = () => {
    if (!form.username.trim() || !form.password.trim()) return setError('Username and password required.');
    if (users.find(u => u.username.toLowerCase() === form.username.toLowerCase())) return setError('Username already exists.');
    update([...users, { username: form.username.trim(), password: form.password, isEditor: form.isEditor }]);
    setForm({ username: '', password: '', isEditor: false });
    setAdding(false);
    setError('');
  };

  const deleteUser = (username) => {
    if (users.length === 1) return setError('Cannot delete the last user.');
    update(users.filter(u => u.username !== username));
  };

  const toggleEditor = (username) => {
    update(users.map(u => u.username === username ? { ...u, isEditor: !u.isEditor } : u));
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      <PageHeader icon="👥" title="User Management" description="Add, remove, and manage user accounts and permissions." />

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
        {users.map(user => (
          <div key={user.username} className="bg-card rounded-2xl border border-border shadow-sm px-5 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                {user.isEditor ? <Shield className="w-5 h-5 text-primary" /> : <User className="w-5 h-5 text-muted-foreground" />}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{user.username}</p>
                <p className="text-xs text-muted-foreground">{user.isEditor ? 'Editor' : 'Student'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => toggleEditor(user.username)}>
                {user.isEditor ? 'Remove Editor' : 'Make Editor'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteUser(user.username)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}