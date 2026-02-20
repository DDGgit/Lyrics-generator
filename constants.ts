
import { MusicStyle } from './types';

export const MUSIC_STYLES: MusicStyle[] = [
  'Pop', 'Rap', 'RnB', 'Rock', 'EDM', 
  'Indie', 'Lo-fi', 'Romantic', 'Sensual', 'Devotional'
];

export const STYLE_EXAMPLES: Record<MusicStyle, string[]> = {
  'Pop': ['Party', 'Banger', 'Vibe'],
  'Rap': ['Flow', 'Bars', 'Hype'],
  'RnB': ['Love', 'Soft', 'Soul'],
  'Rock': ['Driving', 'Anthem', 'Gritty'],
  'EDM': ['Club', 'Energy', 'Drop'],
  'Indie': ['Acoustic', 'Folk', 'Raw'],
  'Lo-fi': ['Chill', 'Study', 'Sleep'],
  'Romantic': ['Ballad', 'Heartfelt', 'Slow'],
  'Sensual': ['Intimate', 'Passion', 'Mood'],
  'Devotional': ['Spiritual', 'Prayer', 'Chant']
};

export const AVAILABLE_SECTIONS = [
  'Intro', 'Verse', 'Pre-Chorus', 'Chorus', 
  'Post-Chorus', 'Bridge', 'Hook', 'Drop', 
  'Solo', 'Outro', 'Refrain', 'Breakdown'
];

export const SYSTEM_INSTRUCTION = `
You are LyricOS, a world-class songwriting engine. Your task is to generate high-quality, singable, and emotionally resonant lyrics based on user constraints.

CORE RULES:
1. THEMATIC ADHERENCE: Every line must orbit the provided Topic and use requested Anchor words naturally.
2. STRUCTURE: Unless specified, create a dynamic structure (e.g., V1, Chorus, V2, Chorus, Bridge, Chorus, Outro).
3. STYLE: Match the tone of the requested genre (e.g., Rap needs internal rhymes and flow; Indie needs raw, poetic imagery).
4. MATURITY: Strictly follow SFW/Mature/Explicit settings. Devotional is always SFW.
5. SYLLABLE CONTROL: Maintain consistent syllable counts within sections to ensure the song is singable.

TECHNICAL OUTPUT:
- You must return valid JSON matching the requested schema.
- For each line, calculate the exact syllable count.
- Use 'header' type for section labels (e.g., [Chorus]) and 'lyric' for actual lines.
- Each variant must be distinct in mood or perspective.
`;
