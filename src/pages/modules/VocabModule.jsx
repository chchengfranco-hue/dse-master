import { useRef, useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import PassageLibrary from '@/components/vocab/PassageLibrary';
import PassageReadView from '@/components/vocab/PassageReadView';
import PassageEditor from '@/components/vocab/PassageEditor';
import PullRefreshIndicator from '@/components/shared/PullRefreshIndicator';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { base44 } from '@/api/base44Client';
import { contentApi } from '@/lib/contentApi';
import TopicEditor from '@/pages/modules/TopicEditor';

function usePassages(isEditor) {
  const [passages, setPassages] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ReadingPassage.list('-created_date', 200);
    const filtered = isEditor ? data : data.filter(p => p.status === 'published' || (p.status == null && p.is_published !== false));
    setPassages(filtered.map(p => ({ ...p, imageUrl: p.image_url || '' })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);
  return { passages, setPassages, loading, reload: load };
}

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
  const { passages, reload, loading } = usePassages(isEditor);

  const handleDelete = async (id) => {
    if (!confirm('Delete this passage?')) return;
    await contentApi.delete('ReadingPassage', id);
    reload();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <PassageLibrary
      passages={passages}
      isEditor={isEditor}
      onRead={(p) => navigate(`/vocab/read/${p.id}`)}
      onEdit={(p) => navigate(p ? `/vocab/edit/${p.id}` : '/vocab/edit/new')}
      onDelete={handleDelete}
      onBulkImport={null}
      onManageTopics={isEditor ? () => navigate('/vocab/topics') : null}
    />
  );
}

export default function VocabModule({ isEditor }) {
  const navigate = useNavigate();

  const savePassage = async (data) => {
    const payload = { title: data.title, topic: data.topic, subtopic: data.subtopic, content: data.content, annotations: data.annotations, image_url: data.imageUrl || '', status: data.status || 'published', is_published: data.status !== 'draft' };
    if (data.id && data.id !== 'new') await contentApi.update('ReadingPassage', data.id, payload);
    else await contentApi.create('ReadingPassage', payload);
    navigate('/vocab');
  };

  const saveAnnotation = async (passageId, word, meaning) => {
    const passage = await base44.entities.ReadingPassage.get(passageId);
    const annotations = { ...(passage.annotations || {}) };
    if (!meaning) delete annotations[word]; else annotations[word] = meaning;
    await contentApi.update('ReadingPassage', passageId, { annotations });
  };

  return (
    <Routes>
      <Route path="/vocab" element={<LibraryWrapper isEditor={isEditor} />} />
      <Route path="/" element={<LibraryWrapper isEditor={isEditor} />} />
      <Route path="/vocab/read/:id" element={(() => {
        const ReadWrapper = () => {
          const navigate = useNavigate();
          const [passage, setPassage] = useState(null);
          const id = window.location.pathname.split('/').pop();
          useEffect(() => { base44.entities.ReadingPassage.get(id).then(p => setPassage({ ...p, imageUrl: p.image_url || '' })); }, [id]);
          if (!passage) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
          return <PassageReadView passage={passage} isEditor={isEditor} onBack={() => navigate('/vocab')} onSaveAnnotation={saveAnnotation} />;
        };
        return <ReadWrapper />;
      })()} />
      <Route path="/vocab/topics" element={<TopicEditor onClose={() => navigate('/vocab')} />} />
      <Route path="/vocab/edit/:id" element={(() => {
        const EditWrapper = () => {
          const navigate = useNavigate();
          const [passage, setPassage] = useState(undefined);
          const idStr = window.location.pathname.split('/').pop();
          useEffect(() => {
            if (idStr === 'new') { setPassage(null); return; }
            base44.entities.ReadingPassage.get(idStr).then(p => setPassage({ ...p, imageUrl: p.image_url || '' }));
          }, [idStr]);
          if (passage === undefined) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
          return <PassageEditor passage={passage} onSave={savePassage} onCancel={() => navigate('/vocab')} />;
        };
        return <EditWrapper />;
      })()} />
    </Routes>
  );
}