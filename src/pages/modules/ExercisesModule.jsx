import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ClozeModule from './ClozeModule';
import GrammarModule from './GrammarModule';
import { Grid3X3, Layers, ClipboardList, CheckSquare, Plus, X } from 'lucide-react';

const EXERCISE_TYPES = [
  { id: 'fill', label: 'Fill-in-blank', icon: Grid3X3, description: 'Word bank / open input', path: '/cloze?type=bank', createPath: '/cloze/edit/new' },
  { id: 'mcqdrop', label: 'MCQ Dropdown', icon: Layers, description: 'Choose from options', path: '/cloze?type=mcq', createPath: '/cloze/edit/new' },
  { id: 'mccloze', label: 'MC Cloze', icon: ClipboardList, description: 'Passage + 4 options', path: '/cloze?type=mccloze', createPath: '/cloze/edit/new' },
  { id: 'grammar', label: 'Grammar MCQ', icon: CheckSquare, description: 'Grammar practice', path: '/grammar', createPath: '/grammar/edit/new' },
];

function CreateExerciseModal({ onClose }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-xl w-full sm:max-w-md p-5 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-foreground">Create Exercise — Choose Type</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {EXERCISE_TYPES.map(({ id, label, icon: Icon, description, createPath }) => (
            <button
              key={id}
              onClick={() => { navigate(createPath); onClose(); }}
              className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl border border-border bg-background hover:bg-primary/5 hover:border-primary/30 transition-all active:scale-[0.97]"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-foreground">{label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExerciseTypePicker({ isEditor }) {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  return (
    <div className="px-4 lg:px-8 py-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exercises</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose an exercise type to practice</p>
        </div>
        {isEditor && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors select-none"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {EXERCISE_TYPES.map(({ id, label, icon: Icon, description, path }) => (
          <button
            key={id}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-3 py-6 px-4 rounded-2xl border border-border bg-card hover:bg-primary/5 hover:border-primary/30 hover:shadow-md transition-all active:scale-[0.97]"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
          </button>
        ))}
      </div>
      {showCreate && <CreateExerciseModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

export default function ExercisesModule({ isEditor }) {
  const location = useLocation();

  if (location.pathname.startsWith('/cloze')) return <ClozeModule isEditor={isEditor} />;
  if (location.pathname.startsWith('/grammar')) return <GrammarModule isEditor={isEditor} />;
  return <ExerciseTypePicker isEditor={isEditor} />;
}