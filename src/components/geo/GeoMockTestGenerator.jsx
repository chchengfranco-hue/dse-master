import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Download, FileText } from 'lucide-react';

export default function GeoMockTestGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mockTest, setMockTest] = useState(null);

  const generateMockTest = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await base44.functions.invoke('generateGeoMockTest', {});
      if (res.data?.success) {
        setMockTest(res.data.mockTest);
      } else {
        setError(res.data?.error || 'Failed to generate mock test');
      }
    } catch (err) {
      setError('Error generating mock test');
    }
    setLoading(false);
  };

  const exportAsWord = async () => {
    if (!mockTest) return;
    const res = await base44.functions.invoke('exportGeoMockTestWord', { mockTest });
    if (res.data?.download_url) {
      window.open(res.data.download_url, '_blank');
    }
  };

  const exportAsPdf = async () => {
    if (!mockTest) return;
    const res = await base44.functions.invoke('exportGeoMockTestPdf', { mockTest });
    if (res.data?.download_url) {
      window.open(res.data.download_url, '_blank');
    }
  };

  if (!mockTest) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
          <Loader2 className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Generate Mock Test</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Creates a full exam: 20 MCQs, 3 data-based questions, 4 short essays
          </p>
        </div>
        <button
          onClick={generateMockTest}
          disabled={loading}
          className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Loader2 className="w-5 h-5" />
              Generate Mock Test
            </>
          )}
        </button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Mock Test Generated</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {mockTest.mcq?.length || 0} MCQs • {mockTest.dataBased?.length || 0} Data-based • {mockTest.essay?.length || 0} Essays
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* MCQ Section */}
          {mockTest.mcq && (
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-bold text-foreground mb-3">Section A: Multiple Choice ({mockTest.mcq.length})</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {mockTest.mcq.map((q, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-foreground">Q{i + 1}: {q.question_en}</p>
                    <p className="text-xs text-muted-foreground mt-1">{q.question_zh}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data-based Section */}
          {mockTest.dataBased && (
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-bold text-foreground mb-3">Section B: Data-based Questions ({mockTest.dataBased.length})</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {mockTest.dataBased.map((q, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-foreground">Q{20 + i + 1}: {q.context_en?.substring(0, 60)}...</p>
                    <p className="text-xs text-muted-foreground mt-1">Sub-questions: {q.sub_questions?.length || 0}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Essay Section */}
          {mockTest.essay && (
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-bold text-foreground mb-3">Section C: Short Essays ({mockTest.essay.length})</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {mockTest.essay.map((q, i) => (
                  <div key={i} className="bg-muted/50 rounded-lg p-3 text-sm">
                    <p className="font-medium text-foreground">Q{23 + i + 1}: {q.question_en?.substring(0, 60)}... [{q.marks}m]</p>
                    <p className="text-xs text-muted-foreground mt-1">{q.question_zh?.substring(0, 60)}...</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={exportAsWord}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-semibold transition-colors"
          >
            <FileText className="w-4 h-4" />
            Word (.docx)
          </button>
          <button
            onClick={exportAsPdf}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      <button
        onClick={() => setMockTest(null)}
        className="w-full py-2.5 bg-muted text-foreground rounded-lg font-semibold hover:bg-border transition-colors"
      >
        Generate Another
      </button>
    </div>
  );
}