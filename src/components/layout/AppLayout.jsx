import { useState, useEffect } from 'react';
import { BookOpen, PenTool, Layers, MessageSquare, Book, Users, MoreHorizontal, ChevronLeft, TrendingUp, FileDown, Grid3X3, CheckSquare, Globe, ClipboardList } from 'lucide-react';
import HotIssuesModule from '@/pages/modules/HotIssuesModule';
import GlobalPdfExport from '@/components/shared/GlobalPdfExport';
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
import TaskBoard from '@/pages/modules/TaskBoard';
import Progress from '@/pages/Progress';

const baseModules = [
{ id: 'vocab', icon: BookOpen, label: 'Thematic Idea Bank' },
{ id: 'writing', icon: PenTool, label: 'Sample Writing' },
{ id: 'exercises', icon: Layers, label: 'Exercises' },
{ id: 'essential', icon: Book, label: 'Essential Vocabulary' },
{ id: 'speaking', icon: MessageSquare, label: 'Speaking Practice' },
{ id: 'hotissues', icon: Globe, label: 'Hot Issues' },
{ id: 'progress', icon: TrendingUp, label: 'Progress' }];


export default function AppLayout() {
  const { isAuthenticated, isEditor, currentUser, allowedModules, login, logout, ready } = useUser();
  const [showMore, setShowMore] = useState(false);
  const [showGlobalPdf, setShowGlobalPdf] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect root path to default module
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/') {
      navigate(isEditor ? '/vocab' : '/progress', { replace: true });
    }
  }, [isAuthenticated, location.pathname]);

  // Derive active tab from current path
  const activeModule = (() => {
    const p = location.pathname;
    if (p.startsWith('/writing')) return 'writing';
    if (p.startsWith('/cloze')) return 'exercises';
    if (p.startsWith('/grammar')) return 'exercises';
    if (p.startsWith('/essential')) return 'essential';
    if (p.startsWith('/speaking')) return 'speaking';
    if (p.startsWith('/users')) return 'users';
    if (p.startsWith('/tasks')) return 'tasks';
    if (p.startsWith('/progress')) return 'progress';
    if (p.startsWith('/hotissues')) return 'hotissues';
    if (p.startsWith('/vocab')) return 'vocab';
    return isEditor ? 'vocab' : 'progress';
  })();

  const getTabPath = (id) => id === 'vocab' ? '/vocab' : `/${id}`;



  // Detect if we're on a child/detail route (not the module root)
  const isChildRoute = (() => {
    const p = location.pathname;
    const roots = ['/vocab', '/writing', '/cloze', '/essential', '/speaking', '/grammar', '/users', '/tasks', '/progress', '/hotissues', '/'];
    return !roots.includes(p);
  })();

  // Handle exercises tab click — show picker if not already on cloze/grammar
  const handleExercisesClick = () => {
    setShowExercisePicker(true);
    setShowMore(false);
  };

  // Dynamic header title for child routes
  const childPageTitle = (() => {
    const p = location.pathname;
    if (p.includes('/read/') || p.includes('/practice/')) return 'Reading';
    if (p.includes('/edit/')) return 'Edit';
    if (p.includes('/bulk')) return 'Import';
    if (p.includes('/topics')) return 'Manage Topics';
    return '';
  })();

  // Back destination = the module root
  const handleBack = () => navigate(getTabPath(activeModule));

  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>);

  }

  const modules = (() => {
    let mods = isEditor
      ? [...baseModules, { id: 'tasks', icon: ClipboardList, label: 'Tasks' }, { id: 'users', icon: Users, label: 'Users' }]
      : baseModules;
    // Filter by allowedModules if admin has restricted access (editors always see all)
    if (!isEditor && allowedModules !== null) {
      mods = mods.filter(m => allowedModules.includes(m.id));
    }
    return mods;
  })();


  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="bg-card border-b border-border p-4 text-center">
          <h1 className="text-xl font-bold text-foreground">Ace HKDSE Preparation Master</h1>
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
          {isEditor && !isChildRoute &&
          <button onClick={() => setShowGlobalPdf(true)} className="flex items-center gap-1.5 text-sm bg-muted hover:bg-border px-3 py-1.5 rounded-lg transition-colors font-medium text-foreground border border-border select-none">
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </button>
          }
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
            {activeModule === 'exercises' && location.pathname.startsWith('/grammar') && <GrammarModule isEditor={isEditor} />}
            {activeModule === 'exercises' && !location.pathname.startsWith('/grammar') && <ClozeModule isEditor={isEditor} />}
            {activeModule === 'essential' && <EssentialVocabModule isEditor={isEditor} />}
            {activeModule === 'speaking' && <SpeakingModule isEditor={isEditor} />}
            {activeModule === 'users' && isEditor && <UserManagement />}
            {activeModule === 'tasks' && isEditor && <TaskBoard />}
            {activeModule === 'progress' && <Progress />}
            {activeModule === 'hotissues' && <HotIssuesModule isEditor={isEditor} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 pb-[env(safe-area-inset-bottom)]">

        {/* Exercise picker sheet */}
        {showExercisePicker &&
        <>
            <div className="absolute bottom-full left-0 right-0 bg-card border-t border-border shadow-lg rounded-t-2xl p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 text-center">Choose Exercise Type</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => {navigate('/cloze');setShowExercisePicker(false);}}
              className="flex flex-col items-center gap-2 py-4 rounded-xl border border-border bg-background hover:bg-primary/5 hover:border-primary/30 transition-all">
                  <Grid3X3 className="w-6 h-6 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Cloze</span>
                  <span className="text-xs text-muted-foreground">Fill-in-the-blank</span>
                </button>
                <button onClick={() => {navigate('/grammar');setShowExercisePicker(false);}}
              className="flex flex-col items-center gap-2 py-4 rounded-xl border border-border bg-background hover:bg-primary/5 hover:border-primary/30 transition-all">
                  <CheckSquare className="w-6 h-6 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Grammar</span>
                  <span className="text-xs text-muted-foreground">Multiple choice</span>
                </button>
              </div>
            </div>
            <div className="fixed inset-0 z-[-1]" onClick={() => setShowExercisePicker(false)} />
          </>
        }
        <div className="flex justify-around items-center h-16 px-1 overflow-x-auto">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const isActive = activeModule === mod.id;
            return (
              <button key={mod.id}
              onClick={() => {
                if (mod.id === 'exercises') {handleExercisesClick();} else
                {navigate(getTabPath(mod.id));setShowMore(false);setShowExercisePicker(false);}
              }}
              className={cn("flex flex-col items-center justify-center flex-1 h-12 rounded-xl mx-0.5 transition-all duration-200 select-none min-w-[52px]",
              isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted")}>
                <Icon className="w-5 h-5" />
                <span className="text-[9px] mt-0.5 font-medium leading-tight text-center">{mod.label}</span>
              </button>);
          })}
        </div>
      </nav>
      {showGlobalPdf && <GlobalPdfExport onClose={() => setShowGlobalPdf(false)} />}
    </div>);

}