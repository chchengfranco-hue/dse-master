import { motion } from 'framer-motion';
import StatCard from '../components/dashboard/StatCard';
import SkillCard from '../components/dashboard/SkillCard';
import RecentActivity from '../components/dashboard/RecentActivity';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  return (
    <div className="px-4 lg:px-8 py-6 max-w-6xl mx-auto">
      {/* Hero greeting */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <p className="text-sm text-muted-foreground mb-1">Welcome back 👋</p>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
          Ready to practice?
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Keep up your daily streak and master HKDSE English.
        </p>
      </motion.div>

      {/* Stats row */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8"
      >
        <StatCard icon="🔥" value="7" label="Day Streak" sublabel="+2 this week" />
        <StatCard icon="📝" value="24" label="Tasks Done" sublabel="Top 15%" />
        <StatCard icon="⏱️" value="12h" label="Study Time" />
        <StatCard icon="🎯" value="82%" label="Avg. Score" sublabel="+5% this month" />
      </motion.div>

      {/* Skill cards */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Practice Skills</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkillCard
            to="/reading"
            icon="📖"
            title="Reading"
            description="Comprehension passages, vocabulary, and text analysis"
            taskCount={12}
            color="purple"
          />
          <SkillCard
            to="/writing"
            icon="✍️"
            title="Writing"
            description="Essays, emails, articles, and creative writing tasks"
            taskCount={8}
            color="blue"
          />
          <SkillCard
            to="/listening"
            icon="🎧"
            title="Listening"
            description="Audio comprehension, note-taking, and dictation"
            taskCount={10}
            color="amber"
          />
          <SkillCard
            to="/speaking"
            icon="🎤"
            title="Speaking"
            description="Individual presentation and group discussion practice"
            taskCount={6}
            color="rose"
          />
        </div>
      </motion.div>

      {/* Recent activity */}
      <motion.div
        {...fadeUp}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <RecentActivity />
      </motion.div>
    </div>
  );
}