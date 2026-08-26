/**
 * BoardState v2.0
 *
 * Contratto comune per la rappresentazione dello stato della lavagna tattica.
 * Usato da:
 *   - Schemi creati manualmente
 *   - Schemi registrati (keyframe)
 *   - Schemi generati da Gemini
 *
 * Coordinate normalizzate 0.0–1.0 (indipendenti dalla risoluzione).
 */

export interface PlayerState {
  id: string;
  team: 'A' | 'B';
  number: number;
  x: number;       // 0.0 – 1.0
  y: number;       // 0.0 – 1.0
  rotation: number; // 0 – 360
  label?: string;
}

export interface DrawingPath {
  id: string;
  type: 'line' | 'arrow' | 'freehand';
  points: Array<{ x: number; y: number }>;
  color?: string;
  strokeWidth?: number;
}

export interface BoardState {
  version: string;  // "2.0"
  players: PlayerState[];
  paths: DrawingPath[];
  meta?: BoardStateMeta;
}

export interface BoardStateMeta {
  fieldType?: 'futsal' | 'football';
  orientation?: 'horizontal' | 'vertical';
  notes?: string;
  [key: string]: unknown;
}
