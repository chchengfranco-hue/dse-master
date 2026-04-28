import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import ClozeModule from './ClozeModule';
import GrammarModule from './GrammarModule';
import { Grid3X3, Layers, ClipboardList, CheckSquare } from 'lucide-react';

const EXERCISE_TYPES = [
  { id: 'fill', label: 'Fill-in-blank', icon: Grid3X3, description: 'Word bank / open input', path: '/cloze' },
  { id: 'mcqdrop', label: 'MCQ Dropdown', icon: Layers, description: 'Choose from options', path: '/cloze' },
  { id: 'mccloze', label: 'MC Cloze', icon: ClipboardList, description: 'Passage + 4 options', path: '/cloze' },
  { id: 'grammar', label: 'Grammar MCQ', icon: CheckSquare, description: 'Grammar practice', path: '/grammar' },
];

function ExerciseTypePicker() {
  const navigate = useNavigate();
  return (
    <div className="px-4 lg:px-8 py-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Exercises</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose an exercise type to practice</p>
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
    </div>
  );
}

export default function ExercisesModule({ isEditor }) {
  const location = useLocation();

  if (location.pathname.startsWith('/cloze')) return <ClozeModule isEditor={isEditor} />;
  if (location.pathname.startsWith('/grammar')) return <GrammarModule isEditor={isEditor} />;
  return <ExerciseTypePicker />;
}