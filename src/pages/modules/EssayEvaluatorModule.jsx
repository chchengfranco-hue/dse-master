import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

// ─── Chat bubble ───────────────────────────────────────────────────────────
function FeedbackDisplay({ message }) {
  if (!message) return null;
  const isUser = message.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 text-base">🎓</div>
      )}
      <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown
            className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
            components={{
              h1: ({ children }) => <h1 className="text-base font-bold text-primary mt-3 mb-1">{children}</h1>,
              h2: ({ children }) => <h2 className="text-sm font-bold text-primary mt-3 mb-1">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
              ul: ({ children }) => <ul className="list-disc ml-4 space-y-0.5 my-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal ml-4 space-y-0.5 my-1">{children}</ol>,
              li: ({ children }) => <li className="text-sm">{children}</li>,
              p: ({ children }) => <p className="my-1">{children}</p>,
              blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/30 pl-3 italic text-muted-foreground my-2">{children}</blockquote>,
              code: ({ inline, children }) => inline
                ? <code className="bg-muted px-1 rounded text-xs font-mono">{children}</code>
                : <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto my-2"><code>{children}</code></pre>,
            }}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

// ─── Score Badge ────────────────────────────────────────────────────────────
function ScoreBadge({ label, score, max }) {
  const pct = max ? (score / max) * 100 : 0;
  const color = pct >= 75 ? 'text-green-700 bg-green-50 border-green-200' : pct >= 55 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-red-700 bg-red-50 border-red-200';
  return (
    <div className={`rounded-xl border px-3 py-2 text-center ${color}`}>
      <div className="text-xs font-medium mb-0.5">{label}</div>
      <div className="text-lg font-bold">{score}<span className="text-xs font-normal">/{max}</span></div>
    </div>
  );
}

