
import { LyricVariant, AppConfig } from '../types';

// Robust internal UUID generator to remove external dependency
export const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Regex for Devanagari script detection (Hindi)
const DEVANAGARI_REGEX = /[\u0900-\u097F]/;

// Helper to count Hindi Aksharas (Orthographic Syllables)
const countHindiSyllables = (word: string): number => {
  let count = 0;
  const chars = Array.from(word); // Handle unicode characters properly

  // Devanagari Unicode Ranges
  const isIndepVowel = (c: string) => /[\u0904-\u0914\u0960-\u0961\u0972-\u0977]/.test(c);
  const isConsonant = (c: string) => /[\u0915-\u0939\u0958-\u095F\u0979-\u097F]/.test(c);
  const isVirama = (c: string) => c === '\u094D';

  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const nextChar = chars[i + 1];

    if (isIndepVowel(char)) {
      count++;
    } else if (isConsonant(char)) {
      // If a consonant is followed by a Virama (Halant), it is part of a conjunct cluster 
      // (half-character) and does NOT form a syllable nucleus itself.
      if (nextChar && isVirama(nextChar)) {
        continue;
      }
      // Otherwise, the consonant forms a syllable (either with inherent 'a' or an attached Matra)
      count++;
    }
  }

  // Fallback: if script was detected but logic found 0 (e.g. only modifiers), return 0 or 1 based on length
  return count;
};

export const countSyllables = (word: string): number => {
  // 1. Check for Hindi/Devanagari script first
  if (DEVANAGARI_REGEX.test(word)) {
    return countHindiSyllables(word);
  }

  // 2. English Logic
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 0) return 0;
  if (word.length <= 3) return 1;

  // Specific common exceptions
  if (["every", "different", "family", "interest"].includes(word)) return 2; // naive exception list

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  // Diphthong handling (simplified)
  const match = word.match(/[aeiouy]{1,2}/g);
  return match ? match.length : 1;
};

export const countLineSyllables = (line: string): number => {
  // Remove content in brackets like [Chorus] for counting
  const cleanLine = line.replace(/\[.*?\]/g, '').trim();
  if (!cleanLine) return 0;
  
  const words = cleanLine.split(/\s+/);
  return words.reduce((acc, word) => acc + countSyllables(word), 0);
};

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy: ', err);
    return false;
  }
};

export const downloadHtmlExport = (variant: LyricVariant, config: AppConfig) => {
  const lyricsHtml = variant.lines.map(line => {
    if (line.type === 'header') {
      return `<div class="header">${line.text}</div>`;
    }
    return `<div class="line">${line.text}</div>`;
  }).join('');

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.topic} - LyricOS Export</title>
    <style>
        body {
            background-color: #0f172a;
            color: #f8fafc;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
        }
        .container {
            background-color: #1e293b;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            border: 1px solid #334155;
        }
        h1 {
            color: #7c3aed;
            margin-bottom: 5px;
            font-size: 28px;
            border-bottom: 1px solid #334155;
            padding-bottom: 20px;
        }
        .meta-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
            background: #0f172a;
            padding: 20px;
            border-radius: 12px;
        }
        .meta-item {
            display: flex;
            flex-direction: column;
        }
        .meta-label {
            font-size: 10px;
            text-transform: uppercase;
            color: #94a3b8;
            font-weight: bold;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }
        .meta-value {
            font-size: 16px;
            font-weight: 600;
            color: #e2e8f0;
        }
        .lyrics-section {
            margin-top: 30px;
        }
        .header {
            margin-top: 25px;
            margin-bottom: 10px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            color: #60a5fa;
            background: rgba(96, 165, 250, 0.1);
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
        }
        .line {
            font-size: 18px;
            margin-bottom: 8px;
            padding-left: 10px;
            border-left: 2px solid rgba(255,255,255,0.05);
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${config.topic || 'Untitled Song'}</h1>
        
        <div class="meta-grid">
            <div class="meta-item">
                <span class="meta-label">BPM</span>
                <span class="meta-value">${variant.metadata.bpm || '—'}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Key</span>
                <span class="meta-value">${variant.metadata.key || '—'}</span>
            </div>
             <div class="meta-item">
                <span class="meta-label">Time Signature</span>
                <span class="meta-value">${variant.metadata.timeSignature || '4/4'}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Mood</span>
                <span class="meta-value">${variant.metadata.mood || '—'}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Style</span>
                <span class="meta-value">${config.style}</span>
            </div>
            <div class="meta-item">
                <span class="meta-label">Variant</span>
                <span class="meta-value">${variant.name}</span>
            </div>
        </div>

        <div class="lyrics-section">
            ${lyricsHtml}
        </div>

        <div class="footer">
            Generated with LyricOS
        </div>
    </div>
</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = (config.topic || 'lyrics').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  a.download = `${safeName}_${variant.name.replace(/\s/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
