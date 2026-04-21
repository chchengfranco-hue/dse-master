import { cn } from '@/lib/utils';

export default function StatCard({ icon, label, value, sublabel, className }) {
  return (
    <div className={cn(
      "bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow duration-300",
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-xl">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      {sublabel && (
        <p className="text-xs text-primary font-medium mt-1">{sublabel}</p>
      )}
    </div>
  );
}