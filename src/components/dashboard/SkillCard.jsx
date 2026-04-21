import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SkillCard({ to, icon, title, description, taskCount, color }) {
  const colorMap = {
    purple: 'from-purple-500 to-purple-700',
    blue: 'from-blue-500 to-blue-700',
    amber: 'from-amber-500 to-amber-700',
    rose: 'from-rose-500 to-rose-700',
  };

  return (
    <Link to={to} className="group block">
      <div className={cn(
        "relative rounded-2xl p-6 text-white overflow-hidden transition-all duration-300",
        "bg-gradient-to-br shadow-lg hover:shadow-xl hover:-translate-y-0.5",
        colorMap[color] || colorMap.purple
      )}>
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-8 -translate-x-8" />
        
        <div className="relative">
          <div className="text-3xl mb-4">{icon}</div>
          <h3 className="text-lg font-bold mb-1">{title}</h3>
          <p className="text-white/70 text-sm mb-4 leading-relaxed">{description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium bg-white/20 px-3 py-1 rounded-full">
              {taskCount} tasks
            </span>
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}