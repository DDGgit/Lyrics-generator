
export type MaturityLevel = 'SFW' | 'Mature' | 'Explicit';

export type MusicStyle = 
  | 'Devotional' 
  | 'Romantic' 
  | 'Pop' 
  | 'Indie' 
  | 'Lo-fi' 
  | 'Rap' 
  | 'EDM' 
  | 'RnB' 
  | 'Rock' 
  | 'Sensual';

export type Language = 'English' | 'Hindi';

export type SyllableTightness = 'Auto' | 'Loose' | 'Medium' | 'Tight';
export type MeterConsistency = 'Auto' | 'Free' | 'Mostly consistent' | 'Strict';
export type RhymePlacement = 'End' | 'Internal' | 'Mixed';
export type BreathSensitivity = 'Auto' | 'Conservative' | 'Aggressive';

export interface AppConfig {
  topic: string;
  topicLocked: boolean;
  anchors: string[];
  chorusContent: string;
  chorusLocked: boolean;
  style: MusicStyle;
  durationMinutes: number;
  rhymeRequired: boolean;
  variantCount: number;
  maturity: MaturityLevel;
  language: Language;
  
  // New Guidance
  aiInstructions: string;

  // Advanced Options
  advancedMode: boolean;
  rhymeScheme: string[]; // e.g. ['A', 'A', 'B', 'B']
  customStructure: string[]; // e.g. ['Intro', 'Verse', 'Chorus']
  storyContext: string;
  customStyleDescription: string; // User defined style overrides
  targetBpm: string;

  // Technical Controls
  syllableTightness: SyllableTightness;
  meterConsistency: MeterConsistency;
  rhymePlacement: RhymePlacement;
  breathSensitivity: BreathSensitivity;
}

export interface LyricLineData {
  id: string;
  text: string;
  type: 'header' | 'lyric';
  originalText?: string;
  isEdited?: boolean;
  // Syllable-Word Logic Metadata (Simplified for initial generation)
  syllables?: number;
  tokens?: string[];
  breathMarks?: number[];
  endPhoneme?: string;
  score?: number;
  flags?: string[];
  explain?: string;
}

export interface VariantMetadata {
  syllablesAvg: number;
  anchorsUsed: string[];
  bpm: string;
  key: string;
  mood: string;
  timeSignature?: string;
  vocalRange?: string;
  estimatedDuration?: string;
  narrativeArc?: string;
  warnings?: string[];
  structure?: string[];
  recommendedInstruments?: string[];
  lyricalDensity?: string;
}

export interface LyricVariant {
  id: string;
  name: string;
  lines: LyricLineData[];
  metadata: VariantMetadata;
}

export interface SuggestionResult {
  suggestions: string[];
}

export interface ConflictWarning {
  id: string;
  title: string;
  message: string;
}
