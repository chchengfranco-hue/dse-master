import { useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import PassageLibrary from '@/components/vocab/PassageLibrary';
import PassageReadView from '@/components/vocab/PassageReadView';
import PassageEditor from '@/components/vocab/PassageEditor';
import PullRefreshIndicator from '@/components/shared/PullRefreshIndicator';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useLocalData } from '@/hooks/useLocalData';

const STORAGE_KEY = 'readingPassages';
const DEFAULT = [
  {
    id: 1, title: 'The Impact of Social Media on Youth',
    topic: 'Technology', subtopic: 'Social Media', imageUrl: '',
    content: `Social media has fundamentally transformed the way young people communicate and interact. Platforms such as Instagram, TikTok, and Twitter have created unprecedented opportunities for self-expression and global connectivity.\n\nHowever, researchers have raised concerns about the detrimental effects of excessive social media use. Studies indicate that prolonged exposure to curated online content can exacerbate feelings of inadequacy and anxiety among teenagers. The proliferation of unrealistic beauty standards and highlight reels often leads to unfavorable social comparisons.\n\nOn the other hand, social media has proven invaluable as a tool for advocacy and awareness. Young activists have harnessed these platforms to mobilize communities and amplify marginalized voices on issues ranging from climate change to social justice.\n\nTo alleviate the negative impacts, educators advocate for a holistic approach to digital literacy, teaching students to critically evaluate online content and maintain a healthy balance between their virtual and real-world identities.`,
    annotations: { detrimental: 'adj. tending to cause harm or damage', exacerbate: 'v. to make a problem worse', proliferation: 'n. rapid increase in the number of something', alleviate: 'v. to make suffering less severe', holistic: 'adj. dealing with the whole rather than parts', advocacy: 'n. public support for a cause or policy' },
  },
  {
    id: 2, title: 'Climate Change and Global Responsibility',
    topic: 'Environment', subtopic: 'Climate', imageUrl: '',
    content: `Climate change represents one of the most pressing challenges of the twenty-first century. The scientific consensus is unequivocal: human activities, particularly the burning of fossil fuels, are the primary driver of rising global temperatures.\n\nThe consequences are far-reaching and devastating. Glaciers are retreating at an unprecedented rate, sea levels are rising, and extreme weather events are becoming more frequent and severe. Vulnerable communities in low-lying coastal regions and developing nations bear a disproportionate burden of these impacts despite contributing the least to global emissions.\n\nStringent international agreements, such as the Paris Agreement, aim to limit global warming to 1.5 degrees Celsius above pre-industrial levels. However, current national pledges remain insufficient to meet this target. Critics argue that governments must implement more ambitious policies to curtail carbon emissions and transition to sustainable energy sources.\n\nIndividual action also plays a crucial role. Reducing consumption, adopting plant-based diets, and supporting renewable energy initiatives are all meaningful steps that citizens can take to mitigate their environmental footprint.`,
    annotations: { unequivocal: 'adj. leaving no doubt; clear', unprecedented: 'adj. never done or known before', disproportionate: 'adj. too large or too small in comparison', stringent: 'adj. strict and precise', curtail: 'v. to reduce or restrict', mitigate: 'v. to make less severe' },
  },
];

const load = () => { try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : DEFAULT; } catch { return DEFAULT; } };
const save = (d) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d));

function BulkImport({ onImport, onCancel }) {
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const arr = Array.isArray(data) ? data : [data];
        onImport(arr.map(p => ({ ...p, id: Date.now() + Math.random() })));
      } catch { alert('Invalid JSON file.'); }
    };
    reader.readAsText(file);
  };
  return (
    <div className="px-4 lg:px-8 py-6 max-w-lg mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-2">Bulk Import Passages</h2>
        <p className="text-sm text-muted-foreground mb-4">Upload a JSON file containing an array of passage objects. Each must have at least <code className="bg-muted px-1 rounded">title</code> and <code className="bg-muted px-1 rounded">content</code>.</p>
        <input type="file" accept=".json" onChange={handleFile} className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-primary file:text-primary-foreground file:font-semibold hover:file:bg-primary/90 mb-5" />
        <button onClick={onCancel} className="px-4 py-2 bg-muted border border-border rounded-xl text-sm font-semibold hover:bg-border">Cancel</button>
      </div>
    </div>
  );
}

