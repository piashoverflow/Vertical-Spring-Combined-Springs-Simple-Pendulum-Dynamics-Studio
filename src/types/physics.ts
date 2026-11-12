export type Language = 'bn' | 'en';

export type ModuleId = 'vertical' | 'combined' | 'pendulum';

export type CombinedMode = 'series' | 'parallel' | 'opposing' | 'cutter';

export interface GravityPreset {
  id: 'moon' | 'mars' | 'earth' | 'jupiter';
  g: number;
  labelBn: string;
  labelEn: string;
}

export const GRAVITY_PRESETS: GravityPreset[] = [
  { id: 'moon', g: 1.62, labelBn: 'চাঁদ (1.62)', labelEn: 'Moon (1.62)' },
  { id: 'mars', g: 3.72, labelBn: 'মঙ্গল (3.72)', labelEn: 'Mars (3.72)' },
  { id: 'earth', g: 9.8, labelBn: 'পৃথিবী (9.80)', labelEn: 'Earth (9.80)' },
  { id: 'jupiter', g: 24.79, labelBn: 'বৃহস্পতি (24.79)', labelEn: 'Jupiter (24.79)' },
];
