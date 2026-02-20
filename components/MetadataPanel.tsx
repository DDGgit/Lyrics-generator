import React from 'react';
import { LyricVariant } from '../types';
import { countLineSyllables } from '../utils/helpers';
import { Wand2, RefreshCw, CheckCircle2, Info, Wind, Mic2, Layers, Guitar, Clock, Music, BarChart3, Hash } from 'lucide-react';

interface Props {
  variant: LyricVariant;
  selectedLineId: string | null;
  onSuggest: () => void;
  suggestions: string[];
  onApplySuggestion: (text: string) => void;
  onRegenerateLine: () => void;
  isProcessing: boolean;
}

const MetadataPanel: React.FC<Props> = ({ 
  variant, 
  selectedLineId, 
  onSuggest, 
  suggestions,
  onApplySuggestion,
  onRegenerateLine,
  isProcessing 
}) => {
  const selectedLine = variant.lines.find(l => l.id === selectedLineId);
  const lyricLines = variant.lines.filter(l => l.type === 'lyric');
  const totalSyllables = lyricLines.reduce((acc, l) => acc + countLineSyllables(l.text), 0);
  
  // Logic fields
  const sylCount = selectedLine?.syllables ?? (selectedLine ? countLineSyllables(selectedLine.text) : 0);
  const flags = selectedLine?.flags || [];
  const explanation = selectedLine?.explain;

  // Syllable Distribution Logic
  const maxSyl = Math.max(...lyricLines.map(l => countLineSyllables(l.text)), 1);

  return (
    <div className="space-y-6 pb-8 text-lyric-text">
      
      {/* 1. KEY INFO */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-lyric-surface p-4 rounded-lg border border-lyric-border">
          <span className="text-[10px] uppercase font-bold text-lyric-muted flex items-center gap-1 mb-1">
             <Clock size={12} /> BPM & Time
          </span>
          <div className="flex items-baseline gap-2">
             <p className="text-2xl font-mono text-lyric-accent font-bold">{variant.metadata.bpm || '—'}</p>
             <span className="text-xs text-white opacity-80">{variant.metadata.timeSignature}</span>
          </div>
        </div>
        <div className="bg-lyric-surface p-4 rounded-lg border border-lyric-border">
          <span className="text-[10px] uppercase font-bold text-lyric-muted flex items-center gap-1 mb-1">
             <Music size={12} /> Key
          </span>
          <p className="text-2xl font-mono text-white font-bold">{variant.metadata.key || '—'}</p>
        </div>
      </div>

      {/* 2. DENSITY MAP (HIGH VISIBILITY) */}
      <div className="bg-lyric-surface rounded-lg p-5 border border-lyric-border">
        <div className="flex justify-between items-center mb-4">
           <h4 className="text-xs font-bold uppercase text-lyric-muted flex items-center gap-2">
             <BarChart3 size={14} className="text-lyric-secondary" /> Flow Density
           </h4>
           <span className="text-[10px] bg-lyric-dark px-2 py-1 rounded text-lyric-muted font-mono border border-lyric-border">
             {totalSyllables} total
           </span>
        </div>
        
        {/* GRAPH CONTAINER - PITCH BLACK BACKGROUND */}
        <div className="relative h-32 w-full bg-[#000000] rounded border border-lyric-active p-2 flex items-end gap-[1px]">
           {lyricLines.map((l, i) => {
              const count = countLineSyllables(l.text);
              const h = Math.max((count / maxSyl) * 100, 10);
              const isSelected = l.id === selectedLineId;
              
              return (
                <div 
                  key={l.id} 
                  className={`flex-1 rounded-sm transition-all duration-200 relative group
                    ${isSelected 
                      ? 'bg-lyric-accent z-10' 
                      : 'bg-lyric-secondary opacity-60 hover:opacity-100 hover:bg-lyric-secondary'}`}
                  style={{ height: `${h}%` }}
                >
                </div>
              );
           })}
           {/* Guidelines */}
           <div className="absolute inset-0 pointer-events-none flex flex-col justify-between opacity-20 z-0">
              <div className="w-full h-px bg-white"></div>
              <div className="w-full h-px bg-white"></div>
              <div className="w-full h-px bg-white"></div>
           </div>
        </div>
      </div>
      
      {/* 3. LINE INSPECTOR */}
      <div className="bg-lyric-surface rounded-lg p-5 border border-lyric-border">
        <h4 className="text-xs font-bold uppercase text-lyric-muted mb-4 flex items-center gap-2">
          <Hash size={14} /> Inspector
        </h4>
        
        {selectedLine && selectedLine.type === 'lyric' ? (
          <div className="space-y-4">
             {/* Text Display */}
             <div className="p-4 bg-lyric-dark rounded border border-lyric-border border-l-4 border-l-lyric-accent space-y-2">
               <p className="text-base text-white font-medium">"{selectedLine.text}"</p>
               <div className="flex items-center gap-2">
                  <span className="bg-lyric-accent text-white px-2 py-0.5 rounded text-[10px] font-mono font-bold">{sylCount} syl</span>
               </div>
             </div>

             {/* Actions */}
             <div className="grid grid-cols-2 gap-3">
               <button
                 onClick={onSuggest}
                 disabled={isProcessing}
                 className="flex items-center justify-center gap-2 bg-lyric-dark border border-lyric-border text-white py-3 rounded text-sm font-bold hover:bg-lyric-panel transition-all disabled:opacity-50"
               >
                 {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : <Wand2 size={16} />}
                 <span>Suggest</span>
               </button>
               <button
                 onClick={onRegenerateLine}
                 disabled={isProcessing}
                 className="flex items-center justify-center gap-2 bg-lyric-dark border border-lyric-border text-white py-3 rounded text-sm font-bold hover:bg-lyric-panel transition-all disabled:opacity-50"
               >
                 <RefreshCw size={16} />
                 <span>Regen</span>
               </button>
             </div>

             {/* Results */}
             {suggestions.length > 0 && (
               <div className="mt-4 pt-4 border-t border-lyric-border">
                 <p className="text-[10px] uppercase text-lyric-muted mb-3 font-bold">Suggestions</p>
                 <div className="space-y-2">
                   {suggestions.map((s, i) => {
                     const sCount = countLineSyllables(s);
                     const diff = sCount - sylCount;
                     return (
                       <button
                         key={i}
                         onClick={() => onApplySuggestion(s)}
                         className="w-full text-left p-3 rounded bg-lyric-dark border border-lyric-border hover:border-lyric-accent transition-colors group"
                       >
                         <p className="text-sm text-lyric-text group-hover:text-white mb-1">{s}</p>
                         <div className="flex gap-2 text-[10px] text-lyric-muted">
                           <span>{sCount} syl</span>
                           {diff !== 0 && (
                             <span className={diff > 0 ? 'text-blue-400' : 'text-orange-400'}>
                               {diff > 0 ? `+${diff}` : diff}
                             </span>
                           )}
                         </div>
                       </button>
                     );
                   })}
                 </div>
               </div>
             )}
          </div>
        ) : (
          <div className="text-center py-8 bg-lyric-dark rounded border border-dashed border-lyric-border">
            <p className="text-lyric-muted text-xs font-medium">Select a line to edit.</p>
          </div>
        )}
      </div>

      {/* 4. EXTRA METADATA */}
      <div className="grid grid-cols-2 gap-3">
            <div className="bg-lyric-surface p-3 rounded-lg border border-lyric-border">
                <span className="text-[10px] text-lyric-muted block mb-1 uppercase font-bold flex items-center gap-1">
                   <Wind size={10} /> Mood
                </span>
                <span className="text-sm text-white font-medium block truncate">{variant.metadata.mood || 'N/A'}</span>
            </div>
            <div className="bg-lyric-surface p-3 rounded-lg border border-lyric-border">
                <span className="text-[10px] text-lyric-muted block mb-1 uppercase font-bold flex items-center gap-1">
                   <Layers size={10} /> Density
                </span>
                <span className="text-sm text-white font-medium block truncate">{variant.metadata.lyricalDensity || 'Standard'}</span>
            </div>
            <div className="col-span-2 bg-lyric-surface p-3 rounded-lg border border-lyric-border">
                 <span className="text-[10px] text-lyric-muted block mb-1 uppercase font-bold flex items-center gap-1">
                   <Guitar size={10} /> Instruments
                </span>
                <span className="text-sm text-white font-medium block">
                  {variant.metadata.recommendedInstruments?.join(', ') || 'Various'}
                </span>
            </div>
      </div>
    </div>
  );
};

export default MetadataPanel;