function LibraryWrapper({ isEditor }) {
  const navigate = useNavigate();
  const listRef = useRef(null);
  const [passages, setPassages] = useLocalData(STORAGE_KEY, DEFAULT);
  const refreshing = usePullToRefresh(() => { setPassages(load()); }, listRef);

  const update = (data) => { setPassages(data); save(data); };

  if (location.pathname.endsWith('/bulk')) {
    return <BulkImport onImport={(arr) => { update([...passages, ...arr]); navigate('/vocab'); }} onCancel={() => navigate('/vocab')} />;
  }

  return (
    <>
      <PullRefreshIndicator refreshing={refreshing} />
      <PassageLibrary
        passages={passages}
        isEditor={isEditor}
        onRead={(p) => navigate(`/vocab/read/${p.id}`)}
        onEdit={(p) => navigate(p ? `/vocab/edit/${p.id}` : '/vocab/edit/new')}
        onDelete={(id) => { if (confirm('Delete this passage?')) update(passages.filter(p => p.id !== id)); }}
        onBulkImport={isEditor ? () => navigate('/vocab/bulk') : null}
      />
    </>
  );
}

export default function VocabModule({ isEditor }) {
  const [passages, setPassages] = useLocalData(STORAGE_KEY, DEFAULT);
  const update = (data) => { setPassages(data); save(data); };

  const savePassage = (data) => {
    if (data.id && data.id !== 'new') update(passages.map(p => p.id === data.id ? data : p));
    else update([...passages, { ...data, id: Date.now() }]);
  };

  const saveAnnotation = (passageId, word, meaning) => {
    const updated = passages.map(p => {
      if (p.id !== passageId) return p;
      const annotations = { ...(p.annotations || {}) };
      if (!meaning) delete annotations[word]; else annotations[word] = meaning;
      return { ...p, annotations };
    });
    update(updated);
  };

  return (
    <Routes>
      <Route path="/vocab" element={<LibraryWrapper isEditor={isEditor} />} />
      <Route path="/" element={<LibraryWrapper isEditor={isEditor} />} />
      <Route path="/vocab/bulk" element={<BulkImport onImport={(arr) => update([...passages, ...arr])} onCancel={() => {}} />} />
      <Route path="/vocab/read/:id" element={
        (() => {
          const ReadWrapper = () => {
            const navigate = useNavigate();
            const [ps] = useLocalData(STORAGE_KEY, DEFAULT);
            const id = parseInt(window.location.pathname.split('/').pop());
            const passage = ps.find(p => p.id === id) || ps[0];
            if (!passage) return null;
            return <PassageReadView passage={passage} isEditor={isEditor} onBack={() => navigate('/vocab')}
              onSaveAnnotation={(pid, word, meaning) => { saveAnnotation(pid, word, meaning); }} />;
          };
          return <ReadWrapper />;
        })()
      } />
      <Route path="/vocab/edit/:id" element={
        (() => {
          const EditWrapper = () => {
            const navigate = useNavigate();
            const [ps] = useLocalData(STORAGE_KEY, DEFAULT);
            const idStr = window.location.pathname.split('/').pop();
            const passage = idStr === 'new' ? null : ps.find(p => p.id === parseInt(idStr));
            return <PassageEditor passage={passage} onSave={(data) => { savePassage(data); navigate('/vocab'); }} onCancel={() => navigate('/vocab')} />;
          };
          return <EditWrapper />;
        })()
      } />
    </Routes>
  );
}