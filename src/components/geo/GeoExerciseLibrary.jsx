import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Trash2, Copy, Printer, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function GeoExerciseLibrary() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    setLoading(true);
    const data = await base44.entities.GeoExercise.list('-updated_date', 100);
    setExercises(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this exercise?')) return;
    await base44.entities.GeoExercise.delete(id);
    setExercises(prev => prev.filter(e => e.id !== id));
  };

  const handleCopyMarkdown = async (exercise) => {
    const markdown = generateMarkdown(exercise);
    await navigator.clipboard.writeText(markdown);
    setCopied(exercise.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handlePrint = async (exercise) => {
    const markdown = generateMarkdown(exercise);
    const pdf = new jsPDF();
    const title = `${exercise.topic} - ${exercise.type}`;
    pdf.text(title, 10, 10);
    pdf.text(markdown, 10, 20);
    pdf.save(`${title}.pdf`);
  };

  const generateMarkdown = (exercise) => {
    let md = `# ${exercise.topic}\n**Type:** ${exercise.type}\n\n`;
    if (exercise.type === 'mcq') {
      exercise.questions.forEach((q, i) => {
        md += `## Q${i + 1}\n${q.question_en}\n\n**中文：** ${q.question_zh}\n\n`;
        q.options_en.forEach((opt, j) => {
          md += `${String.fromCharCode(65 + j)}) ${opt}\n`;
        });
        md += `\n**Answer:** ${q.correct}\n${q.explanation_en}\n\n`;
      });
    } else if (exercise.type === 'data_based') {
      exercise.questions.forEach((q, i) => {
        md += `## Q${i + 1}\n${q.context_en}\n\n`;
        q.sub_questions.forEach(sq => {
          md += `(${sq.label}) ${sq.question_en} [${sq.marks} marks]\n`;
          md += `**Answer:** ${sq.answer_en}\n\n`;
        });
      });
    } else if (exercise.type === 'short_essay') {
      exercise.questions.forEach((q, i) => {
        md += `## Q${i + 1} [${q.marks} marks]\n${q.question_en}\n\n`;
        md += `**Guidance:** ${q.guidance_en}\n`;
        md += `**Model Answer:** ${q.model_answer_en}\n\n`;
      });
    }
    return md;
  };



  const filtered = filterType === 'all' ? exercises : exercises.filter(e => e.type === filterType);

  // Group by topic
  const groupedByTopic = filtered.reduce((acc, ex) => {
    if (!acc[ex.topic]) acc[ex.topic] = [];
    acc[ex.topic].push(ex);
    return acc;
  }, {});

  const topicGroups = Object.entries(groupedByTopic).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Saved Exercises 已儲存的練習</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} exercise(s)</p>
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm"
        >
          <option value="all">All Types</option>
          <option value="mcq">MCQ</option>
          <option value="data_based">Data-based</option>
          <option value="short_essay">Short Essay</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading exercises...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-muted rounded-2xl p-8 text-center text-muted-foreground">
          <p className="text-sm font-semibold">No exercises saved yet</p>
          <p className="text-xs mt-1">Create a new exercise to get started</p>
        </div>
      ) : (
        <div className="space-y-5">
          {topicGroups.map(([topic, exs]) => (
            <div key={topic}>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide mb-2 px-1">{topic}</h3>
              <div className="space-y-2">
                {exs.map(ex => (
                  <div key={ex.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">{ex.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ex.questions?.length || 0} question(s) · {ex.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => handleCopyMarkdown(ex)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-border rounded-lg text-sm text-foreground transition-colors"
                      >
                        {copied === ex.id ? <><Check className="w-4 h-4 text-green-600" /> Copied!</> : <><Copy className="w-4 h-4" /> Markdown</>}
                      </button>
                      <button
                        onClick={() => handlePrint(ex)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-border rounded-lg text-sm text-foreground transition-colors"
                      >
                        <Printer className="w-4 h-4" /> Print
                      </button>
                      <button
                        onClick={() => handleDelete(ex.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-sm text-destructive transition-colors ml-auto"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}