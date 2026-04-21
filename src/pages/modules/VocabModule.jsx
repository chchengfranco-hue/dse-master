import { useState, useEffect, useRef } from 'react';
import PassageLibrary from '@/components/vocab/PassageLibrary';
import PassageReadView from '@/components/vocab/PassageReadView';
import PassageEditor from '@/components/vocab/PassageEditor';

const STORAGE_KEY = 'readingPassages';

const defaultPassages = [
  {
    id: 1, title: 'The Impact of Social Media on Youth',
    topic: 'Technology', subtopic: 'Social Media',
    imageUrl: '',
    content: `Social media has fundamentally transformed the way young people communicate and interact. Platforms such as Instagram, TikTok, and Twitter have created unprecedented opportunities for self-expression and global connectivity.

However, researchers have raised concerns about the detrimental effects of excessive social media use. Studies indicate that prolonged exposure to curated online content can exacerbate feelings of inadequacy and anxiety among teenagers. The proliferation of unrealistic beauty standards and highlight reels often leads to unfavorable social comparisons.

On the other hand, social media has proven invaluable as a tool for advocacy and awareness. Young activists have harnessed these platforms to mobilize communities and amplify marginalized voices on issues ranging from climate change to social justice.

To alleviate the negative impacts, educators advocate for a holistic approach to digital literacy, teaching students to critically evaluate online content and maintain a healthy balance between their virtual and real-world identities.`,
    annotations: {
      detrimental: 'adj. tending to cause harm or damage',
      exacerbate: 'v. to make a problem worse',
      proliferation: 'n. rapid increase in the number of something',
      alleviate: 'v. to make suffering less severe',
      holistic: 'adj. dealing with the whole rather than parts',
      advocacy: 'n. public support for a cause or policy',
    },
  },
  {
    id: 2, title: 'Climate Change and Global Responsibility',
    topic: 'Environment', subtopic: 'Climate',
    imageUrl: '',
    content: `Climate change represents one of the most pressing challenges of the twenty-first century. The scientific consensus is unequivocal: human activities, particularly the burning of fossil fuels, are the primary driver of rising global temperatures.

The consequences are far-reaching and devastating. Glaciers are retreating at an unprecedented rate, sea levels are rising, and extreme weather events are becoming more frequent and severe. Vulnerable communities in low-lying coastal regions and developing nations bear a disproportionate burden of these impacts despite contributing the least to global emissions.

Stringent international agreements, such as the Paris Agreement, aim to limit global warming to 1.5 degrees Celsius above pre-industrial levels. However, current national pledges remain insufficient to meet this target. Critics argue that governments must implement more ambitious policies to curtail carbon emissions and transition to sustainable energy sources.

Individual action also plays a crucial role. Reducing consumption, adopting plant-based diets, and supporting renewable energy initiatives are all meaningful steps that citizens can take to mitigate their environmental footprint.`,
    annotations: {
      unequivocal: 'adj. leaving no doubt; clear',
      unprecedented: 'adj. never done or known before',
      disproportionate: 'adj. too large or too small in comparison',
      stringent: 'adj. strict and precise',
      curtail: 'v. to reduce or restrict',
      mitigate: 'v. to make less severe',
    },
  },
];

const load = () => {
  const s = localStorage.getItem(STORAGE_KEY);
  return s ? JSON.parse(s) : defaultPassages;
};
const save = (d) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d));

export default function VocabModule({ isEditor }) {
  const [passages, setPassages] = useState(load);
  const [view, setView] = useState('list'); // 'list' | 'read' | 'edit'
  const [activePassage, setActivePassage] = useState(null);
  const [editingPassage, setEditingPassage] = useState(null);

  const update = (data) => { setPassages(data); save(data); };

  const openRead = (passage) => { setActivePassage(passage); setView('read'); };
  const openEdit = (passage = null) => { setEditingPassage(passage); setView('edit'); };

  const savePassage = (data) => {
    if (data.id) {
      update(passages.map(p => p.id === data.id ? data : p));
    } else {
      update([...passages, { ...data, id: Date.now() }]);
    }
    setView('list');
  };

  const deletePassage = (id) => {
    if (confirm('Delete this passage?')) update(passages.filter(p => p.id !== id));
  };

  const saveAnnotation = (passageId, word, meaning) => {
    const updated = passages.map(p => {
      if (p.id !== passageId) return p;
      const annotations = { ...(p.annotations || {}) };
      if (!meaning) delete annotations[word];
      else annotations[word] = meaning;
      return { ...p, annotations };
    });
    update(updated);
    setActivePassage(updated.find(p => p.id === passageId));
  };

  if (view === 'edit') {
    return <PassageEditor passage={editingPassage} onSave={savePassage} onCancel={() => setView('list')} />;
  }

  if (view === 'read') {
    return (
      <PassageReadView
        passage={activePassage}
        isEditor={isEditor}
        onBack={() => setView('list')}
        onSaveAnnotation={saveAnnotation}
      />
    );
  }

  return (
    <PassageLibrary
      passages={passages}
      isEditor={isEditor}
      onRead={openRead}
      onEdit={openEdit}
      onDelete={deletePassage}
    />
  );
}