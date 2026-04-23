import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { BookOpen, PenTool, Grid3X3, Book, MessageSquare, CheckSquare, TrendingUp, Star } from 'lucide-react';

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

const MODULES = [
  { key: 'reading',  label: 'Reading Passages',    icon: BookOpen,    color: 'from-purple-500 to-purple-700',   entity: 'ReadingPassage' },
  { key: 'writing',  label: 'Writing Models',       icon: PenTool,     color: 'from-blue-500 to-blue-700',      entity: 'WritingModel' },
  { key: 'cloze',    label: 'Cloze Exercises',      icon: Grid3X3,     color: 'from-amber-500 to-amber-700',    entity: 'ClozeExercise' },
  { key: 'vocab',    label: 'Essential Vocabulary', icon: Book,        color: 'from-emerald-500 to-emerald-700', entity: 'VocabSet' },
  { key: 'speaking', label: 'Speaking Exams',       icon: MessageSquare, color: 'from-rose-500 to-rose-700',   entity: 'SpeakingExam' },
  { key: 'grammar',  label: 'Grammar Exercises',    icon: CheckSquare, color: 'from-indigo-500 to-indigo-700',  entity: 'GrammarExercise' },
];

// localStorage keys for tracking which items a student has opened
const VIEWED_KEY = (entity) => `progress_viewed_${entity}`;

function getViewedIds(entity) {
  try { return new Set(JSON.parse(localStorage.getItem(VIEWED_KEY(entity)) || '[]')); } catch { return new Set(); }
}

export function markViewed(entity, id) {
  try {
    const ids = getViewedIds(entity);
    ids.add(String(id));
    localStorage.setItem(VIEWED_KEY(entity), JSON.stringify([...ids]));
  } catch {}
}

export default function Progress() {
  const [counts, setCounts] = useState({});
  const [viewed, setViewed] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const results = await Promise.all(
        MODULES.map(m => base44.entities[m.entity].list('-created_date', 500).catch(() => []))
      );
      const c = {};
      const v = {};
      MODULES.forEach((m, i) => {
        const published = results[i].filter(r => r.status === 'published' || r.is_published !== false);
        c[m.key] = published.length;
        const viewedIds = getViewedIds(m.entity);
        v[m.key] = published.filter(r => viewedIds.has(String(r.id))).length;
      });
      setCounts(c);
      setViewed(v);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const totalAvailable = Object.values(counts).reduce((a, b) => a + b, 0);
  const totalViewed = Object.values(viewed).reduce((a, b) => a + b, 0);
  const overallPct = totalAvailable > 0 ? Math.round((totalViewed / totalAvailable) * 100) : 0;

  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/25">
            <TrendingUp className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Learning Progress</h1>
            <p className="text-sm text-muted-foreground">Track the materials you've explored across all modules</p>
          </div>
        </div>
      </motion.div>

      {/* Overall summary */}
      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.1 }} className="bg-card rounded-2xl border border-border p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground font-medium">Overall Completion</p>
            <p className="text-3xl font-bold text-primary">{overallPct}%</p>
            <p className="text-sm text-muted-foreground mt-1">{totalViewed} of {totalAvailable} items explored</p>
          </div>
          <div className="w-20 h-20 relative">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - overallPct / 100)}`}
                strokeLinecap="round" className="transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Star className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${overallPct}%` }} />
        </div>
      </motion.div>

      {/* Per-module cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MODULES.map((m, i) => {
            const Icon = m.icon;
            const total = counts[m.key] || 0;
            const done = viewed[m.key] || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <motion.div key={m.key} {...fadeUp} transition={{ duration: 0.4, delay: 0.15 + i * 0.05 }}
                className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">{m.label}</h3>
                    <p className="text-xs text-muted-foreground">{total} items available</p>
                  </div>
                  <span className={`text-sm font-bold ${pct === 100 ? 'text-emerald-600' : 'text-primary'}`}>{pct}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${m.color}`}
                    style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{done} of {total} explored</p>
              </motion.div>
            );
          })}
        </div>
      )}

      <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.5 }}
        className="mt-6 bg-accent/50 border border-accent rounded-2xl p-4 text-center">
        <p className="text-sm text-muted-foreground">
          📌 Progress is tracked on this device. Open any passage, essay, exercise or vocab set to mark it as explored.
        </p>
      </motion.div>
    </div>
  );
}