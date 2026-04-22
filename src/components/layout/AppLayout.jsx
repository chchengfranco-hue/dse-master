import { useState, useEffect } from 'react';
import { BookOpen, PenTool, Grid3X3, MessageSquare, Book, Users, CheckSquare, MoreHorizontal, ChevronLeft, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/lib/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import LoginModal from '@/components/auth/LoginModal';
import VocabModule from '@/pages/modules/VocabModule';
import WritingModule from '@/pages/modules/WritingModule';
import ClozeModule from '@/pages/modules/ClozeModule';
import EssentialVocabModule from '@/pages/modules/EssentialVocabModule';
import SpeakingModule from '@/pages/modules/SpeakingModule';
import GrammarModule from '@/pages/modules/GrammarModule';
import UserManagement from '@/pages/modules/UserManagement';
import ProgressPage from '@/pages/Progress';

const baseModules = [
{ id: 'vocab', icon: BookOpen, label: 'Thematic Idea Bank' },
{ id: 'writing', icon: PenTool, label: 'Sample Writing' },
{ id: 'cloze', icon: Grid3X3, label: 'Vocabulary Exercise' },
{ id: 'essential', icon: Book, label: 'Essential Vocabulary' },
{ id: 'speaking', icon: MessageSquare, label: 'Speaking Practice' },
{ id: 'grammar', icon: CheckSquare, label: 'Grammar Exercise' },
{ id: 'progress', icon: BarChart2, label: 'Progress' }];



export default function AppLayout() {
  const { isAuthenticated, isEditor, currentUser, login, logout, ready } = useUser();
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Derive active tab from current path
  const activeModule = (() => {
    const p = location.pathname;
    if (p.startsWith('/writing')) return 'writing';
    if (p.startsWith('/cloze')) return 'cloze';
    if (p.startsWith('/essential')) return 'essential';
    if (p.startsWith('/speaking')) return 'speaking';
    if (p.startsWith('/grammar')) return 'grammar';
    if (p.startsWith('/users')) return 'users';
    if (p.startsWith('/progress')) return 'progress';
    if (p.startsWith('/vocab')) return 'vocab';
    return isEditor ? 'vocab' : 'progress'; // default: students see progress
  })();

  const getTabPath = (id) => id === 'vocab' ? '/vocab' : `/${id}`;

  // Detect if we're on a child/detail route (not the module root)
  const isChildRoute = (() => {
    const p = location.pathname;
    const roots = ['/vocab', '/writing', '/cloze', '/essential', '/speaking', '/grammar', '/users', '/progress', '/'];
    return !roots.includes(p);
  })();

  // Dynamic header title for child routes
  const childPageTitle = (() => {
    const p = location.pathname;
    if (p.includes('/read/') || p.includes('/practice/')) return 'Reading';
    if (p.includes('/edit/')) return 'Edit';
    if (p.includes('/bulk')) return 'Import';
    return '';
  })();

  // Stop speech on every route change
  useEffect(() => {
    window.speechSynthesis?.cancel();
  }, [location.pathname]);

  // Back destination = the module root
  const handleBack = () => navigate(getTabPath(activeModule));

  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>);

  }

  const modules = isEditor ?
  [...baseModules, { id: 'users', icon: Users, label: 'Users' }] :
  baseModules;


  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="bg-card border-b border-border p-4 text-center">
          <h1 className="text-xl font-bold text-foreground">Ace HKDSE English</h1>
        </header>
        <LoginModal onLogin={login} />
      </div>);

  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 flex items-center sticky top-0 z-40 h-14 pt-[env(safe-area-inset-top)] select-none" style={{ paddingTop: 'max(0px, env(safe-area-inset-top))', height: 'calc(3.5rem + env(safe-area-inset-top))' }}>
        {/* Left: back button or logo */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isChildRoute ?
          <button onClick={handleBack} className="flex items-center gap-1 text-primary font-medium text-sm active:opacity-60 transition-opacity -ml-1 pr-2">
              <ChevronLeft className="w-5 h-5" />
              <span>{modules.find((m) => m.id === activeModule)?.label || 'Back'}</span>
            </button> :

          <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/25 shrink-0">
                <span className="text-lg">📚</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-foreground leading-tight">Ace HKDSE Learning</h1>
                <p className="text-[10px] text-muted-foreground">English Learning Platform</p>
              </div>
              <h1 className="sm:hidden text-base font-bold text-foreground">Ace HKDSE</h1>
            </div>
          }
        </div>

        {/* Center: page title on child routes */}
        {isChildRoute &&
        <div className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-foreground pointer-events-none">
            {childPageTitle}
          </div>
        }

        {/* Right: user info + logout */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="hidden sm:flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg border border-border">
            <span className="text-sm font-medium text-foreground">{currentUser}</span>
            {isEditor && <span className="text-xs text-muted-foreground ml-1">(Editor)</span>}
          </div>
          <button
            onClick={logout}
            className="text-sm bg-muted hover:bg-border active:bg-border px-3 py-1.5 rounded-lg transition-colors font-medium text-foreground border border-border">
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: isChildRoute ? 24 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: isChildRoute ? -24 : 24 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="min-h-full">
            
            {activeModule === 'vocab' && <VocabModule isEditor={isEditor} />}
            {activeModule === 'writing' && <WritingModule isEditor={isEditor} />}
            {activeModule === 'cloze' && <ClozeModule isEditor={isEditor} />}
            {activeModule === 'essential' && <EssentialVocabModule isEditor={isEditor} />}
            {activeModule === 'speaking' && <SpeakingModule isEditor={isEditor} />}
            {activeModule === 'grammar' && <GrammarModule isEditor={isEditor} />}
            {activeModule === 'users' && isEditor && <UserManagement />}
            {activeModule === 'progress' && <ProgressPage />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 pb-[env(safe-area-inset-bottom)]">
        {/* More drawer */}
        {showMore &&
        <>
            <div className="absolute bottom-full left-0 right-0 bg-card border-t border-border shadow-lg rounded-t-2xl p-3 grid grid-cols-4 gap-2">
              {modules.slice(4).map((mod) => {
              const Icon = mod.icon;
              const isActive = activeModule === mod.id;
              return (
                <button key={mod.id} onClick={() => {navigate(getTabPath(mod.id));setShowMore(false);}}
                className={cn("flex flex-col items-center justify-center py-3 rounded-xl transition-all select-none", isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted")}>
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] mt-1 font-medium">{mod.label}</span>
                  </button>);

            })}
            </div>
            <div className="fixed inset-0 z-[-1]" onClick={() => setShowMore(false)} />
          </>
        }
        <div className="flex justify-around items-center h-16 px-2">
          {modules.slice(0, 4).map((mod) => {
            const Icon = mod.icon;
            const isActive = activeModule === mod.id;
            return (
              <button key={mod.id} onClick={() => {navigate(getTabPath(mod.id));setShowMore(false);}}
              className={cn("flex flex-col items-center justify-center flex-1 h-12 rounded-xl mx-0.5 transition-all duration-200 select-none",
              isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 font-medium">{mod.label}</span>
              </button>);

          })}
          <button onClick={() => setShowMore((v) => !v)}
          className={cn("flex flex-col items-center justify-center flex-1 h-12 rounded-xl mx-0.5 transition-all duration-200 select-none",
          showMore || modules.slice(4).some((m) => m.id === activeModule) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">More</span>
          </button>
        </div>
      </nav>
    </div>);

}