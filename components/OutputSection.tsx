
import React, { useState, useRef } from 'react';
import { LyricVariant, AppConfig } from '../types';
import LyricLine from './LyricLine';
import MetadataPanel from './MetadataPanel';
import { ArrowLeft, Copy, SlidersHorizontal, Eye, EyeOff, X, Download } from 'lucide-react';
import { copyToClipboard, downloadHtmlExport } from '../utils/helpers';

interface Props {
  variants: LyricVariant[];
  activeVariantIndex: number;
  setActiveVariantIndex: (index: number) => void;
  onBack: () => void;
  
  onUpdateLine: (variantId: string, lineId: string, newText: string) => void;
  selectedLineId: string | null;
  onSelectLine: (id: string) => void;
  
  onSuggest: () => void;
  suggestions: string[];
  onApplySuggestion: (text: string) => void;
  onRegenerateLine: () => void;
  isProcessingLine: boolean;
  topic?: string; 
  style?: string;
}

const OutputSection: React.FC<Props> = ({ 
  variants, 
  activeVariantIndex, 
  setActiveVariantIndex,
  onBack,
  onUpdateLine,
  selectedLineId,
  onSelectLine,
  onSuggest,
  suggestions,
  onApplySuggestion,
  onRegenerateLine,
  isProcessingLine,
  topic = 'Song',
  style = 'Mix'
}) => {
  const [showMetadataSheet, setShowMetadataSheet] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  
  const activeVariant = variants[activeVariantIndex];
  
  // Touch swipe
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    
    if (diff > 50 && activeVariantIndex < variants.length - 1) {
      setActiveVariantIndex(activeVariantIndex + 1);
    }
    if (diff < -50 && activeVariantIndex > 0) {
      setActiveVariantIndex(activeVariantIndex - 1);
    }
    
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const handleCopy = () => {
    const text = activeVariant.lines
      .map(l => l.type === 'header' ? `\n${l.text}` : l.text)
      .join('\n')
      .trim();
    copyToClipboard(text);
  };

  const handleExport = () => {
    // Add missing aiInstructions property to dummyConfig to resolve TypeScript error
    const dummyConfig: AppConfig = {
        topic: topic,
        style: style as any,
        anchors: [],
        chorusContent: '',
        topicLocked: false,
        chorusLocked: false,
        durationMinutes: 3,
        rhymeRequired: true,
        variantCount: 1,
        maturity: 'SFW',
        language: 'English',
        aiInstructions: '',
        advancedMode: false,
        rhymeScheme: [],
        customStructure: [],
        storyContext: '',
        customStyleDescription: '',
        targetBpm: '',
        syllableTightness: 'Medium',
        meterConsistency: 'Mostly consistent',
        rhymePlacement: 'End',
        breathSensitivity: 'Auto'
    };
    downloadHtmlExport(activeVariant, dummyConfig);
  };

  if (!activeVariant) return null;

  return (
    <div className="flex flex-col h-full relative z-20 animate-fade-in">
      
      {/* --- TOP NAV --- */}
      <div className="flex-none glass-panel border-b border-white/10 z-40 rounded-b-3xl mx-2 mt-2 transition-all duration-300">
        <div className="h-16 px-4 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-lyric-muted text-sm font-bold hover:text-white transition-colors group px-2 py-1 uppercase tracking-wide">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>
          
          <div className="flex gap-2">
             <button onClick={() => setShowOriginal(!showOriginal)} className={`p-2.5 transition-colors rounded-full ${showOriginal ? 'text-lyric-accent bg-white/10' : 'text-lyric-muted hover:text-white hover:bg-white/5'}`}>
                {showOriginal ? <Eye size={18} /> : <EyeOff size={18} />}
             </button>
             <button onClick={handleExport} className="p-2.5 text-lyric-muted hover:text-white transition-colors rounded-full hover:bg-white/5">
                <Download size={18} />
             </button>
             <button onClick={handleCopy} className="p-2.5 text-lyric-muted hover:text-white transition-colors rounded-full hover:bg-white/5">
                <Copy size={18} />
             </button>
          </div>
        </div>

        {/* VARIANT TABS */}
        <div className="px-6 pb-4">
           <div className="flex bg-black/20 rounded-xl p-1">
              {variants.map((v, i) => {
                const isActive = activeVariantIndex === i;
                return (
                  <button
                    key={v.id}
                    onClick={() => setActiveVariantIndex(i)}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 rounded-lg
                      ${isActive ? 'text-white bg-white/10 shadow-lg' : 'text-lyric-muted hover:text-white'}`}
                  >
                    {v.name || `Mix ${i + 1}`}
                  </button>
                );
              })}
           </div>
        </div>
      </div>

      {/* --- LYRICS SCROLL AREA --- */}
      <div 
        className="flex-1 overflow-y-auto p-6 pb-32 no-scrollbar"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="max-w-2xl mx-auto space-y-2">
           {activeVariant.lines.map((line, idx) => (
             <div key={line.id} className="animate-slide-up-stagger" style={{ animationDelay: `${idx * 40}ms` }}>
                 <LyricLine
                   line={line}
                   index={idx}
                   onUpdate={(id, text) => onUpdateLine(activeVariant.id, id, text)}
                   onSelect={onSelectLine}
                   isSelected={selectedLineId === line.id}
                   showOriginal={showOriginal}
                 />
             </div>
           ))}
           <div className="h-24" /> 
        </div>
      </div>

      {/* --- DETAILS FAB --- */}
      <div className="absolute bottom-6 right-6 z-30 animate-scale-in" style={{ animationDelay: '0.5s' }}>
        <button
          onClick={() => setShowMetadataSheet(true)}
          className="bg-lyric-accent text-white shadow-xl rounded-full px-6 py-4 flex items-center gap-2 font-black tracking-widest text-xs hover:scale-105 transition-all active:scale-95 border-2 border-transparent hover:border-white/20"
        >
          <SlidersHorizontal size={16} />
          <span>ANALYTICS</span>
        </button>
      </div>

      {/* --- METADATA SHEET --- */}
      {showMetadataSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-md animate-fade-in">
           <div 
             className="bg-[#1e1030]/90 w-full max-w-lg rounded-t-3xl shadow-2xl h-[90vh] flex flex-col animate-slide-up border-t border-white/10"
             onClick={(e) => e.stopPropagation()}
           >
              {/* Header */}
              <div className="flex-none p-6 border-b border-white/10 flex justify-between items-center">
                 <h3 className="font-black text-white uppercase tracking-widest text-sm">Flow Analytics</h3>
                 <button onClick={() => setShowMetadataSheet(false)} className="p-2 text-lyric-muted hover:text-white hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 scroll-smooth no-scrollbar">
                 <MetadataPanel 
                    variant={activeVariant}
                    selectedLineId={selectedLineId}
                    onSuggest={onSuggest}
                    suggestions={suggestions}
                    onApplySuggestion={onApplySuggestion}
                    onRegenerateLine={onRegenerateLine}
                    isProcessing={isProcessingLine}
                 />
              </div>
           </div>
           <div className="absolute inset-0 -z-10" onClick={() => setShowMetadataSheet(false)} />
        </div>
      )}
    </div>
  );
};

export default OutputSection;
