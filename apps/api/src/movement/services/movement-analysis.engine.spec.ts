import { MovementAnalysisEngine } from './movement-analysis.engine';
import { BoardState, MovementRecording, Keyframe } from 'src/schemes/interfaces';

describe('MovementAnalysisEngine', () => {
  const engine = new MovementAnalysisEngine();

  const board: BoardState = {
    version: '2.0',
    players: [
      { id: 'p1', team: 'A', number: 1, x: 0.5, y: 0.5, rotation: 0 },
      { id: 'p2', team: 'A', number: 2, x: 0.3, y: 0.7, rotation: 0 },
    ],
    paths: [],
  };

  it('returns an empty report for an empty recording', () => {
    const result = engine.analyze({
      board,
      recording: {
        version: '1.0',
        duration: 0,
        initialState: [],
        keyframes: [],
      },
    });

    expect(result.durationMs).toBe(0);
    expect(result.playerMetrics).toEqual([]);
    expect(result.summary.totalDistanceMeters).toBe(0);
  });

  it('computes distance, speed and displacement', () => {
    const recording: MovementRecording = {
      version: '1.0',
      duration: 2000,
      initialState: [
        { playerId: 'p1', x: 0.5, y: 0.5, rotation: 0 },
      ],
      keyframes: [
        {
          timestamp: 2000,
          players: [{ playerId: 'p1', x: 0.5, y: 0.7, rotation: 90 }],
        } as Keyframe,
      ],
    };

    const result = engine.analyze({ board, recording });
    const p1 = result.playerMetrics.find((p) => p.playerId === 'p1');

    expect(p1).toBeDefined();
    expect(p1!.totalDistanceMeters).toBeGreaterThan(0);
    expect(p1!.displacementMeters).toBeGreaterThan(0);
    expect(p1!.averageSpeedMetersPerSecond).toBeGreaterThan(0);
    expect(p1!.timeInZones.attackMs).toBeGreaterThan(0);
    expect(p1!.timeInZones.midfieldMs).toBe(0);
    expect(p1!.timeInZones.defenseMs).toBe(0);
  });

  it('calculates team metrics', () => {
    const recording: MovementRecording = {
      version: '1.0',
      duration: 1000,
      initialState: [
        { playerId: 'p1', x: 0.4, y: 0.5, rotation: 0 },
        { playerId: 'p2', x: 0.6, y: 0.5, rotation: 0 },
      ],
      keyframes: [
        {
          timestamp: 1000,
          players: [
            { playerId: 'p1', x: 0.4, y: 0.5, rotation: 0 },
            { playerId: 'p2', x: 0.6, y: 0.5, rotation: 0 },
          ],
        } as Keyframe,
      ],
    };

    const result = engine.analyze({ board, recording });
    const teamA = result.teamMetrics.find((t) => t.team === 'A');

    expect(teamA).toBeDefined();
    expect(teamA!.averagePlayerDistanceMeters).toBeGreaterThan(0);
    expect(teamA!.symmetryScore).toBeGreaterThan(0);
  });
});
