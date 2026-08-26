import { PlayerKeyframe } from 'src/schemes/interfaces';

export interface Waypoint {
  timestamp: number;
  x: number;
  y: number;
  rotation: number;
}

export interface PlayerMovementPlan {
  playerId: string;
  waypoints: Waypoint[];
}

export interface MovementPlan {
  version: string;
  duration: number;
  description: string;
  initialState: PlayerKeyframe[];
  movements: PlayerMovementPlan[];
}

export interface GenerateSchemeDto {
  intent: string;
  durationMs?: number;
  team?: 'A' | 'B';
}

export interface GeneratedSchemeResult {
  recording: {
    version: string;
    duration: number;
    initialState: PlayerKeyframe[];
    keyframes: { timestamp: number; players: PlayerKeyframe[] }[];
  };
  description: string;
  tags: string[];
}
