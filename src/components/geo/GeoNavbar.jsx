import { Globe, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GeoNavbar() {
  const navigate = useNavigate();

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
      <div className="w-16" />
    </header>
  );
}