import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import GeoTopicSelector from '@/components/geo/GeoTopicSelector';
import GeoExerciseResult from '@/components/geo/GeoExerciseResult';
import { Loader2, Globe, BookOpen, BarChart2, FileText } from 'lucide-react';

const ICONS = { mcq: BookOpen, data_based: BarChart2, short_essay: FileText };

const EXERCISE_TYPES = [
  { id: 'mcq', label: 'MCQ', labelZh: '多項選擇題', color: 'from-blue-500 to-blue-700', desc: '5 questions, 4 options each' },
  { id: 'data_based', label: 'Data-based', labelZh: '資料題', color: 'from-emerald-500 to-emerald-700', desc: '2 questions with sub-parts' },
  { id: 'short_essay', label: 'Short Essay', labelZh: '短答題', color: 'from-purple-500 to-purple-700', desc: '3 structured questions' },
];

export default function GeoExercise() {
  const [topic, setTopic] = useState('');
  const [exerciseType, setExerciseType] = useState('mcq');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) return setError('請先選擇或輸入題目 / Please select or enter a topic.');
    setError('');
    setLoading(true);
    setResult(null);
    const res = await base44.functions.invoke('generateGeoExercise', { topic: topic.trim(), type: exerciseType });
    setLoading(false);
    if (res.data?.success) {
      setResult(res.data);
    } else {
      setError(res.data?.error || 'Generation failed. Please try again.');
    }
  };

  const handleReset = () => { setResult(null); setError(''); };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/90 to-primary px-6 py-8 text-primary-foreground">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold">HKDSE Geography Exercise Generator</h1>
              <p className="text-sm text-primary-foreground/80">中學文憑試地理科練習產生器</p>
            </div>
          </div>
          <p className="text-xs text-primary-foreground/70 mt-2">Admin Tool · Bilingual (EN / 中文) · AI-powered</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {!result ? (
          <div className="space-y-6">
            {/* Topic Selector */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h2 className="text-sm font-bold text-foreground mb-1">1. Select Topic 選擇課題</h2>
              <p className="text-xs text-muted-foreground mb-4">Choose from the HKDSE syllabus or enter a custom topic</p>
              <GeoTopicSelector value={topic} onChange={setTopic} />
            </div>

            {/* Exercise Type */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h2 className="text-sm font-bold text-foreground mb-1">2. Exercise Type 題型</h2>
              <p className="text-xs text-muted-foreground mb-4">Select the type of questions to generate</p>
              <div className="grid grid-cols-3 gap-3">
                {EXERCISE_TYPES.map(({ id, label, labelZh, color, desc }) => {
                const Icon = ICONS[id];
                return (
                  <button
                    key={id}
                    onClick={() => setExerciseType(id)}
                    className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all ${exerciseType === id ? 'border-primary bg-primary/5' : 'border-border bg-background hover:bg-muted'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-foreground">{label}</p>
                      <p className="text-[10px] text-primary font-medium">{labelZh}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </button>
                );
              })}
              </div>
            </div>

            {error && <p className="text-sm text-destructive px-1">{error}</p>}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !topic}
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-base hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating... 生成中...</> : '⚡ Generate Exercise 產生練習'}
            </button>

            {loading && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
                <p className="text-sm font-semibold text-blue-800">AI is generating your bilingual exercise...</p>
                <p className="text-xs text-blue-600 mt-1">人工智能正在生成雙語練習，請稍候 (15–30 seconds)</p>
              </div>
            )}
          </div>
        ) : (
          <GeoExerciseResult result={result} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}