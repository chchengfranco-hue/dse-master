import { useState } from 'react';
import GeoMCQView from './GeoMCQView';
import GeoDataBasedView from './GeoDataBasedView';
import GeoEssayView from './GeoEssayView';
import { RotateCcw, Printer } from 'lucide-react';

export default function GeoExerciseResult({ result, onReset }) {
  const { type, topic, data } = result;

  return (
    <div>
      {/* Result header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">{topic}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {type === 'mcq' && 'Multiple Choice Questions 多項選擇題'}
            {type === 'data_based' && 'Data-based Questions 資料題'}
            {type === 'short_essay' && 'Short Essay Questions 短答題'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-muted border border-border text-foreground rounded-lg text-sm hover:bg-border transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> New Exercise
          </button>
        </div>
      </div>

      {type === 'mcq' && <GeoMCQView questions={data.questions || []} />}
      {type === 'data_based' && <GeoDataBasedView questions={data.questions || []} />}
      {type === 'short_essay' && <GeoEssayView questions={data.questions || []} />}
    </div>
  );
}