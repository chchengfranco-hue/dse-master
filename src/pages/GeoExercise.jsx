import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import GeoTopicSelector from '@/components/geo/GeoTopicSelector';
import GeoManualForm from '@/components/geo/GeoManualForm';
import GeoExerciseLibrary from '@/components/geo/GeoExerciseLibrary';
import GeoNavbar from '@/components/geo/GeoNavbar';
import GeoQuestionBank from '@/components/geo/GeoQuestionBank';
import GeoMockTestGenerator from '@/components/geo/GeoMockTestGenerator';
import { Loader2, Globe, BookOpen, BarChart2, FileText, PenTool, Library, Zap } from 'lucide-react';

const ICONS = { mcq: BookOpen, data_based: BarChart2, short_essay: FileText };

const EXERCISE_TYPES = [
  { id: 'mcq', label: 'MCQ', labelZh: '多項選擇題', color: 'from-blue-500 to-blue-700', desc: 'Add individual questions' },
  { id: 'data_based', label: 'Data-based', labelZh: '資料題', color: 'from-emerald-500 to-emerald-700', desc: 'Add data-based questions' },
  { id: 'short_essay', label: 'Short Essay', labelZh: '短答題', color: 'from-purple-500 to-purple-700', desc: 'Add essay questions' },
];

export default function GeoExercise() {
  const [view, setView] = useState('create'); // 'create' | 'library' | 'mocktest'
  const [topic, setTopic] = useState('');
  const [exerciseType, setExerciseType] = useState('mcq');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Manual input state
  const [showManualForm, setShowManualForm] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(null); // After input, show question bank

  const handleManualSubmit = async (data) => {
    setLoading(true);
    setError('');
    const res = await base44.functions.invoke('saveGeoExercise', data);
    setLoading(false);
    if (res.data?.success) {
      setCurrentExercise({ ...data, id: res.data.exercise_id });
      setShowManualForm(false);
    } else {
      setError(res.data?.error || 'Save failed. Please try again.');
    }
  };

  const handleReset = () => {
    setError('');
    setCurrentExercise(null);
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Navbar */}
      <GeoNavbar />

      {/* Show question bank after input */}
      {currentExercise && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <GeoQuestionBank
            exercise={currentExercise}
            onBack={() => {
              setCurrentExercise(null);
              setTopic('');
            }}
          />
        </div>
      )}

      {/* Main content */}
      {!currentExercise && (
        <>
          {/* Header */}
          <div className="bg-gradient-to-br from-primary/90 to-primary px-6 py-6 text-primary-foreground">
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
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-4 py-6">

        {/* View tabs */}
        <div className="flex gap-2 bg-muted p-1 rounded-xl mb-6">
          <button
            onClick={() => { setView('create'); setCurrentExercise(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${view === 'create' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <PenTool className="w-4 h-4" />
            Create 建立
          </button>
          <button
            onClick={() => { setView('mocktest'); setCurrentExercise(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${view === 'mocktest' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Zap className="w-4 h-4" />
            Mock Test 模試
          </button>
          <button
            onClick={() => { setView('library'); setCurrentExercise(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${view === 'library' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Library className="w-4 h-4" />
            Library 庫
          </button>
        </div>

        {/* Library view */}
        {view === 'library' && <GeoExerciseLibrary />}

        {/* Mock test view */}
        {view === 'mocktest' && <GeoMockTestGenerator />}

        {/* Create view */}
        {view === 'create' && <>

        {/* Manual form */}
        {showManualForm && (
          <GeoManualForm
            type={exerciseType}
            topic={topic}
            onSubmit={handleManualSubmit}
            onCancel={() => setShowManualForm(false)}
          />
        )}

        {/* Input form */}
        {!showManualForm && (
          <div className="space-y-5">

            {/* Topic Selector */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h2 className="text-sm font-bold text-foreground mb-1">1. Select Topic 選擇課題</h2>
              <p className="text-xs text-muted-foreground mb-4">Choose from the HKDSE syllabus or enter a custom topic</p>
              <GeoTopicSelector value={topic} onChange={setTopic} />
            </div>

            {/* Exercise Type */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h2 className="text-sm font-bold text-foreground mb-1">2. Exercise Type 題型</h2>
              <p className="text-xs text-muted-foreground mb-4">Select the type of questions to input</p>
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

            <button
              onClick={() => setShowManualForm(true)}
              disabled={!topic}
              className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-base hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
            >
              ✏️ Input Questions 輸入題目
            </button>

            {loading && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
                <p className="text-sm font-semibold text-blue-800">Saving...</p>
                <p className="text-xs text-blue-600 mt-1">Please wait</p>
              </div>
            )}
          </div>
        )}
          </>}
        </div>
        </>
      )}
    </div>
  );
}