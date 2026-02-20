import React, { useState, useRef, useEffect } from 'react';
import { LyricLineData } from '../types';
import { countLineSyllables } from '../utils/helpers';
import { Hash, AlertCircle } from 'lucide-react';

interface Props {
  line: LyricLineData;
  index: number;
  onUpdate: (id: string, newText: string) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  showOriginal: boolean;
  delay?: number;
}

const LyricLine: React.FC<Props> = ({ line, index, onUpdate, onSelect, isSelected, showOriginal }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(line.text);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleInteraction = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY && line.type === 'lyric') {
       setIsEditing(true);
       onSelect(line.id);
    } else {
       onSelect(line.id);
    }
    lastTapRef.current = now;
  };

  const handleSave = () => {
    if (draft.trim() !== line.text) {
      onUpdate(line.id, draft);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(line.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (line.type === 'header') {
    return (
      <div className="mt-8 mb-3 flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-lyric-accent bg-lyric-surface px-2 py-1 rounded border border-lyric-border">
          {line.text.replace(/[\[\]]/g, '')}
        </span>
        <div className="h-px bg-lyric-border flex-1"></div>
      </div>
    );
  }

  const sylCount = line.syllables ?? countLineSyllables(line.text);
  const lockedConflict = line.flags?.includes('locked_word_conflict');

  const renderSyllableDots = () => {
    const dots = Array(Math.min(sylCount, 20)).fill(0);
    return (
      <div className="flex gap-0.5 mt-2 opacity-50 group-hover:opacity-100 transition-opacity">
        {dots.map((_, i) => (
          <div 
            key={i} 
            className={`w-1 h-1 rounded-full ${isSelected ? 'bg-lyric-accent' : 'bg-lyric-active'}`} 
          />
        ))}
        {sylCount > 20 && <span className="text-[8px] text-lyric-muted">+</span>}
      </div>
    );
  };
  
  return (
    <div 
      onClick={handleInteraction}
      className={`relative pl-4 py-3 pr-2 rounded-lg transition-colors duration-150 group border
        ${isSelected 
          ? 'bg-lyric-surface border-lyric-active' 
          : 'border-transparent hover:bg-lyric-surface/50'
      }`}
    >
      <span className={`absolute left-[-15px] top-4 text-[10px] font-mono w-5 text-right select-none ${isSelected ? 'text-lyric-accent font-bold' : 'text-lyric-active'}`}>
        {index + 1}
      </span>
      
      {isEditing ? (
        <div className="relative z-20">
          <input
            ref={inputRef}
            className="w-full bg-lyric-dark text-white p-2 rounded border border-lyric-accent focus:outline-none font-sans text-lg"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
          />
        </div>
      ) : (
        <div className="cursor-pointer">
          <div className="flex items-baseline justify-between gap-4">
            <p className={`text-base sm:text-lg leading-snug tracking-wide transition-colors ${line.isEdited ? 'text-lyric-accent' : 'text-lyric-text'} ${isSelected ? 'text-white' : ''}`}>
              {line.text}
            </p>
            
            <div className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors ${
                isSelected 
                  ? 'bg-lyric-accent text-white border-lyric-accent' 
                  : 'bg-transparent border-transparent text-lyric-active group-hover:border-lyric-border group-hover:text-lyric-muted'
              }`}>
               <Hash size={10} />
               <span className="text-[10px] font-mono font-bold">{sylCount}</span>
            </div>
          </div>
          
          {renderSyllableDots()}
          
          {lockedConflict && (
              <div className="flex items-center gap-1 text-[10px] text-red-400 mt-1">
                 <AlertCircle size={10} />
                 <span>Conflict</span>
              </div>
          )}

          {showOriginal && line.originalText !== line.text && (
            <p className="text-xs text-lyric-muted mt-2 pl-2 border-l-2 border-lyric-active opacity-70">
              orig: {line.originalText}
            </p>
          )}
        </div>
      )}
      
      {isSelected && !isEditing && (
         <div className="absolute left-0 top-2 bottom-2 w-1 bg-lyric-accent rounded-r"></div>
      )}
    </div>
  );
};

export default LyricLine;