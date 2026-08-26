/**
 * MovementRecording v1.0
 *
 * Contratto per la registrazione dei movimenti dei giocatori sulla lavagna.
 * Registra keyframe con timestamp — l'interpolazione avviene lato client.
 *
 * Usato da:
 *   - Registrazione manuale del coach
 *   - Generazione AI (Gemini → MovementPlan → MovementRecording)
 *   - Playback generico (indipendente dall'origine)
 */

export interface PlayerKeyframe {
  playerId: string;
  x: number;       // 0.0 – 1.0
  y: number;       // 0.0 – 1.0
  rotation: number; // 0 – 360
}

export interface Keyframe {
  timestamp: number; // millisecondi dall'inizio
  players: PlayerKeyframe[];
}

export interface MovementRecording {
  version: string;       // "1.0"
  duration: number;      // durata totale in ms
  initialState: PlayerKeyframe[];
  keyframes: Keyframe[];
}
