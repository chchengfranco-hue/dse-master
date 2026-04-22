import { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { BookOpen, PenTool, Grid3X3, MessageSquare, Book, Users, CheckSquare, Star, ChevronLeft, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/lib/UserContext';
import { useDarkMode } from '@/hooks/useDarkMode';
import LoginModal from '@/components/auth/LoginModal';
import VocabModule from '@/pages/modules/VocabModule';
import WritingModule from '@/pages/modules/WritingModule';
import ClozeModule from '@/pages/modules/ClozeModule';
import EssentialVocabModule from '@/pages/modules/EssentialVocabModule';
import SpeakingModule from '@/pages/modules/SpeakingModule';
import GrammarModule from '@/pages/modules/GrammarModule';
import EssayEvaluatorModule from '@/pages/modules/EssayEvaluatorModule';
import UserManagement from '@/pages/modules/UserManagement';
import AccountSettings from '@/pages/modules/AccountSettings';

const BASE_MODULES = [
  { id: 'vocab',    path: '/vocab',    icon: BookOpen,     label: 'Reading'  },
  { id: 'writing',  path: '/writing',  icon: PenTool,      label: 'Writing'  },
  { id: 'cloze',    path: '/cloze',    icon: Grid3X3,      label: 'Cloze'    },
  { id: 'essential',path: '/essential',icon: Book,         label: 'Vocab'    },
  { id: 'speaking', path: '/speaking', icon: MessageSquare,label: 'Speaking' },
  { id: 'grammar',  path: '/grammar',  icon: CheckSquare,  label: 'Grammar'  },
  { id: 'evaluate', path: '/evaluate', icon: Star,         label: 'Evaluate' },
];

// Child-view path prefixes — header shows back button on these
const CHILD_PATHS = ['/read/', '/edit/', '/practice/', '/bulk', '/account', '/evaluating', '/detail'];

export default function AppLayout() {
  useDarkMode();
  const { isAuthenticated, isEditor, currentUser, login, logout, ready } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const modules = isEditor
    ? [...BASE_MODULES, { id: 'users', path: '/users', icon: Users, label: 'Users' }]
    : BASE_MODULES;

  // Determine active tab from current path
  const activeTab = modules.find(m => location.pathname.startsWith(m.path))?.id || 'vocab';

  // Show back button on child screens
  const isChildView = CHILD_PATHS.some(p => location.pathname.includes(p));

  // Redirect root to /vocab
  useEffect(() => {
    if (isAuthenticated && (location.pathname === '/' || location.pathname === '')) {
      navigate('/vocab', { replace: true });
    }
  }, [isAuthenticated, location.pathname]);

  if (!ready) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <header className="bg-card border-b border-border p-4 text-center">
          <h1 className="text-xl font-bold text-foreground select-none">HKDSE Learning Hub</h1>
        </header>
        <LoginModal onLogin={login} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 py-3 flex justify-between items-center sticky top-0 z-40 select-none">
        <div className="flex items-center gap-3">
          {isChildView ? (
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted hover:bg-border transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          ) : (
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md shadow-primary/25">
              <span className="text-xl">📚</span>
            </div>
          )}
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">HKDSE Learning Hub</h1>
            <p className="text-[10px] text-muted-foreground">Interactive English Learning Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg border border-border">
            <span className="text-sm font-medium text-foreground">{currentUser}</span>
            {isEditor && <span className="text-xs text-muted-foreground ml-1">(Editor)</span>}
          </div>
          <button
            onClick={() => navigate('/account')}
            className="p-2 bg-muted hover:bg-border rounded-lg transition-colors border border-border"
            aria-label="Account settings"
          >
            <Settings className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={logout}
            className="text-sm bg-muted hover:bg-border px-3 py-1.5 rounded-lg transition-colors font-medium text-foreground border border-border select-none"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24" style={{ overscrollBehaviorY: 'none' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/vocab" replace />} />
          <Route path="/vocab/*" element={<VocabModule isEditor={isEditor} />} />
          <Route path="/writing/*" element={<WritingModule isEditor={isEditor} />} />
          <Route path="/cloze/*" element={<ClozeModule isEditor={isEditor} />} />
          <Route path="/essential/*" element={<EssentialVocabModule isEditor={isEditor} />} />
          <Route path="/speaking/*" element={<SpeakingModule isEditor={isEditor} />} />
          <Route path="/grammar/*" element={<GrammarModule isEditor={isEditor} />} />
          <Route path="/evaluate/*" element={<EssayEvaluatorModule isEditor={isEditor} />} />
          {isEditor && <Route path="/users" element={<UserManagement />} />}
          <Route path="/account" element={<AccountSettings />} />
          <Route path="*" element={<Navigate to="/vocab" replace />} />
        </Routes>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 px-2 pb-[env(safe-area-inset-bottom)] select-none">
        <div className="flex justify-around items-center h-16">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const isActive = activeTab === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => navigate(mod.path)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-12 rounded-xl mx-0.5 transition-all duration-200 select-none",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5 font-medium">{mod.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}