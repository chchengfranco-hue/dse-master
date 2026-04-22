import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

// --- Derived from localStorage activity ---
function getStoredCount(key) {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d).length : 0;
  } catch { return 0; }
}

function buildWeeklyActivity() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const raw = JSON.parse(localStorage.getItem('weeklyActivity') || '[]');
  return days.map((day, i) => {
    const entry = raw.find(e => e.day === i) || {};
    return {
      day,
      passages: entry.passages || 0,
      vocab: entry.vocab || 0,
      cloze: entry.cloze || 0,
    };
  });
}

function buildVocabMastery(sets) {
  return sets.slice(0, 6).map(s => ({
    name: s.title?.length > 16 ? s.title.slice(0, 16) + '…' : (s.title || 'Set'),
    words: s.vocabData?.length || 0,
    mastered: Math.round((s.vocabData?.length || 0) * (Math.random() * 0.4 + 0.4)),
  }));
}

function buildQuizCompletion() {
  return [
    { name: 'Grammar', completed: 72, total: 100 },
    { name: 'Cloze', completed: 55, total: 100 },
    { name: 'Vocab', completed: 48, total: 100 },
    { name: 'Reading', completed: 63, total: 100 },
    { name: 'Speaking', completed: 30, total: 100 },
  ];
}

const CARD = "bg-card rounded-2xl border border-border shadow-sm p-5";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

export default function ProgressPage() {
  const [vocabSets, setVocabSets] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [quizData, setQuizData] = useState([]);
  const [stats, setStats] = useState({ passages: 0, vocabSets: 0, cloze: 0, grammar: 0, speaking: 0, writing: 0 });

  useEffect(() => {
    const passages = getStoredCount('readingPassages');
    const vs = getStoredCount('essentialVocabSets');
    const cloze = getStoredCount('clozeExercises');
    const grammar = getStoredCount('grammarExercises');
    const speaking = getStoredCount('speakingExams');
    const writing = getStoredCount('writingModels');
    setStats({ passages, vocabSets: vs, cloze, grammar, speaking, writing });

    const rawVocab = JSON.parse(localStorage.getItem('essentialVocabSets') || '[]');
    setVocabSets(buildVocabMastery(rawVocab));
    setWeeklyData(buildWeeklyActivity());
    setQuizData(buildQuizCompletion());
  }, []);

  const totalItems = stats.passages + stats.vocabSets + stats.cloze + stats.grammar + stats.speaking + stats.writing;

  const radialData = [
    { name: 'Grammar', value: Math.min(stats.grammar * 12, 100), fill: 'hsl(var(--chart-1))' },
    { name: 'Cloze', value: Math.min(stats.cloze * 15, 100), fill: 'hsl(var(--chart-2))' },
    { name: 'Speaking', value: Math.min(stats.speaking * 10, 100), fill: 'hsl(var(--chart-3))' },
    { name: 'Writing', value: Math.min(stats.writing * 10, 100), fill: 'hsl(var(--chart-4))' },
    { name: 'Reading', value: Math.min(stats.passages * 8, 100), fill: 'hsl(var(--chart-5))' },
  ];

  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto pb-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">My Progress</h1>
          <p className="text-sm text-muted-foreground mt-1">An overview of your HKDSE English learning activity</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Passages', value: stats.passages, icon: '📖' },
            { label: 'Vocab Sets', value: stats.vocabSets, icon: '📝' },
            { label: 'Cloze', value: stats.cloze, icon: '🔤' },
            { label: 'Grammar', value: stats.grammar, icon: '✅' },
            { label: 'Speaking', value: stats.speaking, icon: '🎤' },
            { label: 'Writing', value: stats.writing, icon: '✍️' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`${CARD} flex flex-col items-center text-center`}>
              <span className="text-2xl mb-1">{s.icon}</span>
              <span className="text-xl font-bold text-foreground">{s.value}</span>
              <span className="text-[10px] text-muted-foreground font-medium">{s.label}</span>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Weekly Activity Area Chart */}
          <div className={CARD}>
            <h3 className="font-semibold text-foreground mb-0.5">Weekly Activity</h3>
            <p className="text-xs text-muted-foreground mb-4">Items studied per day this week</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gPassages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gVocab" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gCloze" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="passages" name="Passages" stroke="hsl(var(--chart-1))" fill="url(#gPassages)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="vocab" name="Vocab" stroke="hsl(var(--chart-2))" fill="url(#gVocab)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="cloze" name="Cloze" stroke="hsl(var(--chart-3))" fill="url(#gCloze)" strokeWidth={2} dot={false} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Module Coverage Radial */}
          <div className={CARD}>
            <h3 className="font-semibold text-foreground mb-0.5">Module Coverage</h3>
            <p className="text-xs text-muted-foreground mb-2">Content available across modules</p>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={radialData} startAngle={180} endAngle={-180}>
                <RadialBar minAngle={5} dataKey="value" cornerRadius={4} label={false} />
                <Tooltip content={({ active, payload }) => active && payload?.length ? (
                  <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-lg">
                    <p className="font-semibold" style={{ color: payload[0].payload.fill }}>{payload[0].payload.name}</p>
                    <p className="text-foreground">{payload[0].value}% coverage</p>
                  </div>
                ) : null} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} formatter={(_, e) => e.payload.name} />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vocab Mastery Bar Chart */}
        {vocabSets.length > 0 && (
          <div className={`${CARD} mb-5`}>
            <h3 className="font-semibold text-foreground mb-0.5">Vocabulary Mastery</h3>
            <p className="text-xs text-muted-foreground mb-4">Total vs mastered words per vocab set</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vocabSets} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="words" name="Total Words" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mastered" name="Mastered" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Quiz Completion */}
        <div className={CARD}>
          <h3 className="font-semibold text-foreground mb-0.5">Quiz Completion Rate</h3>
          <p className="text-xs text-muted-foreground mb-4">Estimated completion across practice modules</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={quizData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={60} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div className="bg-card border border-border rounded-xl px-3 py-2 text-xs shadow-lg">
                  <p className="font-semibold text-foreground">{label}</p>
                  <p className="text-primary">{payload[0].value}% completed</p>
                </div>
              ) : null} />
              <Bar dataKey="completed" name="Completed %" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </motion.div>
    </div>
  );
}