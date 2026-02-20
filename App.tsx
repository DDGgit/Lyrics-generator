
import React, { useState } from 'react';
import { AppConfig, LyricVariant, ConflictWarning } from './types';
import InputSection from './components/InputSection';
import OutputSection from './components/OutputSection';
import ConflictModal from './components/ConflictModal';
import { generateLyrics, suggestAlternatives, regenerateSingleLine } from './services/geminiService';
import { Music, Music2, Music3, Music4 } from 'lucide-react';

type Screen = 'input' | 'output';

const DEFAULT_CONFIG: AppConfig = {
    topic: '',
    topicLocked: false,
    anchors: [],
    chorusContent: '',
    chorusLocked: false,
    style: 'Pop',
    durationMinutes: 3,
    rhymeRequired: true,
    variantCount: 2,
    maturity: 'SFW',
    language: 'English',
    aiInstructions: '',
    // Advanced Defaults
    advancedMode: false,
    rhymeScheme: [], 
    customStructure: [],
    storyContext: '',
    customStyleDescription: '',
    targetBpm: '',
    // Technical Defaults
    syllableTightness: 'Auto',
    meterConsistency: 'Auto',
    rhymePlacement: 'End',
    breathSensitivity: 'Auto'
};

const MusicNotesLoading: React.FC = () => (
  <div className="flex items-center gap-6">
    {[0, 1, 2, 3].map((i) => (
      <div 
        key={i} 
        className="animate-bounce" 
        style={{ animationDelay: `${i * 150}ms`, animationDuration: '1s' }}
      >
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center text-lyric-accent shadow-2xl">
          {i === 0 && <Music size={32} />}
          {i === 1 && <Music2 size={32} />}
          {i === 2 && <Music3 size={32} />}
          {i === 3 && <Music4 size={32} />}
        </div>
      </div>
    ))}
  </div>
);

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('input');
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  const [variants, setVariants] = useState<LyricVariant[]>([]);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Selection State
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isProcessingLine, setIsProcessingLine] = useState(false);

  // Conflict Modal State
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictWarning[]>([]);

  // Theme Logic
  const getThemeVars = () => {
    if (config.language === 'Hindi') {
      return {
        '--color-dark': '#1a0505',     
        '--color-panel': 'rgba(40, 10, 10, 0.7)', 
        '--color-surface': 'rgba(255, 200, 200, 0.05)',
        '--color-active': 'rgba(255, 100, 100, 0.1)',
        '--color-border': 'rgba(255, 100, 100, 0.2)',
        '--color-accent': '#fb923c',   
        '--color-secondary': '#facc15', 
        '--color-text': '#fff1f2',
        '--color-muted': '#fda4af'
      } as React.CSSProperties;
    }
    return {
        '--color-dark': '#0f0518',
        '--color-panel': 'rgba(30, 10, 50, 0.6)',
        '--color-surface': 'rgba(255, 255, 255, 0.03)',
        '--color-active': 'rgba(255, 255, 255, 0.1)',
        '--color-border': 'rgba(255, 255, 255, 0.08)',
        '--color-accent': '#d946ef',
        '--color-secondary': '#06b6d4',
        '--color-text': '#ffffff',
        '--color-muted': '#a5b4fc'
    } as React.CSSProperties;
  };

  const validateConfig = (c: AppConfig): ConflictWarning[] => {
    const warnings: ConflictWarning[] = [];
    if (c.style === 'Devotional' && (c.maturity === 'Explicit' || c.maturity === 'Mature')) {
      warnings.push({ id: 'devotional-explicit', title: 'Cultural Conflict', message: 'Devotional style is generally incompatible with Mature/Explicit content.' });
    }
    const isDefaultScheme = c.rhymeScheme.length === 0;
    if (!c.rhymeRequired && !isDefaultScheme) {
      warnings.push({ id: 'rhyme-logic', title: 'Rhyme Logic Conflict', message: 'Custom Rhyme Scheme defined but Rhyme is OFF.' });
    }
    if (c.topicLocked && c.topic.length < 3) {
        warnings.push({ id: 'empty-topic', title: 'Empty Topic Locked', message: 'Topic is locked but appears empty.' });
    }
    return warnings;
  };

  const handleReset = () => {
    if(window.confirm("Reset all settings to default?")) setConfig(DEFAULT_CONFIG);
  };

  const initiateGeneration = async () => {
     setShowConflictModal(false);
     setIsGenerating(true);
     setSelectedLineId(null);
     setSuggestions([]);

    try {
      const generatedVariants = await generateLyrics(config);
      setVariants(generatedVariants);
      setActiveVariantIndex(0);
      setCurrentScreen('output');
    } catch (error) {
      console.error("Failed to generate:", error);
      alert("Failed to generate lyrics. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateClick = () => {
    if (!config.topic) {
        alert("Please enter a topic to generate lyrics.");
        return;
    }
    const validationErrors = validateConfig(config);
    if (validationErrors.length > 0) {
        setConflicts(validationErrors);
        setShowConflictModal(true);
    } else {
        initiateGeneration();
    }
  };

  const handleBackToEdit = () => setCurrentScreen('input');

  const handleUpdateLine = (variantId: string, lineId: string, newText: string) => {
    setVariants(prev => prev.map(v => {
      if (v.id !== variantId) return v;
      return {
        ...v,
        lines: v.lines.map(l => {
          if (l.id !== lineId) return l;
          return { ...l, text: newText, isEdited: true };
        })
      };
    }));
  };

  const handleSelectLine = (id: string) => {
    setSelectedLineId(id);
    setSuggestions([]); 
  };

  const handleSuggest = async () => {
    if (!selectedLineId) return;
    const currentVariant = variants[activeVariantIndex];
    const lineIndex = currentVariant.lines.findIndex(l => l.id === selectedLineId);
    if (lineIndex === -1) return;

    setSuggestions([]);
    setIsProcessingLine(true);
    
    const line = currentVariant.lines[lineIndex];
    const contextLines = currentVariant.lines
        .slice(Math.max(0, lineIndex - 2), Math.min(currentVariant.lines.length, lineIndex + 3))
        .map(l => l.text);

    try {
      const results = await suggestAlternatives(line.text, contextLines, config.style, config.maturity);
      setSuggestions(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingLine(false);
    }
  };

  const handleApplySuggestion = (text: string) => {
    if (!selectedLineId) return;
    const currentVariant = variants[activeVariantIndex];
    handleUpdateLine(currentVariant.id, selectedLineId, text);
    setSuggestions([]); 
  };

  const handleRegenerateLine = async () => {
    if (!selectedLineId) return;
    const currentVariant = variants[activeVariantIndex];
    const lineIndex = currentVariant.lines.findIndex(l => l.id === selectedLineId);
    if (lineIndex === -1) return;

    setIsProcessingLine(true);
    const line = currentVariant.lines[lineIndex];
    const contextLines = currentVariant.lines
        .slice(Math.max(0, lineIndex - 2), Math.min(currentVariant.lines.length, lineIndex + 3))
        .map(l => l.text);

    try {
      const newLine = await regenerateSingleLine(line.text, contextLines, config);
      handleUpdateLine(currentVariant.id, selectedLineId, newLine);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingLine(false);
    }
  };

  return (
    <div 
      className="h-screen w-full overflow-hidden relative flex flex-col transition-colors duration-1000 scale-100"
      style={getThemeVars()}
    >
      <div key={currentScreen} className="flex-1 overflow-hidden w-full h-full animate-fade-in">
        {currentScreen === 'input' ? (
          <InputSection 
            config={config} 
            setConfig={setConfig} 
            onGenerate={handleGenerateClick} 
            onReset={handleReset}
            canGenerate={!!config.topic}
          />
        ) : (
          <OutputSection
            variants={variants}
            activeVariantIndex={activeVariantIndex}
            setActiveVariantIndex={setActiveVariantIndex}
            onBack={handleBackToEdit}
            onUpdateLine={handleUpdateLine}
            selectedLineId={selectedLineId}
            onSelectLine={handleSelectLine}
            onSuggest={handleSuggest}
            suggestions={suggestions}
            onApplySuggestion={handleApplySuggestion}
            onRegenerateLine={handleRegenerateLine}
            isProcessingLine={isProcessingLine}
            topic={config.topic}
            style={config.style}
          />
        )}
      </div>

      {isGenerating && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-xl flex flex-col items-center justify-center animate-fade-in">
           <MusicNotesLoading />
           <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-lyric-accent to-lyric-secondary mt-12 tracking-[0.25em] uppercase animate-pulse">Forging Melodies</h2>
           <div className="flex flex-col items-center gap-2 mt-6">
             <p className="text-lyric-muted text-xs font-mono tracking-[0.4em] uppercase opacity-70">
               Synthesizing rhythms
             </p>
             <div className="flex gap-1">
               <div className="w-1 h-1 bg-lyric-accent rounded-full animate-ping" style={{ animationDelay: '0ms' }} />
               <div className="w-1 h-1 bg-lyric-accent rounded-full animate-ping" style={{ animationDelay: '200ms' }} />
               <div className="w-1 h-1 bg-lyric-accent rounded-full animate-ping" style={{ animationDelay: '400ms' }} />
             </div>
           </div>
        </div>
      )}

      {showConflictModal && (
        <ConflictModal 
            conflicts={conflicts} 
            onContinue={initiateGeneration} 
            onEdit={() => setShowConflictModal(false)} 
        />
      )}
    </div>
  );
};

export default App;
