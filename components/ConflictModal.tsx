
import React from 'react';
import { ConflictWarning } from '../types';
import { AlertTriangle } from 'lucide-react';

interface Props {
  conflicts: ConflictWarning[];
  onContinue: () => void;
  onEdit: () => void;
}

const ConflictModal: React.FC<Props> = ({ conflicts, onContinue, onEdit }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-fade-in">
      <div className="bg-lyric-panel w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-scale-in">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/20 to-transparent p-6 flex items-start gap-4 border-b border-white/10">
           <div className="bg-amber-500 text-black p-3 rounded-xl shrink-0 shadow-lg">
             <AlertTriangle size={24} strokeWidth={2.5} />
           </div>
           <div>
             <h2 className="text-xl font-black text-white uppercase tracking-wide">Conflict</h2>
             <p className="text-sm text-lyric-muted mt-1 font-medium">Logic mismatch detected in settings.</p>
           </div>
        </div>

        {/* List */}
        <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
           {conflicts.map((c) => (
             <div key={c.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex gap-4 items-start hover:border-amber-500/50 transition-colors">
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 shrink-0"></div>
                <div>
                   <h4 className="text-sm font-bold text-amber-400 mb-1">{c.title}</h4>
                   <p className="text-xs text-lyric-muted leading-relaxed font-medium">{c.message}</p>
                </div>
             </div>
           ))}
        </div>

        {/* Footer */}
        <div className="p-6 bg-black/20 border-t border-white/5 flex gap-4">
           <button 
             onClick={onEdit}
             className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-lyric-muted hover:text-white hover:bg-white/10 font-bold text-sm uppercase tracking-wide transition-all"
           >
             Edit
           </button>
           <button 
             onClick={onContinue}
             className="flex-1 py-3 rounded-xl bg-gradient-to-r from-lyric-accent to-lyric-secondary text-white font-bold text-sm uppercase tracking-wide hover:shadow-lg transition-all"
           >
             Ignore
           </button>
        </div>

      </div>
    </div>
  );
};

export default ConflictModal;
