import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AnnotatedPassage from '@/components/vocab/AnnotatedPassage';
import MarginPane from '@/components/vocab/MarginPane';
import PrintModal from '@/components/vocab/PrintModal';

export default function PassageReadView({ passage, isEditor, onBack, onSaveAnnotation }) {
  const [showMargin, setShowMargin] = useState(false);
  const [showRuby, setShowRuby] = useState(false);
  const [activeWord, setActiveWord] = useState(null);
  const [showPrint, setShowPrint] = useState(false);
  const contentRef = useRef(null);

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const playFull = () => {
    const text = passage.content;
    speak(text);
  };

  const playSelection = () => {
    const sel = window.getSelection()?.toString().trim();
    if (sel) speak(sel);
    else alert('Please highlight text first.');
  };

  const stopSpeaking = () => window.speechSynthesis?.cancel();

  const handleWordClick = (word, meaning) => {
    speak(word);
    if (!showMargin && !showRuby) setActiveWord(activeWord === word ? null : word);
  };

  const handleTextSelect = useCallback(() => {
    if (!isEditor) return;
    const sel = window.getSelection()?.toString().trim();
    if (sel && sel.length > 0 && sel.length < 35 && !sel.includes('\n')) {
      setTimeout(() => {
        const meaning = prompt(`Add annotation for "${sel}":\n(Leave blank and press OK to remove)`);
        if (meaning !== null) onSaveAnnotation(passage.id, sel, meaning.trim());
        window.getSelection()?.removeAllRanges();
      }, 50);
    }
  }, [isEditor, passage.id, onSaveAnnotation]);

  const annotations = passage.annotations || {};
  const annotationCount = Object.keys(annotations).length;

  return (
    <div className="px-4 lg:px-8 py-6 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <Button variant="outline" size="sm" onClick={onBack}>← Back to Library</Button>

        <div className="flex flex-wrap gap-2">
          <button onClick={playFull} className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">🔊 Read Aloud</button>
          <button onClick={playSelection} className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">🔊 Read Selection</button>
          <button onClick={stopSpeaking} className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">⏹ Stop</button>

          {annotationCount > 0 && <>
            <button
              onClick={() => setShowRuby(v => !v)}
              className={cn("text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors",
                showRuby ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-muted text-muted-foreground border-border hover:bg-accent')}
            >📖 {showRuby ? 'Hide' : 'Show'} Ruby</button>
            <button
              onClick={() => setShowMargin(v => !v)}
              className={cn("text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors",
                showMargin ? 'bg-primary/10 text-primary border-primary/30' : 'bg-muted text-muted-foreground border-border hover:bg-accent')}
            >💬 {showMargin ? 'Hide' : 'Show'} Margin</button>
          </>}

          <button onClick={() => setShowPrint(true)} className="text-xs bg-card border border-border text-foreground hover:bg-muted px-3 py-1.5 rounded-lg font-medium transition-colors">🖨️ Print…</button>
        </div>
      </div>

      {/* Title & badge */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-foreground mb-2">{passage.title}</h2>
        {(passage.topic) && (
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
            {passage.topic}{passage.subtopic && passage.subtopic !== 'General' ? ` › ${passage.subtopic}` : ''}
          </span>
        )}
      </div>

      {isEditor && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-5 text-sm">
          <strong>Editor Mode:</strong> Highlight any word in the passage to add or remove an annotation.
          <em className="block text-xs mt-1 opacity-80">Tip: Start definitions with n., v., adj., adv. for colour-coded margin notes.</em>
        </div>
      )}

      {/* Image */}
      {passage.imageUrl && (
        <img src={passage.imageUrl} alt="Theme" className="max-h-72 rounded-2xl mb-5 object-cover" />
      )}

      {/* Reading layout */}
      <div className={cn("flex gap-5 items-start", showMargin && "flex-row")}>
        <div className="flex-1 min-w-0 bg-card rounded-2xl border border-border p-6 lg:p-8 text-base leading-loose" ref={contentRef} onMouseUp={handleTextSelect}>
          <AnnotatedPassage
            content={passage.content}
            annotations={annotations}
            showRuby={showRuby}
            activeWord={activeWord}
            onWordClick={handleWordClick}
          />
        </div>
        {showMargin && annotationCount > 0 && (
          <MarginPane annotations={annotations} activeWord={activeWord} onHover={setActiveWord} />
        )}
      </div>

      {/* Floating tooltip when neither mode is active */}
      {activeWord && !showMargin && !showRuby && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm shadow-xl z-50 max-w-xs text-center pointer-events-none">
          <strong className="block text-primary">{activeWord}</strong>
          {annotations[activeWord]}
        </div>
      )}

      {showPrint && (
        <PrintModal passage={passage} isEditor={isEditor} onClose={() => setShowPrint(false)} />
      )}
    </div>
  );
}