import { BoardState, MovementRecording } from 'src/schemes/interfaces';

export interface PlayerMovementMetrics {
  playerId: string;
  team?: string;
  number?: number;
  totalDistanceMeters: number;
  averageSpeedMetersPerSecond: number;
  maxSpeedMetersPerSecond: number;
  displacementMeters: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  timeInZones: {
    attackMs: number;
    midfieldMs: number;
    defenseMs: number;
    attackPct: number;
    midfieldPct: number;
    defensePct: number;
  };
}

export interface TeamMovementMetrics {
  team: string;
  averagePlayerDistanceMeters: number;
  averageSpreadMeters: number;
  centroidX: number;
  centroidY: number;
  symmetryScore: number; // 0..1, 1 = perfectly symmetric
}

export interface MovementAnalysisReport {
  version: string;
  durationMs: number;
  fieldWidthMeters: number;
  fieldHeightMeters: number;
  playerMetrics: PlayerMovementMetrics[];
  teamMetrics: TeamMovementMetrics[];
  summary: {
    totalDistanceMeters: number;
    highestAverageSpeedMetersPerSecond: number;
    mostActivePlayerId: string | null;
  };
}

export interface MovementAnalysisInput {
  board: BoardState;
  recording: MovementRecording;
}
