import { motion } from 'framer-motion';
import PageHeader from '../components/shared/PageHeader';
import { Progress } from '@/components/ui/progress';

const skills = [
  { name: 'Reading', icon: '📖', progress: 65, tasks: '8/12', color: 'bg-purple-500' },
  { name: 'Writing', icon: '✍️', progress: 38, tasks: '3/8', color: 'bg-blue-500' },
  { name: 'Listening', icon: '🎧', progress: 50, tasks: '5/10', color: 'bg-amber-500' },
  { name: 'Speaking', icon: '🎤', progress: 25, tasks: '2/6', color: 'bg-rose-500' },
];

const weeklyData = [
  { day: 'Mon', hours: 1.5 },
  { day: 'Tue', hours: 2.0 },
  { day: 'Wed', hours: 0.5 },
  { day: 'Thu', hours: 1.0 },
  { day: 'Fri', hours: 2.5 },
  { day: 'Sat', hours: 3.0 },
  { day: 'Sun', hours: 1.5 },
];

const maxHours = Math.max(...weeklyData.map(d => d.hours));

export default function ProgressPage() {
  return (
    <div className="px-4 lg:px-8 py-6 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <PageHeader
          icon="📊"
          title="Progress"
          description="Track your HKDSE English preparation progress across all skills."
        />

        {/* Overall progress */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Overall Progress</h3>
            <span className="text-2xl font-bold text-primary">45%</span>
          </div>
          <Progress value={45} className="h-3 mb-2" />
          <p className="text-xs text-muted-foreground">18 of 36 tasks completed</p>
        </div>

        {/* Skill breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {skills.map((skill) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-card rounded-2xl border border-border shadow-sm p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-xl">
                  {skill.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground text-sm">{skill.name}</h4>
                  <p className="text-xs text-muted-foreground">{skill.tasks} tasks</p>
                </div>
                <span className="text-lg font-bold text-foreground">{skill.progress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${skill.progress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className={`h-full rounded-full ${skill.color}`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Weekly study chart */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <h3 className="font-semibold text-foreground mb-1">Weekly Study Time</h3>
          <p className="text-xs text-muted-foreground mb-6">Hours spent practicing this week</p>
          
          <div className="flex items-end justify-between gap-2 h-40">
            {weeklyData.map((d, i) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-foreground">{d.hours}h</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(d.hours / maxHours) * 100}%` }}
                  transition={{ duration: 0.6, delay: i * 0.08 }}
                  className="w-full max-w-10 bg-primary/80 rounded-t-lg min-h-1"
                />
                <span className="text-[10px] text-muted-foreground font-medium">{d.day}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}