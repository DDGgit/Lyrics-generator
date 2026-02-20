
import { GoogleGenAI, Type } from "@google/genai";
import { AppConfig, LyricVariant } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';
import { generateId, countLineSyllables } from '../utils/helpers';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const singleVariantSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Creative name for this song variant" },
    metadata: {
      type: Type.OBJECT,
      properties: {
        bpm: { type: Type.STRING },
        key: { type: Type.STRING },
        mood: { type: Type.STRING },
        timeSignature: { type: Type.STRING },
        vocalRange: { type: Type.STRING },
        estimatedDuration: { type: Type.STRING },
        narrativeArc: { type: Type.STRING },
        anchorsUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
        structure: { type: Type.ARRAY, items: { type: Type.STRING } },
        warnings: { type: Type.ARRAY, items: { type: Type.STRING } },
        recommendedInstruments: { type: Type.ARRAY, items: { type: Type.STRING } },
        lyricalDensity: { type: Type.STRING }
      },
      required: ["bpm", "mood", "key"]
    },
    content: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "Must be either 'header' or 'lyric'" },
          text: { type: Type.STRING },
          syllables: { type: Type.INTEGER },
          score: { type: Type.NUMBER },
          explain: { type: Type.STRING },
          flags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["type", "text"]
      }
    }
  },
  required: ["name", "metadata", "content"]
};

const safeParseJSON = (text: string) => {
  if (!text) return null;
  try {
    let cleaned = text.replace(/```(?:json)?|```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("LyricOS JSON Parse Error:", error);
    return null;
  }
};

const generateSingleVariant = async (config: AppConfig, index: number, total: number): Promise<LyricVariant | null> => {
  const topicInstruction = `TOPIC: "${config.topic}". ANCHORS: ${config.anchors.join(', ')}`;
  const chorusInstruction = config.chorusContent 
    ? `CHORUS GUIDE: ${config.chorusLocked ? 'Use exactly' : 'Build upon'}: "${config.chorusContent}"` 
    : '';

  const languagePrompt = config.language === 'Hindi' 
    ? "Language: Hindi (Devanagari/Hinglish as appropriate for style)." 
    : "Language: English.";

  const advancedContext = config.advancedMode 
    ? `Structure: ${config.customStructure.join(' -> ')}. Context: ${config.storyContext}. BPM: ${config.targetBpm}. Rhyme Scheme: ${config.rhymeScheme.join('')}.`
    : "Structure: Dynamic/Emergent based on style.";

  const prompt = `
    TASK: Write a complete song variant (${index + 1}/${total}).
    ${topicInstruction}
    STYLE: ${config.style}
    MATURITY: ${config.maturity}
    ${languagePrompt}
    ${chorusInstruction}
    ${config.aiInstructions ? `INSTRUCTIONS: ${config.aiInstructions}` : ''}
    ${advancedContext}
    
    IMPORTANT: Syllable counts must be accurate. Use 'header' type for section names.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: singleVariantSchema,
        temperature: 0.75,
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });

    const data = safeParseJSON(response.text || "");
    if (!data) return null;

    return {
      id: generateId(),
      name: data.name || `Mix ${index + 1}`,
      metadata: { ...data.metadata, syllablesAvg: 0 },
      lines: data.content.map((item: any) => ({
        id: generateId(),
        text: item.text,
        type: item.type === 'header' ? 'header' : 'lyric',
        originalText: item.text,
        isEdited: false,
        syllables: item.syllables || countLineSyllables(item.text),
        score: item.score || 0.9,
        flags: item.flags || [],
        explain: item.explain || ""
      }))
    };
  } catch (error) {
    console.error("Generation error for variant:", error);
    return null;
  }
};

export const generateLyrics = async (config: AppConfig): Promise<LyricVariant[]> => {
  const tasks = Array.from({ length: config.variantCount }, (_, i) => 
    generateSingleVariant(config, i, config.variantCount)
  );
  
  const variants = await Promise.all(tasks);
  const validVariants = variants.filter((v): v is LyricVariant => v !== null);
  
  if (validVariants.length === 0) {
    throw new Error("Could not generate valid lyrics. Please try a different topic or style.");
  }
  
  return validVariants;
};

export const suggestAlternatives = async (line: string, contextLines: string[], style: string, maturity: string): Promise<string[]> => {
  const prompt = `Provide 3 better alternatives for this lyric line: "${line}". Context: ${contextLines.join(' / ')}. Style: ${style}. Return JSON: { "suggestions": ["line1", "line2", "line3"] }`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } },
          required: ["suggestions"]
        }
      }
    });
    const data = safeParseJSON(response.text || "");
    return data?.suggestions || [];
  } catch (e) { return []; }
};

export const regenerateSingleLine = async (line: string, contextLines: string[], config: AppConfig): Promise<string> => {
  const prompt = `Rewrite this lyric line to be better: "${line}". Context: ${contextLines.join(' / ')}. Style: ${config.style}. JSON: { "newLine": "string" }`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { newLine: { type: Type.STRING } },
          required: ["newLine"]
        }
      }
    });
    const data = safeParseJSON(response.text || "");
    return data?.newLine || line;
  } catch (e) { return line; }
};

export const generateAnchorSuggestions = async (topic: string, language: string): Promise<string[]> => {
  if (!topic) return [];
  const prompt = `Give me 8 anchor words for a song about: "${topic}". Language: ${language}. JSON: { "anchors": [] }`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { anchors: { type: Type.ARRAY, items: { type: Type.STRING } } },
          required: ["anchors"]
        }
      }
    });
    const data = safeParseJSON(response.text || "");
    return data?.anchors || [];
  } catch (e) { return []; }
};
