import { useState } from 'react';
import { Plus, Trash2, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/shared/PageHeader';

const defaultExercises = [
  {
    id: 1,
    title: 'Environment Vocabulary',
    parts: [
      { sentence: 'The government should invest more in ___ energy sources such as solar and wind power.', answer: 'renewable', hint: 're___able' },
      { sentence: '___ gases trap heat in the atmosphere, causing global warming.', answer: 'Greenhouse', hint: 'G___house' },
      { sentence: 'Factories must reduce their ___ of harmful chemicals into rivers.', answer: 'discharge', hint: 'dis___ge' },
    ],
  },
  {
    id: 2,
    title: 'Technology Vocabulary',
    parts: [
      { sentence: 'The rapid ___ of smartphones has changed the way we communicate.', answer: 'proliferation', hint: 'pro___ion' },
      { sentence: 'Teenagers are becoming increasingly ___ on social media.', answer: 'dependent', hint: 'de___ent' },
    ],
  },
];

const STORAGE_KEY = 'clozeExercises';
const load = () => { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : defaultExercises; };
const save = (d) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d));

export default function ClozeModule({ isEditor }) {
  const [exercises, setExercises] = useState(load);
  const [active, setActive] = useState(null);
  const [answers, setAnswers] = useState({});
  const [checked, setChecked] = useState(false);

  const update = (d) => { setExercises(d); save(d); };

  const startExercise = (ex) => {
    setActive(ex);
    setAnswers({});
    setChecked(false);
  };

  const checkAnswers = () => setChecked(true);
  const reset = () => { setAnswers({}); setChecked(false); };

  const score = active
    ? active.parts.filter((p, i) => answers[i]?.toLowerCase().trim() === p.answer.toLowerCase()).length
    : 0;

  if (active) {
    return (
      <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
        <button onClick={() => setActive(null)} className="text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">← Back</button>
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <h2 className="text-lg font-bold text-foreground mb-6">{active.title}</h2>
          <div className="space-y-6">
            {active.parts.map((part, i) => {
              const isCorrect = checked && answers[i]?.toLowerCase().trim() === part.answer.toLowerCase();
              const isWrong = checked && answers[i] !== undefined && !isCorrect;
              const segments = part.sentence.split('___');
              return (
                <div key={i} className="bg-muted/50 rounded-xl p-4">
                  <p className="text-sm text-foreground leading-relaxed mb-3 flex flex-wrap items-center gap-1">
                    {segments.map((seg, si) => (
                      <span key={si}>
                        {seg}
                        {si < segments.length - 1 && (
                          <input
                            type="text"
                            disabled={checked}
                            value={answers[i] || ''}
                            onChange={e => setAnswers(p => ({ ...p, [i]: e.target.value }))}
                            className={`inline-block border-b-2 bg-transparent text-sm px-1 min-w-24 outline-none transition-colors ${
                              isCorrect ? 'border-green-500 text-green-600' :
                              isWrong ? 'border-destructive text-destructive' :
                              'border-primary text-foreground'
                            }`}
                          />
                        )}
                      </span>
                    ))}
                  </p>
                  {checked && (
                    <p className={`text-xs font-medium ${isCorrect ? 'text-green-600' : 'text-destructive'}`}>
                      {isCorrect ? '✓ Correct!' : `✗ Answer: ${part.answer}`}
                    </p>
                  )}
                  {!checked && part.hint && <p className="text-xs text-muted-foreground">Hint: {part.hint}</p>}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
            {checked && (
              <span className="text-sm font-semibold text-foreground">
                Score: <span className="text-primary">{score}/{active.parts.length}</span>
              </span>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={reset}><RotateCcw className="w-4 h-4 mr-1" />Reset</Button>
              {!checked && <Button size="sm" onClick={checkAnswers}><CheckCircle2 className="w-4 h-4 mr-1" />Check</Button>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      <PageHeader icon="📝" title="Vocabulary Exercises" description="Practice filling in the blanks with contextually appropriate vocabulary." />
      <div className="grid gap-4">
        {exercises.map(ex => (
          <div key={ex.id} className="bg-card rounded-2xl border border-border shadow-sm p-5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            onClick={() => startExercise(ex)}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{ex.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{ex.parts.length} blanks to fill</p>
              </div>
              <Button size="sm" onClick={e => { e.stopPropagation(); startExercise(ex); }}>Start</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}