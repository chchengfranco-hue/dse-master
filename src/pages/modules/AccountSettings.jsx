import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/lib/UserContext';
import { getUsers, saveUsers } from '@/lib/auth';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

export default function AccountSettings() {
  const { currentUser, logout } = useUser();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDeleteAccount = () => {
    const users = getUsers().filter(u => u.username !== currentUser);
    saveUsers(users);
    logout();
    navigate('/');
  };

  return (
    <div className="px-4 lg:px-8 py-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-1">Account Settings</h1>
      <p className="text-sm text-muted-foreground mb-8">Manage your account preferences.</p>

      {/* Profile card */}
      <div className="bg-card rounded-2xl border border-border p-5 mb-6">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-2xl font-bold text-primary select-none">
            {currentUser?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-semibold text-foreground">{currentUser}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Logged in user</p>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-card rounded-2xl border border-red-200 p-5">
        <h2 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-3">Danger Zone</h2>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">Delete Account</p>
            <p className="text-xs text-muted-foreground mt-0.5">This will permanently remove your account. This action cannot be undone.</p>
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            className="shrink-0 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors select-none"
          >
            Delete
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete your account?"
        description="This will permanently delete your account and you will be logged out. This cannot be undone."
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}