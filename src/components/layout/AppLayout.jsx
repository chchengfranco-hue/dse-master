import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Pen, Headphones, Mic, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/reading', icon: BookOpen, label: 'Reading' },
  { path: '/writing', icon: Pen, label: 'Writing' },
  { path: '/listening', icon: Headphones, label: 'Listening' },
  { path: '/speaking', icon: Mic, label: 'Speaking' },
  { path: '/progress', icon: BarChart3, label: 'Progress' },
];

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex-col z-40">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-xl">📚</span>
            </div>
            <div>
              <h1 className="font-bold text-foreground text-lg leading-tight">HKDSE</h1>
              <p className="text-xs text-muted-foreground">English Prep</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="bg-accent rounded-xl p-4">
            <p className="text-xs font-semibold text-accent-foreground mb-1">Pro Tip</p>
            <p className="text-xs text-muted-foreground leading-relaxed">Practice daily for 30 minutes to see the best results.</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pb-24 lg:pb-8">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 bg-card/80 backdrop-blur-xl border-b border-border z-30 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-lg">📚</span>
            </div>
            <div>
              <h1 className="font-bold text-foreground text-base leading-tight">HKDSE English</h1>
              <p className="text-[10px] text-muted-foreground">Preparation Hub</p>
            </div>
          </div>
        </header>

        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border z-40 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-0",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-all duration-200",
                  isActive && "bg-primary/10"
                )}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}