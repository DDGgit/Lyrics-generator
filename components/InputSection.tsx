
import React, { useState, useRef } from 'react';
import { AppConfig, MusicStyle, MaturityLevel, Language } from '../types';
import { MUSIC_STYLES, AVAILABLE_SECTIONS, STYLE_EXAMPLES } from '../constants';
import { 
  Lock, Unlock, Plus, X, ChevronDown, Check, Sparkles, Loader2, 
  Settings2, RotateCcw, PenTool, Music, Mic2, Layers, 
  AlignLeft, ArrowRight, Wand2, Gauge, Music2, ListFilter, Compass,
  HelpCircle, BookOpen
} from 'lucide-react';
import { generateAnchorSuggestions } from '../services/geminiService';

interface Props {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
  onGenerate: () => void;
  onReset: () => void;
  canGenerate: boolean;
}

const SectionCard: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode; 
    badge?: string; 
    subtitle?: string;
    className?: string;
}> = ({ title, icon, children, badge, subtitle, className = "" }) => (
    <div className={`rounded-3xl p-6 border border-white/5 bg-white/[0.01] shadow-xl animate-slide-up-stagger ${className}`}>
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-xl text-lyric-accent">
                    {React.cloneElement(icon as React.ReactElement, { size: 18 })}
                </div>
                <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">{title}</h3>
                    {subtitle && <p className="text-[9px] text-lyric-muted font-medium leading-none mt-1">{subtitle}</p>}
                </div>
            </div>
            {badge && (
                <span className="px-2 py-1 rounded-full bg-lyric-accent/10 text-lyric-accent text-[8px] font-black uppercase tracking-widest border border-lyric-accent/20">
                    {badge}
                </span>
            )}
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const InputSection: React.FC<Props> = ({ config, setConfig, onGenerate, onReset, canGenerate }) => {
  const [activeTab, setActiveTab] = useState<'compose' | 'studio'>('compose');
  const [showAnchorInput, setShowAnchorInput] = useState(false);
  const [newAnchor, setNewAnchor] = useState('');
  const [isAutoGeneratingAnchors, setIsAutoGeneratingAnchors] = useState(false);
  const [showSectionPicker, setShowSectionPicker] = useState(false);
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const touchStartX = useRef<number | null>(null);

  const handleRhymeChange = (index: number, val: string) => {
    const char = val.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
    const newScheme = [...config.rhymeScheme];
    if (newScheme.length === 0) {
        const init = Array(index + 1).fill('A');
        init[index] = char;
        setConfig(prev => ({ ...prev, rhymeScheme: init }));
    } else {
        newScheme[index] = char;
        setConfig(prev => ({ ...prev, rhymeScheme: newScheme }));
    }
  };

  const addRhymeBox = () => setConfig(prev => ({ ...prev, rhymeScheme: prev.rhymeScheme.length === 0 ? ['A'] : [...prev.rhymeScheme, 'A'] }));
  const removeRhymeBox = (index: number) => setConfig(prev => ({ ...prev, rhymeScheme: prev.rhymeScheme.filter((_, i) => i !== index) }));

  const addAnchor = () => {
    if (newAnchor.trim() && config.anchors.length < 8) {
      setConfig(prev => ({ ...prev, anchors: [...prev.anchors, newAnchor.trim()] }));
      setNewAnchor('');
    }
  };

  const handleAutoGenerateAnchors = async () => {
    if (!config.topic) return;
    setIsAutoGeneratingAnchors(true);
    try {
      const suggestions = await generateAnchorSuggestions(config.topic, config.language);
      if (suggestions) {
        const current = new Set(config.anchors);
        suggestions.forEach(s => !current.has(s) && current.size < 8 && current.add(s));
        setConfig(prev => ({ ...prev, anchors: Array.from(current) }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAutoGeneratingAnchors(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = window.innerWidth * 0.5; // Threshold check: Must be at least 50% screen width
    
    if (Math.abs(diffX) > threshold) {
        if (diffX < 0 && activeTab === 'compose') { 
            setActiveTab('studio'); 
            setConfig(p => ({...p, advancedMode: true})); 
        } else if (diffX > 0 && activeTab === 'studio') { 
            setActiveTab('compose'); 
        }
    }
    touchStartX.current = null;
  };

  return (
    <div className="flex flex-col h-full text-lyric-text font-sans relative z-10 overflow-hidden">
      
      {/* --- HEADER (Adjusted Spacing) --- */}
      <header className="flex-none px-4 py-3 flex items-center justify-between glass-panel z-[100] rounded-b-2xl mx-3 mt-2 border-none shadow-xl">
        <div className="flex items-center gap-2.5">
           <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lyric-accent to-lyric-secondary flex items-center justify-center text-white shadow-md">
             <Music2 size={18} fill="currentColor" />
           </div>
           <div>
             <h1 className="text-lg font-black tracking-tight text-white leading-none">LyricOS</h1>
             <span className="text-[7px] text-lyric-muted font-bold tracking-widest uppercase block mt-0.5 opacity-80">Engine 2.5 • AI PRO</span>
           </div>
        </div>
        
        <div className="flex items-center gap-1.5">
           <button 
              onClick={() => setShowManual(true)}
              className="w-8 h-8 flex items-center justify-center text-lyric-muted hover:text-lyric-accent bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10 active:scale-90"
           >
             <HelpCircle size={16} />
           </button>
           <div className="bg-white/5 p-0.5 rounded-lg border border-white/10 flex">
             {(['English', 'Hindi'] as Language[]).map(lang => (
               <button
                 key={lang}
                 onClick={() => setConfig(prev => ({ ...prev, language: lang }))}
                 className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-md transition-all duration-300 ${config.language === lang ? 'bg-lyric-accent text-white' : 'text-lyric-muted hover:text-white'}`}
               >
                 {lang}
               </button>
             ))}
           </div>
           <button onClick={onReset} className="w-8 h-8 flex items-center justify-center text-lyric-muted hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/10 active:scale-90">
             <RotateCcw size={14} />
           </button>
        </div>
      </header>

      {/* --- TAB NAVIGATION --- */}
      <nav className="flex-none px-6 py-4 relative z-50">
         <div className="flex relative bg-white/[0.03] rounded-2xl p-1 border border-white/5 max-w-[320px] mx-auto overflow-hidden">
            <div 
                className="absolute top-1 bottom-1 w-[calc(50%-2px)] bg-white/10 rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/10 transition-all duration-500"
                style={{ 
                    left: activeTab === 'compose' ? '1px' : 'calc(50% + 1px)',
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)' 
                }} 
            />
            <button
               onClick={() => setActiveTab('compose')}
               className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${activeTab === 'compose' ? 'text-white scale-105' : 'text-lyric-muted'}`}
            >
               <PenTool size={14} /> Compose
            </button>
            <button
               onClick={() => { setActiveTab('studio'); setConfig(p => ({...p, advancedMode: true})); }}
               className={`flex-1 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all duration-300 relative z-10 flex items-center justify-center gap-2 ${activeTab === 'studio' ? 'text-white scale-105' : 'text-lyric-muted'}`}
            >
               <Settings2 size={14} /> Studio
            </button>
         </div>
      </nav>

      {/* --- MAIN SCROLL CONTENT --- */}
      <main 
        className="flex-1 overflow-y-auto no-scrollbar touch-pan-y px-4 pb-32 relative z-10"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
         <div key={activeTab} className="max-w-4xl mx-auto space-y-4 animate-fade-in">

            {activeTab === 'compose' ? (
              <>
                 {/* CORE CONCEPT */}
                 <div className="rounded-3xl p-6 border border-white/5 bg-white/[0.02] shadow-xl animate-slide-up relative">
                    <div className="flex justify-between items-start mb-4">
                        <label className="text-[9px] font-black uppercase text-lyric-muted tracking-[0.25em] flex items-center gap-2">
                            <Sparkles size={12} className="text-lyric-accent animate-pulse" /> The Core Concept
                        </label>
                        <button onClick={() => setConfig(p => ({...p, topicLocked: !p.topicLocked}))} className={`p-2 rounded-xl border border-white/10 transition-all active:scale-95 ${config.topicLocked ? 'bg-lyric-accent text-white' : 'bg-white/5 text-lyric-muted'}`}>
                            {config.topicLocked ? <Lock size={14}/> : <Unlock size={14}/>}
                        </button>
                    </div>
                    <textarea
                        className="w-full bg-transparent text-2xl font-black placeholder:text-white/5 focus:outline-none resize-none h-20 leading-tight text-white tracking-tight"
                        placeholder="What's this song about?"
                        value={config.topic}
                        onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                    />
                    
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex flex-wrap items-center gap-2">
                            {config.anchors.map((a, i) => (
                                <span key={i} className="px-3 py-1.5 rounded-xl bg-lyric-accent/5 border border-lyric-accent/20 text-[10px] font-black text-white flex items-center gap-2 hover:bg-lyric-accent/10 transition-all">
                                    <span className="text-lyric-accent opacity-50">#</span>{a} 
                                    <button onClick={() => setConfig(p => ({...p, anchors: p.anchors.filter((_,x)=>x!==i)}))} className="hover:text-red-400">
                                        <X size={10}/>
                                    </button>
                                </span>
                            ))}
                            {showAnchorInput ? (
                                <input autoFocus className="px-3 py-1.5 rounded-xl bg-white/5 border border-lyric-accent/50 text-[10px] text-white outline-none w-24 font-bold" placeholder="..." value={newAnchor} onChange={e => setNewAnchor(e.target.value)} onKeyDown={e => { if(e.key==='Enter') addAnchor(); }} onBlur={() => setShowAnchorInput(false)} />
                            ) : (
                                <button onClick={() => setShowAnchorInput(true)} className="px-3 py-1.5 rounded-xl border border-dashed border-white/10 text-[10px] font-black text-lyric-muted hover:text-white transition-all">
                                    + Anchor Word
                                </button>
                            )}
                            <button onClick={handleAutoGenerateAnchors} disabled={!config.topic || isAutoGeneratingAnchors} className="ml-auto px-2 py-1.5 text-[9px] text-lyric-secondary hover:text-white flex items-center gap-1.5 font-black tracking-widest uppercase disabled:opacity-30">
                                {isAutoGeneratingAnchors ? <Loader2 size={12} className="animate-spin"/> : <Wand2 size={12}/>} AI INFER
                            </button>
                        </div>
                    </div>
                 </div>

                 {/* GUIDE YOUR WAY */}
                 <SectionCard title="Guide your way" icon={<Compass />} subtitle="AI special instructions">
                     <textarea
                         className="w-full bg-white/5 rounded-2xl p-4 text-[11px] font-medium focus:outline-none resize-none placeholder:text-white/10 text-white h-24 border border-white/10"
                         placeholder="Example: Write the chorus in Sanskrit and the rest in Hindi. Use heavy metaphors about rain..."
                         value={config.aiInstructions}
                         onChange={(e) => setConfig({ ...config, aiInstructions: e.target.value })}
                     />
                 </SectionCard>

                 <div className="grid md:grid-cols-2 gap-4">
                    <SectionCard title="Aesthetic" icon={<Music />} subtitle="Style & Vibe" className="relative z-40">
                        <div className="space-y-4 relative">
                            <div className="relative">
                                <button 
                                    onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
                                    className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-lyric-accent/30 transition-all"
                                >
                                    <div className="text-left">
                                        <span className="text-[12px] font-black text-white uppercase tracking-wider block">{config.style}</span>
                                        <span className="text-[9px] text-lyric-muted font-medium mt-1 block">
                                            {STYLE_EXAMPLES[config.style].join(' • ')}
                                        </span>
                                    </div>
                                    <ChevronDown size={14} className={`text-lyric-muted transition-transform duration-300 ${isStyleDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isStyleDropdownOpen && (
                                    <div className="absolute left-0 right-0 top-full mt-2 glass-panel rounded-3xl shadow-2xl z-[100] p-2 grid grid-cols-1 gap-1 animate-scale-in border border-white/10 max-h-[300px] overflow-y-auto no-scrollbar">
                                        {MUSIC_STYLES.map(s => (
                                            <button 
                                                key={s} 
                                                onClick={() => { setConfig({...config, style: s}); setIsStyleDropdownOpen(false); }} 
                                                className={`text-left p-4 rounded-2xl transition-all flex items-center justify-between group ${config.style === s ? 'bg-lyric-accent text-white' : 'text-lyric-muted hover:bg-white/5 hover:text-white'}`}
                                            >
                                                <div>
                                                    <span className="text-[10px] font-black uppercase block">{s}</span>
                                                    <span className={`text-[8px] mt-0.5 block opacity-60 font-medium ${config.style === s ? 'text-white' : 'text-lyric-muted group-hover:text-white'}`}>
                                                        {STYLE_EXAMPLES[s].join(', ')}
                                                    </span>
                                                </div>
                                                {config.style === s && <Check size={14} className="text-white" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-black text-lyric-muted uppercase tracking-widest">Runtime</span>
                                        <span className="text-[10px] text-white font-black bg-white/10 px-2 py-1 rounded-lg">{config.durationMinutes}m</span>
                                    </div>
                                    <input type="range" min="0.5" max="8" step="0.5" className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-lyric-accent" value={config.durationMinutes} onChange={e => setConfig({...config, durationMinutes: parseFloat(e.target.value)})} />
                                </div>
                                <div>
                                    <div className="flex bg-black/30 p-1 rounded-xl border border-white/5">
                                        {(['SFW', 'Mature'] as MaturityLevel[]).map(m => (
                                            <button key={m} onClick={() => setConfig({...config, maturity: m})} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${config.maturity === m ? 'bg-white/10 text-white' : 'text-lyric-muted'}`}>
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard title="Refrain" icon={<Mic2 />} subtitle="Hook / Chorus content">
                        <div className="space-y-3">
                            <textarea
                                className="w-full bg-white/5 rounded-xl p-3 text-[11px] font-medium focus:outline-none resize-none placeholder:text-white/10 text-white h-20 border border-white/10"
                                placeholder="Locked chorus lines..."
                                value={config.chorusContent}
                                onChange={(e) => setConfig({ ...config, chorusContent: e.target.value })}
                            />
                            <button onClick={() => setConfig(p => ({...p, chorusLocked: !p.chorusLocked}))} className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all border ${config.chorusLocked ? 'bg-lyric-accent border-lyric-accent text-white shadow-md' : 'bg-white/5 border-white/10 text-lyric-muted'}`}>
                                {config.chorusLocked ? <Lock size={12}/> : <Unlock size={12}/>}
                                {config.chorusLocked ? 'Strict Repeat' : 'Flexible Iteration'}
                            </button>
                        </div>
                    </SectionCard>
                 </div>
              </>
            ) : (
              <div className="space-y-4 animate-slide-up">
                  <div className="grid md:grid-cols-2 gap-4">
                      <SectionCard title="Context" icon={<ListFilter />} subtitle="Deeper meaning">
                          <textarea
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-[11px] font-medium focus:outline-none resize-none placeholder:text-white/10 text-white h-24"
                              placeholder="Describe the narrative arc..."
                              value={config.storyContext}
                              onChange={(e) => setConfig({ ...config, storyContext: e.target.value })}
                          />
                      </SectionCard>

                      <SectionCard title="Flow Matrix" icon={<AlignLeft />} badge={config.customStructure.length > 0 ? `${config.customStructure.length}` : 'Auto'} subtitle="Structure" className="relative z-40">
                          <div className="space-y-3">
                              <div className="flex flex-wrap gap-2 min-h-[50px] p-2 bg-black/20 rounded-xl border border-white/5 items-center">
                                  {config.customStructure.length === 0 && <p className="text-[9px] text-white/20 uppercase font-black m-auto tracking-widest">Emergent Structure</p>}
                                  {config.customStructure.map((s, i) => (
                                      <div key={i} className="flex items-center gap-2 bg-white/10 px-2 py-1 rounded-lg border border-white/10 shadow-sm">
                                          <span className="text-[10px] font-black text-white">{s}</span>
                                          <button onClick={() => setConfig(p => ({...p, customStructure: p.customStructure.filter((_,x)=>x!==i)}))} className="text-white/30 hover:text-red-400">
                                              <X size={10} />
                                          </button>
                                      </div>
                                  ))}
                              </div>
                              <div className="relative">
                                  <button onClick={() => setShowSectionPicker(!showSectionPicker)} className="w-full py-2.5 bg-white/5 border border-dashed border-white/10 rounded-xl text-[10px] font-black text-lyric-muted hover:text-white transition-all uppercase tracking-widest">
                                      {showSectionPicker ? 'Close' : '+ Insert Section'}
                                  </button>
                                  {showSectionPicker && (
                                      <div className="absolute bottom-full left-0 right-0 mb-2 glass-panel rounded-2xl p-2 grid grid-cols-3 gap-2 shadow-2xl z-[100] border border-white/10">
                                          {AVAILABLE_SECTIONS.map(s => (
                                              <button key={s} onClick={() => setConfig(p => ({...p, customStructure: [...p.customStructure, s]}))} className="text-[9px] font-black uppercase text-lyric-muted hover:text-white p-2 rounded-xl bg-white/5">
                                                  {s}
                                              </button>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>
                      </SectionCard>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                      <SectionCard title="Rhyme Engine" icon={<Layers />} badge={config.rhymeScheme.length > 0 ? 'Manual' : 'Auto'} subtitle="Phonetic logic">
                          <div className="space-y-4">
                              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                  <span className="text-[10px] text-lyric-muted uppercase font-black tracking-widest">Strict Rhyme</span>
                                  <button 
                                      onClick={() => setConfig(p => ({...p, rhymeRequired: !p.rhymeRequired}))} 
                                      className={`w-10 h-6 rounded-full relative transition-all duration-300 ${config.rhymeRequired ? 'bg-lyric-accent' : 'bg-white/10'}`}
                                  >
                                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${config.rhymeRequired ? 'left-5' : 'left-1'}`} />
                                  </button>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                  {config.rhymeScheme.map((char, i) => (
                                      <div key={i} className="relative group">
                                          <input value={char} onChange={(e) => handleRhymeChange(i, e.target.value)} className="w-10 h-10 rounded-xl bg-white/5 text-center text-[12px] font-black text-white border border-white/5 focus:border-lyric-accent outline-none uppercase" />
                                          <button onClick={() => removeRhymeBox(i)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4.5 h-4.5 flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                                              <X size={8} />
                                          </button>
                                      </div>
                                  ))}
                                  <button onClick={addRhymeBox} className="w-10 h-10 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-white/30 hover:text-white transition-colors">
                                      <Plus size={16} />
                                  </button>
                              </div>
                          </div>
                      </SectionCard>

                      <SectionCard title="Bio-Metrics" icon={<Gauge />} subtitle="Vocal constraints">
                          <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-lyric-muted uppercase">Syllables</label>
                                  <select value={config.syllableTightness} onChange={e => setConfig({...config, syllableTightness: e.target.value as any})} className="w-full bg-white/5 text-[10px] font-black text-white p-2.5 rounded-xl border border-white/10 appearance-none uppercase">
                                      {['Auto', 'Loose', 'Medium', 'Tight'].map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                              </div>
                              <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-lyric-muted uppercase">Meter</label>
                                  <select value={config.meterConsistency} onChange={e => setConfig({...config, meterConsistency: e.target.value as any})} className="w-full bg-white/5 text-[10px] font-black text-white p-2.5 rounded-xl border border-white/10 appearance-none uppercase">
                                      {['Auto', 'Free', 'Strict'].map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                              </div>
                              <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-lyric-muted uppercase">Target BPM</label>
                                  <input type="number" placeholder="BPM" value={config.targetBpm} onChange={e => setConfig({...config, targetBpm: e.target.value})} className="w-full bg-white/5 text-[10px] font-black text-white p-2.5 rounded-xl border border-white/10 outline-none" />
                              </div>
                              <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-lyric-muted uppercase">Breath Gap</label>
                                  <select value={config.breathSensitivity} onChange={e => setConfig({...config, breathSensitivity: e.target.value as any})} className="w-full bg-white/5 text-[10px] font-black text-white p-2.5 rounded-xl border border-white/10 appearance-none uppercase">
                                      {['Auto', 'Conservative', 'Aggressive'].map(o => <option key={o} value={o}>{o}</option>)}
                                  </select>
                              </div>
                          </div>
                      </SectionCard>
                  </div>

               </div>
            )}

         </div>
      </main>

      {/* --- HOW TO USE MODAL --- */}
      {showManual && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <div className="glass-panel w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-scale-in border border-white/10">
                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-lyric-accent/10 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-lyric-accent/20 rounded-2xl text-lyric-accent">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tight">LyricOS Manual</h2>
                            <p className="text-xs text-lyric-muted font-bold tracking-widest uppercase mt-1">Operational Guide</p>
                        </div>
                    </div>
                    <button onClick={() => setShowManual(false)} className="p-2 text-lyric-muted hover:text-white hover:bg-white/10 rounded-full transition-all">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                    <section className="space-y-4">
                        <h3 className="text-xs font-black text-lyric-accent uppercase tracking-[0.2em] flex items-center gap-2">
                            <div className="w-4 h-[1px] bg-lyric-accent"></div> Modes: Compose vs Studio
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <h4 className="text-[11px] font-black text-white uppercase mb-2 flex items-center gap-2"><PenTool size={12}/> Compose</h4>
                                <p className="text-[10px] text-lyric-muted leading-relaxed font-medium">The creative heart. Define topic, mood, and genre. Best for brainstorming the soul of the song.</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <h4 className="text-[11px] font-black text-white uppercase mb-2 flex items-center gap-2"><Settings2 size={12}/> Studio</h4>
                                <p className="text-[10px] text-lyric-muted leading-relaxed font-medium">The precision engine. Control structure, rhyme schemes, and narrative arcs. Use for specific technical results.</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-xs font-black text-lyric-accent uppercase tracking-[0.2em] flex items-center gap-2">
                            <div className="w-4 h-[1px] bg-lyric-accent"></div> Core Input Fields
                        </h3>
                        <div className="space-y-3">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <h4 className="text-[11px] font-black text-white uppercase mb-1">The Core Concept</h4>
                                <p className="text-[10px] text-lyric-muted font-medium mb-2">The fundamental topic of your song. Toggle the <b>Lock</b> to force the AI to stick purely to your text without metaphorical deviation.</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <h4 className="text-[11px] font-black text-white uppercase mb-1">Guide Your Way</h4>
                                <p className="text-[10px] text-lyric-muted font-medium mb-2">Custom AI instructions. Tell the engine exactly how to behave (e.g., "Use heavy water metaphors", "Make it sound like 90s hip hop").</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <h4 className="text-[11px] font-black text-white uppercase mb-1">Context (Studio Tab)</h4>
                                <p className="text-[10px] text-lyric-muted font-medium mb-2">The narrative trajectory. Describe the story arc, emotional peaks, or specific scenarios the song should inhabit.</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-xs font-black text-lyric-accent uppercase tracking-[0.2em] flex items-center gap-2">
                            <div className="w-4 h-[1px] bg-lyric-accent"></div> Lock Mechanisms
                        </h3>
                        <div className="space-y-3">
                            <div className="flex gap-4 items-start p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="p-2 bg-lyric-accent/10 text-lyric-accent rounded-xl shrink-0"><Lock size={14}/></div>
                                <div>
                                    <h4 className="text-[11px] font-black text-white uppercase mb-1">Refrain Lock</h4>
                                    <p className="text-[10px] text-lyric-muted leading-relaxed font-medium"><b>ON:</b> Your chorus is used 1:1. <b>OFF:</b> AI riffs on your lines creatively.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-xs font-black text-lyric-accent uppercase tracking-[0.2em] flex items-center gap-2">
                            <div className="w-4 h-[1px] bg-lyric-accent"></div> Gestures & Navigation
                        </h3>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                            <p className="text-[10px] text-lyric-muted font-medium"><b>Swipe Switch:</b> Drag horizontally across more than 50% of the screen width to flip between tabs instantly.</p>
                            <p className="text-[10px] text-lyric-muted font-medium"><b>Force Rhyme:</b> Toggle the switch in Studio -> Rhyme Engine to ensure phonetic consistency across the song.</p>
                        </div>
                    </section>
                </div>

                <div className="p-8 border-t border-white/10 bg-black/20">
                    <button onClick={() => setShowManual(false)} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-[11px] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all">
                        Got it, Forge ahead
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- GENERATE FAB --- */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-lyric-dark via-lyric-dark/95 to-transparent z-[60] flex justify-center">
         <button 
           onClick={onGenerate}
           disabled={!canGenerate}
           className="bg-white text-black shadow-2xl rounded-2xl w-full max-w-lg py-4 flex items-center justify-center gap-4 font-black tracking-[0.2em] text-[12px] hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-20 border-2 border-transparent hover:border-lyric-accent group"
         >
            <span className="uppercase">Forge Lyrics</span>
            <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform duration-300" />
         </button>
      </footer>

    </div>
  );
};

export default InputSection;
