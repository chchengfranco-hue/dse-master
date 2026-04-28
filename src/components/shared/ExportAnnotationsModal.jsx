import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Download, Loader2, CheckCircle } from 'lucide-react';

const ENTITY_SOURCES = [
  { key: 'ReadingPassage', label: 'Reading Passages' },
  { key: 'WritingModel', label: 'Writing Models' },
  { key: 'ClozeExercise', label: 'Cloze Exercises' },
  { key: 'SpeakingExam', label: 'Speaking Exams' },
];

export default function ExportAnnotationsModal({ onClose, onDone }) {
  const [step, setStep] = useState('config'); // config | loading | done
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [selectedSources, setSelectedSources] = useState(['ReadingPassage', 'WritingModel', 'ClozeExercise', 'SpeakingExam']);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const toggleSource = (key) => {
    setSelectedSources(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key]);
  };

  const handleExport = async () => {
    if (!title.trim()) return setError('Please enter a title for the new vocab set.');
    setError('');
    setStep('loading');

    // Collect all annotations from selected entity sources
    const allWords = new Set();
    for (const src of selectedSources) {
      const items = await base44.entities[src].list('-created_date', 500);
      items.forEach(item => {
        const anns = item.annotations || {};
        Object.keys(anns).forEach(word => {
          if (word && word.trim().length > 1) allWords.add(word.trim());
        });
      });
    }

    if (allWords.size === 0) {
      setStep('config');
      return setError('No annotations found in the selected sources.');
    }

    const res = await base44.functions.invoke('exportAnnotationsToVocab', {
      title: title.trim(),
      topic: topic.trim() || 'General',
      subtopic: subtopic.trim() || 'General',
      words: Array.from(allWords).slice(0, 150), // cap at 150 words
    });

    if (res.data?.success) {
      setResult(res.data);
      setStep('done');
    } else {
      setStep('config');
      setError(res.data?.error || 'Export failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-xl w-full sm:max-w-lg p-6 z-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-foreground">Export Annotations → Essential Vocab</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Collect all annotated words and auto-complete with AI</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        {step === 'config' && (
          <>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Vocab Set Title <span className="text-destructive">*</span></label>
                <input
                  className="w-full rounded-xl border border-input px-3 py-2 text-sm"
                  placeholder="e.g. Annotated Words — Environment"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Topic</label>
                  <input className="w-full rounded-xl border border-input px-3 py-2 text-sm" placeholder="e.g. Environment" value={topic} onChange={e => setTopic(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">Sub-topic</label>
                  <input className="w-full rounded-xl border border-input px-3 py-2 text-sm" placeholder="e.g. Climate" value={subtopic} onChange={e => setSubtopic(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-foreground mb-2 block">Collect annotations from:</label>
              <div className="grid grid-cols-2 gap-2">
                {ENTITY_SOURCES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleSource(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all text-left ${selectedSources.includes(key) ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selectedSources.includes(key) ? 'bg-primary border-primary' : 'border-border'}`}>
                      {selectedSources.includes(key) && <span className="text-white text-[10px] font-bold">✓</span>}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-destructive mb-3">{error}</p>}

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-xs text-amber-800">
              <strong>How it works:</strong> All annotation words from selected sources are collected, then AI auto-fills the part of speech, meaning, and example sentence. The new vocab set is saved as a <strong>Draft</strong> in Essential Vocabulary for review.
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExport}
                disabled={selectedSources.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export & Auto-complete
              </button>
              <button onClick={onClose} className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-semibold hover:bg-border border border-border">Cancel</button>
            </div>
          </>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center py-10 gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div className="text-center">
              <p className="font-semibold text-foreground">Collecting annotations &amp; generating vocab...</p>
              <p className="text-sm text-muted-foreground mt-1">AI is filling in PoS, meanings, and examples. This may take 15–30 seconds.</p>
            </div>
          </div>
        )}

        {step === 'done' && result && (
          <div className="flex flex-col items-center py-8 gap-4 text-center">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <div>
              <p className="text-lg font-bold text-foreground">Export Complete!</p>
              <p className="text-sm text-muted-foreground mt-1">{result.count} words exported to Essential Vocabulary as a <strong>Draft</strong>.</p>
            </div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => { onDone?.(); onClose(); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90">Go to Essential Vocab</button>
              <button onClick={onClose} className="px-4 py-2 bg-muted text-foreground rounded-xl text-sm font-semibold hover:bg-border border border-border">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}