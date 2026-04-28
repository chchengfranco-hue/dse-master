import { useState } from 'react';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function GeoMCQView({ questions }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showZh, setShowZh] = useState(false);

  const score = submitted
    ? questions.filter((q, i) => answers[i] === q.correct).length
    : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <span className="text-sm font-semibold text-foreground">{questions.length} Questions</span>
        <div className="flex gap-2">
          <button onClick={() => setShowZh(v => !v)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${showZh ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-muted text-muted-foreground border-border'}`}>
            {showZh ? '🇬🇧 EN Only' : '🇭🇰 顯示中文'}
          </button>
          {submitted && (
            <button onClick={() => { setAnswers({}); setSubmitted(false); }} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90">
              🔄 Retry
            </button>
          )}
        </div>
      </div>

      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-5 text-center">
          <p className="text-lg font-bold text-green-800">Score: {score} / {questions.length}</p>
          <p className="text-sm text-green-600 mt-1">{score === questions.length ? '🎉 Perfect! 全對！' : score >= questions.length * 0.6 ? '👍 Good effort!' : '📚 Keep studying!'}</p>
        </div>
      )}

      <div className="space-y-5">
        {questions.map((q, qi) => {
          const userAns = answers[qi];
          const isCorrect = submitted && userAns === q.correct;
          const isWrong = submitted && userAns && !isCorrect;
          return (
            <div key={qi} className={`bg-card rounded-2xl border p-5 ${submitted ? isCorrect ? 'border-green-300' : isWrong ? 'border-red-300' : 'border-border' : 'border-border'}`}>
              <div className="flex items-start gap-2 mb-3">
                <span className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">{qi + 1}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{q.question_en}</p>
                  {showZh && <p className="text-sm text-muted-foreground mt-1">{q.question_zh}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {(q.options_en || []).map((opt, oi) => {
                  const letter = LETTERS[oi];
                  const selected = userAns === letter;
                  const isThisCorrect = submitted && letter === q.correct;
                  const isThisWrong = submitted && selected && !isThisCorrect;
                  return (
                    <button key={oi} disabled={submitted}
                      onClick={() => setAnswers(a => ({ ...a, [qi]: letter }))}
                      className={`flex items-start gap-2 px-4 py-3 rounded-xl border text-sm text-left transition-all
                        ${isThisCorrect ? 'bg-green-100 border-green-400 text-green-800' :
                        isThisWrong ? 'bg-red-100 border-red-400 text-red-700' :
                        selected ? 'bg-primary/10 border-primary text-primary' :
                        'bg-background border-border hover:bg-muted'}`}>
                      <span className={`shrink-0 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center
                        ${isThisCorrect ? 'bg-green-500 text-white' :
                        isThisWrong ? 'bg-red-500 text-white' :
                        selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{letter}</span>
                      <div>
                        <span>{opt}</span>
                        {showZh && q.options_zh?.[oi] && <span className="block text-xs text-muted-foreground">{q.options_zh[oi]}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm">
                  <p className="font-semibold text-blue-800">✅ Answer: {q.correct} — {q.explanation_en}</p>
                  {showZh && <p className="text-blue-700 mt-1">{q.explanation_zh}</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!submitted && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setSubmitted(true)}
            className="px-8 py-3 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-colors"
          >
            ✅ Submit Answers 提交答案
          </button>
        </div>
      )}
    </div>
  );
}