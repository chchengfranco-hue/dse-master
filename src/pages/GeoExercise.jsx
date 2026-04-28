import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import GeoTopicSelector from '@/components/geo/GeoTopicSelector';
import GeoManualForm from '@/components/geo/GeoManualForm';
import GeoPdfResult from '@/components/geo/GeoPdfResult';
import GeoExerciseLibrary from '@/components/geo/GeoExerciseLibrary';
import { Loader2, Globe, BookOpen, BarChart2, FileText, Upload, PenTool, Library } from 'lucide-react';

const ICONS = { mcq: BookOpen, data_based: BarChart2, short_essay: FileText };

const EXERCISE_TYPES = [
  { id: 'mcq', label: 'MCQ', labelZh: '多項選擇題', color: 'from-blue-500 to-blue-700', desc: '5 questions, 4 options each' },
  { id: 'data_based', label: 'Data-based', labelZh: '資料題', color: 'from-emerald-500 to-emerald-700', desc: '2 questions with sub-parts' },
  { id: 'short_essay', label: 'Short Essay', labelZh: '短答題', color: 'from-purple-500 to-purple-700', desc: '3 structured questions' },
];

export default function GeoExercise() {
  const [view, setView] = useState('create'); // 'create' | 'library'
  const [mode, setMode] = useState('generate'); // 'generate' | 'pdf'
  const [topic, setTopic] = useState('');
  const [exerciseType, setExerciseType] = useState('mcq');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // PDF mode state
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfResult, setPdfResult] = useState(null);

  // Manual input state
  const [showManualForm, setShowManualForm] = useState(false);

  const handleManualSubmit = async (data) => {
    setLoading(true);
    setError('');
    const res = await base44.functions.invoke('saveGeoExercise', data);
    setLoading(false);
    if (res.data?.success) {
      setShowManualForm(false);
      setTopic('');
      alert('Exercise saved successfully!');
    } else {
      setError(res.data?.error || 'Save failed. Please try again.');
    }
  };

  const handlePdfExtract = async () => {
    if (!pdfFile) return setError('Please upload a PDF file first.');
    setError('');
    setLoading(true);
    setPdfResult(null);

    // Upload the file first
    const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfFile });

    // Then extract
    const res = await base44.functions.invoke('generateGeoExercise', { mode: 'pdf', pdf_url: file_url });
    setLoading(false);
    if (res.data?.success) {
      setPdfResult(res.data.markdown);
    } else {
      setError(res.data?.error || 'Extraction failed. Please try again.');
    }
  };

  const handleReset = () => { setPdfResult(null); setError(''); setPdfFile(null); };

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

        {/* View tabs */}
        <div className="flex gap-2 bg-muted p-1 rounded-xl mb-6">
          <button
            onClick={() => setView('create')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${view === 'create' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <PenTool className="w-4 h-4" />
            Create 建立
          </button>
          <button
            onClick={() => setView('library')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${view === 'library' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Library className="w-4 h-4" />
            Library 庫
          </button>
        </div>

        {/* Library view */}
        {view === 'library' && <GeoExerciseLibrary />}

        {/* Create view */}
        {view === 'create' && <>

        {/* PDF extraction result */}
        {pdfResult && <GeoPdfResult markdown={pdfResult} onReset={handleReset} />}

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
        {!pdfResult && !showManualForm && (
          <div className="space-y-5">

            {/* Mode tabs */}
            <div className="flex gap-2 bg-muted p-1 rounded-xl">
              <button
                onClick={() => { setMode('manual'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'manual' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <PenTool className="w-4 h-4" />
                Manual Input 手動輸入
              </button>
              <button
                onClick={() => { setMode('pdf'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'pdf' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Upload className="w-4 h-4" />
                Upload PDF 上傳試卷
              </button>
            </div>

            {mode === 'manual' && (
              <>
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
              </>
            )}

            {mode === 'pdf' && (
              <>
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                  <h2 className="text-sm font-bold text-foreground mb-1">Upload Past Paper PDF 上傳試卷</h2>
                  <p className="text-xs text-muted-foreground mb-4">
                    The AI will OCR your exam paper and convert it into a bilingual, structured exercise with answer keys and figure descriptions.
                  </p>

                  {/* Upload area */}
                  <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl py-10 px-4 cursor-pointer transition-all ${pdfFile ? 'border-primary bg-primary/5' : 'border-border bg-muted/40 hover:bg-muted hover:border-primary/40'}`}>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={e => { setPdfFile(e.target.files[0] || null); setError(''); }}
                    />
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    {pdfFile ? (
                      <div className="text-center">
                        <p className="text-sm font-semibold text-primary">{pdfFile.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{(pdfFile.size / 1024).toFixed(0)} KB · Click to change</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm font-semibold text-foreground">Click to upload PDF</p>
                        <p className="text-xs text-muted-foreground mt-1">HKDSE past paper or test paper</p>
                      </div>
                    )}
                  </label>

                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 space-y-1">
                    <p className="font-semibold">What the AI will produce:</p>
                    <ul className="list-disc ml-4 space-y-0.5">
                      <li>Bilingual questions (English + 繁體中文)</li>
                      <li>High-detail figure/diagram descriptions</li>
                      <li>Markdown tables for data/graphs</li>
                      <li>Collapsible answer keys with side-by-side EN/中文 explanations</li>
                    </ul>
                  </div>
                </div>

                {error && <p className="text-sm text-destructive px-1">{error}</p>}

                <button
                  onClick={handlePdfExtract}
                  disabled={loading || !pdfFile}
                  className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-base hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
                >
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing PDF... 處理中...</> : '📄 Extract & Convert 提取並轉換'}
                </button>
              </>
            )}

            {loading && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
                <p className="text-sm font-semibold text-blue-800">AI is processing your request...</p>
                <p className="text-xs text-blue-600 mt-1">人工智能正在處理，請稍候 (15–60 seconds)</p>
              </div>
            )}
          </div>
        )}
        </>}
      </div>
    </div>
  );
}