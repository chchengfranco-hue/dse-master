import { BookOpen, Users, MessageSquare, Layers, Star, ChevronRight } from 'lucide-react';

const FORMALITY_COLOR = {
  'informal': 'bg-green-100 text-green-700 border-green-200',
  'semi-formal': 'bg-blue-100 text-blue-700 border-blue-200',
  'semi-formal to informal': 'bg-blue-100 text-blue-700 border-blue-200',
  'formal': 'bg-purple-100 text-purple-700 border-purple-200',
  'formal to semi-formal': 'bg-purple-100 text-purple-700 border-purple-200',
  'formal, semi-formal or informal, depending on the context': 'bg-amber-100 text-amber-700 border-amber-200',
};

function formalityColor(f) {
  const key = (f || '').toLowerCase();
  return FORMALITY_COLOR[key] || 'bg-muted text-muted-foreground border-border';
}

function StructureDiagram({ structure }) {
  if (!structure || structure.length === 0) return null;
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {structure.map((s, i) => (
        <div key={i} className={`flex ${s.is_narrow ? '' : ''}`}>
          {s.is_narrow ? (
            <div className="bg-primary/20 text-primary text-xs font-semibold px-3 py-2 w-44 shrink-0 flex items-center border-b border-border/50 last:border-b-0">
              {s.section}
            </div>
          ) : (
            <div className={`flex-1 text-center py-3 px-4 text-sm font-medium border-b border-border/50 last:border-b-0 ${i % 2 === 0 ? 'bg-primary/10 text-primary' : 'bg-primary/15 text-primary'}`}>
              <div className="font-semibold flex items-center justify-center gap-1.5">
                {s.section}
                {s.is_optional && <span className="text-[10px] font-medium text-primary/60 bg-white/50 px-1.5 py-0.5 rounded-full border border-primary/20">optional</span>}
              </div>
              {s.description && <div className="text-xs text-primary/70 mt-0.5 font-normal">{s.description}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function GenreTemplateView({ template, onBack }) {
  return (
    <div className="px-4 lg:px-8 py-6 max-w-3xl mx-auto">
      <button onClick={onBack} className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm hover:bg-muted select-none mb-6">← Back to Templates</button>

      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-primary/70 uppercase tracking-wide">Writing Genre Template</p>
            <h1 className="text-2xl font-bold text-foreground">{template.genre}</h1>
          </div>
        </div>
        {/* Formality badge */}
        {template.formality && (
          <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border mt-1 ${formalityColor(template.formality)}`}>
            {template.formality.charAt(0).toUpperCase() + template.formality.slice(1)}
          </span>
        )}
      </div>

      {/* Overview table */}
      <section className="mb-6">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5"><Layers className="w-4 h-4 text-primary" /> Overview</h2>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {template.purpose?.length > 0 && (
            <div className="flex border-b border-border">
              <div className="w-36 shrink-0 px-4 py-3 text-sm font-semibold text-muted-foreground bg-muted/40">Purpose</div>
              <div className="px-4 py-3 text-sm text-foreground">
                <ul className="space-y-0.5">
                  {template.purpose.map((p, i) => <li key={i} className="flex items-start gap-1.5"><ChevronRight className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />{p}</li>)}
                </ul>
              </div>
            </div>
          )}
          {template.intended_reader && (
            <div className="flex border-b border-border">
              <div className="w-36 shrink-0 px-4 py-3 text-sm font-semibold text-muted-foreground bg-muted/40">Intended reader</div>
              <div className="px-4 py-3 text-sm text-foreground">{template.intended_reader}</div>
            </div>
          )}
          {template.formality && (
            <div className="flex border-b border-border">
              <div className="w-36 shrink-0 px-4 py-3 text-sm font-semibold text-muted-foreground bg-muted/40">Formality</div>
              <div className="px-4 py-3 text-sm text-foreground">{template.formality}</div>
            </div>
          )}
          {template.tone && (
            <div className="flex">
              <div className="w-36 shrink-0 px-4 py-3 text-sm font-semibold text-muted-foreground bg-muted/40">Tone</div>
              <div className="px-4 py-3 text-sm text-foreground">{template.tone}</div>
            </div>
          )}
        </div>
      </section>

      {/* Structure */}
      {template.structure?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5"><Layers className="w-4 h-4 text-primary" /> Structure</h2>
          <StructureDiagram structure={template.structure} />
        </section>
      )}

      {/* Key Features */}
      {template.key_features?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5"><Star className="w-4 h-4 text-primary" /> Key Features</h2>
          <div className="bg-card rounded-xl border border-border p-4 space-y-2">
            {template.key_features.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                {f}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Language Resources */}
      {template.language_resources?.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-primary" /> Useful Language Resources</h2>
          <div className="space-y-3">
            {template.language_resources.map((cat, i) => (
              <div key={i} className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="bg-primary/10 text-primary text-xs font-bold px-4 py-2 uppercase tracking-wide">{cat.category}</div>
                <div className="px-4 py-3 space-y-1">
                  {cat.phrases.map((ph, j) => (
                    <div key={j} className="text-sm text-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5 shrink-0">›</span>{ph}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}