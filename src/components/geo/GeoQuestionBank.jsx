import { useState } from 'react';
import { ChevronDown, Check, Printer, Copy } from 'lucide-react';

export default function GeoQuestionBank({ exercise, onBack }) {
  const [expandedQuestion, setExpandedQuestion] = useState(0);
  const [copied, setCopied] = useState(null);

  const handleCopyQuestion = async (qText) => {
    await navigator.clipboard.writeText(qText);
    setCopied(qText);
    setTimeout(() => setCopied(null), 2000);
  };

  const renderMCQQuestion = (q, idx) => (
    <div key={idx} className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Q{idx + 1}</p>
          <p className="text-sm text-foreground mt-2">{q.question_en}</p>
          <p className="text-xs text-muted-foreground mt-1">{q.question_zh}</p>
        </div>

        {q.template === 'statements' ? (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Statements</p>
            <div className="space-y-2 mb-3">
              {q.options_en.map((opt, i) => (
                <div key={i} className="bg-muted/50 rounded-lg p-2.5">
                  <p className="text-xs font-semibold text-foreground">({i + 1}) {opt}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{q.options_zh[i]}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Answer Combinations</p>
              <div className="grid grid-cols-4 gap-2">
                {['A', 'B', 'C', 'D'].map(letter => q.answers && q.answers[letter] && (
                  <div key={letter} className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-xs font-bold text-primary">{letter}</p>
                    <p className="text-xs text-foreground">{q.answers[letter]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Options</p>
            <div className="grid grid-cols-2 gap-2">
              {['A', 'B', 'C', 'D'].map((letter, i) => q.options_en[i] && (
                <div key={letter} className="bg-muted/50 rounded-lg p-2.5">
                  <p className="text-xs font-bold text-primary mb-1">{letter})</p>
                  <p className="text-xs text-foreground">{q.options_en[i]}</p>
                  <p className="text-xs text-muted-foreground mt-1">{q.options_zh[i]}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-green-800 mb-1">✓ Answer: {q.correct || q.answers?.A || 'A'}</p>
          <p className="text-sm text-green-700">{q.explanation_en}</p>
        </div>

        <button
          onClick={() => handleCopyQuestion(q.question_en)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border rounded-lg text-xs text-foreground hover:bg-border transition-colors"
        >
          {copied === q.question_en ? <><Check className="w-3 h-3 text-green-600" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
    </div>
  );

  const renderDataBasedQuestion = (q, idx) => (
    <div key={idx} className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpandedQuestion(expandedQuestion === idx ? -1 : idx)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-foreground">Q{idx + 1}</p>
          <p className="text-sm text-foreground mt-1">{q.context_en.substring(0, 100)}...</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedQuestion === idx ? 'rotate-180' : ''}`} />
      </button>
      {expandedQuestion === idx && (
        <div className="border-t border-border px-4 py-4 space-y-3 bg-muted/30">
          <p className="text-sm text-foreground font-medium">{q.context_en}</p>
          <div className="space-y-3">
            {q.sub_questions.map((sq, i) => (
              <div key={i} className="bg-white rounded-lg p-3 border border-border">
                <p className="text-sm font-semibold text-foreground">({sq.label}) {sq.question_en} [{sq.marks}m]</p>
                <p className="text-xs text-muted-foreground mt-1 italic">{sq.question_zh}</p>
                <div className="mt-2 bg-green-50 border border-green-200 rounded p-2">
                  <p className="text-xs font-semibold text-green-800">✓ Answer:</p>
                  <p className="text-xs text-green-700 mt-1">{sq.answer_en}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderEssayQuestion = (q, idx) => (
    <div key={idx} className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpandedQuestion(expandedQuestion === idx ? -1 : idx)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold text-foreground">Q{idx + 1} [{q.marks}m]</p>
          <p className="text-sm text-foreground mt-1">{q.question_en}</p>
          <p className="text-xs text-muted-foreground mt-1">{q.question_zh}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedQuestion === idx ? 'rotate-180' : ''}`} />
      </button>
      {expandedQuestion === idx && (
        <div className="border-t border-border px-4 py-4 space-y-3 bg-muted/30">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-800 mb-1">Guidance:</p>
            <p className="text-sm text-blue-700">{q.guidance_en}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-green-800 mb-1">✓ Model Answer:</p>
            <p className="text-sm text-green-700">{q.model_answer_en}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderQuestions = () => {
    if (exercise.type === 'mcq') {
      return exercise.questions.map((q, idx) => renderMCQQuestion(q, idx));
    } else if (exercise.type === 'data_based') {
      return exercise.questions.map((q, idx) => renderDataBasedQuestion(q, idx));
    } else if (exercise.type === 'short_essay') {
      return exercise.questions.map((q, idx) => renderEssayQuestion(q, idx));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{exercise.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {exercise.questions?.length || 0} question(s) · {exercise.topic}
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-muted border border-border rounded-lg text-sm font-medium text-foreground hover:bg-border transition-colors"
        >
          Back
        </button>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {renderQuestions()}
      </div>

      {/* Print button */}
      <button
        onClick={() => window.print()}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
      >
        <Printer className="w-4 h-4" /> Print Exercise
      </button>
    </div>
  );
}