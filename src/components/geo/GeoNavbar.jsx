import { Globe, ChevronLeft, BookOpen, PenTool, Layers, MessageSquare, Users, ClipboardList, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const APP_MENU = [
  { id: 'vocab', label: 'Thematic Vocab', icon: BookOpen },
  { id: 'writing', label: 'Writing', icon: PenTool },
  { id: 'exercises', label: 'Exercises', icon: Layers },
  { id: 'speaking', label: 'Speaking', icon: MessageSquare },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'tasks', label: 'Tasks', icon: ClipboardList },
];

export default function GeoNavbar() {
  const navigate = useNavigate();
  const [showAppMenu, setShowAppMenu] = useState(false);

  const handleAppSwitch = (appId) => {
    if (appId === 'vocab') navigate('/vocab');
    else if (appId === 'users') navigate('/users');
    else if (appId === 'tasks') navigate('/tasks');
    else navigate(`/${appId}`);
    setShowAppMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-primary font-medium text-sm hover:opacity-70 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="hidden sm:inline">Back</span>
        </button>
      </div>
      <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <Globe className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-bold text-foreground">Geo Exercise Bank</h1>
          <p className="text-[10px] text-muted-foreground">地理練習題庫</p>
        </div>
      </div>
      
      {/* App Switcher */}
      <div className="relative">
        <button
          onClick={() => setShowAppMenu(!showAppMenu)}
          className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-border rounded-lg text-sm font-medium text-foreground border border-border transition-colors"
        >
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">Apps</span>
        </button>
        
        {showAppMenu && (
          <>
            <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-lg p-2 w-48">
              {APP_MENU.map(app => {
                const Icon = app.icon;
                return (
                  <button
                    key={app.id}
                    onClick={() => handleAppSwitch(app.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <Icon className="w-4 h-4 text-primary" />
                    {app.label}
                  </button>
                );
              })}
            </div>
            <div className="fixed inset-0 z-[-1]" onClick={() => setShowAppMenu(false)} />
          </>
        )}
      </div>
    </header>
  );
}