// ─── Submission History Card ────────────────────────────────────────────────
function SubmissionCard({ sub, onView }) {
  const band = sub.dse_band;
  const bandColor = band >= 5 ? 'bg-green-100 text-green-800' : band >= 3 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';
  return (
    <div className="bg-card rounded-2xl border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-foreground text-sm truncate">{sub.title}</h3>
          {band && <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${bandColor}`}>Band {band}</span>}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.status === 'evaluated' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{sub.status}</span>
        </div>
        {sub.topic && <p className="text-xs text-muted-foreground mt-0.5">{sub.topic}</p>}
        <p className="text-xs text-muted-foreground mt-0.5">{new Date(sub.created_date).toLocaleDateString()}</p>
      </div>
      <button onClick={() => onView(sub)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors shrink-0">
        {sub.status === 'evaluated' ? 'View Feedback' : 'View'}
      </button>
    </div>
  );
}

// ─── Main Module ────────────────────────────────────────────────────────────
export default function EssayEvaluatorModule({ isEditor }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [view, setView] = useState('submit'); // 'submit' | 'evaluating' | 'history' | 'detail'
  const [essayTitle, setEssayTitle] = useState('');
  const [essayTopic, setEssayTopic] = useState('');
  const [essayQuestion, setEssayQuestion] = useState('');
  const [essayText, setEssayText] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const bottomRef = useRef(null);

  // Auto scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Load history
  const loadHistory = async () => {
    setHistoryLoading(true);
    const data = await base44.entities.EssaySubmission.list('-created_date', 30);
    setHistory(data);
    setHistoryLoading(false);
  };

  const handleSubmit = async () => {
    if (!essayText.trim() || essayText.trim().split(' ').length < 30) {
      alert('Please write at least 30 words before submitting.');
      return;
    }
    setLoading(true);
    setView('evaluating');
    setMessages([]);

    // Save to DB first
    const submission = await base44.entities.EssaySubmission.create({
      title: essayTitle || 'Untitled Essay',
      topic: essayTopic,
      question: essayQuestion,
      essay_text: essayText,
      status: 'pending',
    });

    // Create agent conversation
    const conv = await base44.agents.createConversation({
      agent_name: 'essay_evaluator',
      metadata: { submission_id: submission.id, title: essayTitle },
    });
    setConversation(conv);

    // Build the prompt
    const prompt = `Please evaluate the following HKDSE English essay.\n\n**Title:** ${essayTitle || 'Untitled'}\n${essayTopic ? `**Topic:** ${essayTopic}\n` : ''}${essayQuestion ? `**Exam Question:** ${essayQuestion}\n` : ''}\n**Essay:**\n\n${essayText}`;

    const userMsg = { role: 'user', content: prompt };
    setMessages([userMsg]);

    // Subscribe to response
    const unsubscribe = base44.agents.subscribeToConversation(conv.id, async (data) => {
      setMessages(data.messages || []);
      const lastMsg = (data.messages || []).slice(-1)[0];
      if (lastMsg?.role === 'assistant' && lastMsg?.content && !lastMsg?.content?.endsWith('…')) {
        // Extract scores from response (best-effort parse)
        const content = lastMsg.content;
        const contentScore = parseFloat(content.match(/Content[^:]*:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i)?.[1]) || null;
        const langScore = parseFloat(content.match(/Language[^:]*:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i)?.[1]) || null;
        const orgScore = parseFloat(content.match(/Organi[sz]ation[^:]*:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i)?.[1]) || null;
        const band = parseFloat(content.match(/(?:Overall\s+)?Band[:\s]+(\d(?:\.\d+)?)/i)?.[1]) || null;

        await base44.entities.EssaySubmission.update(submission.id, {
          feedback: content,
          status: 'evaluated',
          score_content: contentScore,
          score_language: langScore,
          score_organisation: orgScore,
          dse_band: band,
        });
        setLoading(false);
        unsubscribe();
      }
    });

    // Send message
    await base44.agents.addMessage(conv, userMsg);
  };

  const handleViewDetail = (sub) => {
    setActiveSubmission(sub);
    setView('detail');
  };

  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;

  // ── Submit view ──
  if (view === 'submit') return (
    <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Essay Evaluator</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered HKDSE essay feedback using DSE marking criteria</p>
        </div>
        <button onClick={() => { setView('history'); loadHistory(); }} className="px-3 py-1.5 bg-muted border border-border text-foreground rounded-lg text-sm hover:bg-border transition-colors">📋 My History</button>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input className="rounded-xl border border-input px-3 py-2 text-sm" placeholder="Essay title (e.g. Argumentative Essay — Climate)" value={essayTitle} onChange={e => setEssayTitle(e.target.value)} />
          <input className="rounded-xl border border-input px-3 py-2 text-sm" placeholder="Topic (e.g. Environment, Technology)" value={essayTopic} onChange={e => setEssayTopic(e.target.value)} />
        </div>
        <textarea className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm min-h-16 resize-y" placeholder="Exam question or prompt (optional but recommended for better feedback)" value={essayQuestion} onChange={e => setEssayQuestion(e.target.value)} />

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-semibold text-foreground">Your Essay</label>
            <span className={`text-xs font-medium ${wordCount < 200 ? 'text-amber-600' : wordCount > 500 ? 'text-green-600' : 'text-muted-foreground'}`}>{wordCount} words</span>
          </div>
          <textarea
            className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm min-h-64 resize-y leading-relaxed"
            placeholder="Paste or type your essay here. The AI examiner will evaluate it across Content, Language, and Organisation criteria..."
            value={essayText}
            onChange={e => setEssayText(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">Recommended: 350–500 words for full DSE Paper 2 evaluation.</p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || !essayText.trim()}
          className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🎓 Submit for AI Evaluation
        </button>
      </div>
    </div>
  );

  // ── Evaluating view ──
  if (view === 'evaluating') return (
    <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-foreground">Essay Evaluation</h2>
        <div className="flex gap-2">
          {!loading && (
            <button onClick={() => { setView('submit'); setEssayText(''); setEssayTitle(''); setEssayTopic(''); setEssayQuestion(''); setMessages([]); }} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors">
              + Submit New Essay
            </button>
          )}
          <button onClick={() => { setView('history'); loadHistory(); }} className="px-3 py-1.5 bg-muted border border-border text-foreground rounded-lg text-sm hover:bg-border transition-colors">📋 History</button>
        </div>
      </div>

      {loading && messages.length <= 1 && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-5 py-4 mb-4">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
          <p className="text-sm text-primary font-medium">The AI examiner is reading your essay and preparing detailed feedback…</p>
        </div>
      )}

      <div className="space-y-4">
        {messages.filter(m => m.role === 'assistant').map((m, i) => (
          <FeedbackDisplay key={i} message={m} />
        ))}
        {loading && messages.filter(m => m.role === 'assistant').length > 0 && (
          <div className="flex gap-2 items-center text-muted-foreground text-sm px-2">
            <div className="w-4 h-4 border-2 border-muted border-t-primary rounded-full animate-spin" />
            <span>Writing feedback…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );

  // ── History view ──
  if (view === 'history') return (
    <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Submission History</h1>
          <p className="text-sm text-muted-foreground mt-1">All your past essay submissions and feedback</p>
        </div>
        <button onClick={() => setView('submit')} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors">+ New Essay</button>
      </div>
      {historyLoading ? (
        <div className="text-center py-16"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto" /></div>
      ) : history.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">📝</p>
          <p>No submissions yet. Submit your first essay to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(sub => <SubmissionCard key={sub.id} sub={sub} onView={handleViewDetail} />)}
        </div>
      )}
    </div>
  );

  // ── Detail view ──
  if (view === 'detail' && activeSubmission) {
    const sub = activeSubmission;
    return (
      <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto">
        <button onClick={() => setView('history')} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm hover:bg-muted transition-colors mb-5">← Back to History</button>
        <h2 className="text-xl font-bold text-foreground mb-1">{sub.title}</h2>
        {sub.topic && <p className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full inline-block mb-4">{sub.topic}</p>}

        {/* Scores */}
        {(sub.score_content || sub.score_language || sub.score_organisation || sub.dse_band) && (
          <div className="grid grid-cols-4 gap-2 mb-5">
            {sub.score_content && <ScoreBadge label="Content" score={sub.score_content} max={10} />}
            {sub.score_language && <ScoreBadge label="Language" score={sub.score_language} max={10} />}
            {sub.score_organisation && <ScoreBadge label="Organisation" score={sub.score_organisation} max={10} />}
            {sub.dse_band && <ScoreBadge label="DSE Band" score={sub.dse_band} max={7} />}
          </div>
        )}

        {/* Essay text */}
        {sub.question && (
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 mb-4">
            <p className="text-xs font-bold text-sky-600 mb-1">📋 Exam Question</p>
            <p className="text-sm text-foreground">{sub.question}</p>
          </div>
        )}
        <div className="bg-muted/40 rounded-2xl border border-border p-4 mb-5">
          <p className="text-xs font-bold text-muted-foreground mb-2">YOUR ESSAY</p>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{sub.essay_text}</p>
        </div>

        {/* Feedback */}
        {sub.feedback ? (
          <div className="bg-card rounded-2xl border border-border p-5">
            <p className="text-xs font-bold text-primary mb-3">🎓 AI EXAMINER FEEDBACK</p>
            <ReactMarkdown
              className="prose prose-sm max-w-none text-sm"
              components={{
                h1: ({ children }) => <h1 className="text-base font-bold text-primary mt-3 mb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-sm font-bold text-primary mt-3 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
                ul: ({ children }) => <ul className="list-disc ml-4 space-y-0.5 my-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-4 space-y-0.5 my-1">{children}</ol>,
                p: ({ children }) => <p className="my-1">{children}</p>,
                blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/30 pl-3 italic text-muted-foreground my-2">{children}</blockquote>,
              }}
            >
              {sub.feedback}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">Feedback not yet available.</div>
        )}
      </div>
    );
  }

  return null;
}