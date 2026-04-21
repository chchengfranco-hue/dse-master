import { Clock } from 'lucide-react';

const activities = [
  { icon: '📖', title: 'Reading Comprehension B1', time: '2 hours ago', score: '85%' },
  { icon: '✍️', title: 'Writing Task – Email Reply', time: 'Yesterday', score: '72%' },
  { icon: '🎧', title: 'Listening Part A Practice', time: '2 days ago', score: '90%' },
  { icon: '🎤', title: 'Individual Presentation', time: '3 days ago', score: 'Pending' },
];

export default function RecentActivity() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm">
      <div className="p-5 pb-3 border-b border-border">
        <h3 className="font-semibold text-foreground">Recent Activity</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Your latest practice sessions</p>
      </div>
      <div className="divide-y divide-border">
        {activities.map((activity, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-lg shrink-0">
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            </div>
            <span className="text-sm font-semibold text-primary shrink-0">{activity.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}