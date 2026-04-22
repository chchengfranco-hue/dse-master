export default function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, danger }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mb-6">{description}</p>}
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-semibold border border-border hover:bg-border transition-colors select-none">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors select-none ${danger ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}