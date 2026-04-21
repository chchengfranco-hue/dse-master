import { Lock, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function TaskCard({ title, description, difficulty, duration, status, index }) {
  const isLocked = status === 'locked';
  const isCompleted = status === 'completed';

  const difficultyColors = {
    Easy: 'bg-green-100 text-green-700',
    Medium: 'bg-amber-100 text-amber-700',
    Hard: 'bg-red-100 text-red-700',
  };

  return (
    <div className={cn(
      "group bg-card rounded-2xl border border-border p-5 transition-all duration-200",
      isLocked ? "opacity-60" : "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
      isCompleted && "border-primary/20 bg-primary/[0.02]"
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0",
          isCompleted ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
        )}>
          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground text-sm">{title}</h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
          <div className="flex items-center gap-2 mt-3">
            <Badge variant="secondary" className={cn("text-[10px] font-medium px-2 py-0.5", difficultyColors[difficulty])}>
              {difficulty}
            </Badge>
            <span className="text-[10px] text-muted-foreground">{duration}</span>
          </div>
        </div>
        <div className="shrink-0 mt-1">
          {isLocked ? (
            <Lock className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          )}
        </div>
      </div>
    </div>
  );
}