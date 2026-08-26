import { validateMovementRecording } from './movement-recording.validator';

describe('validateMovementRecording', () => {
  const validRecording = {
    version: '1.0',
    duration: 5000,
    initialState: [
      { playerId: 'p1', x: 0.2, y: 0.5, rotation: 0 },
      { playerId: 'p2', x: 0.8, y: 0.5, rotation: 180 },
    ],
    keyframes: [
      {
        timestamp: 1000,
        players: [
          { playerId: 'p1', x: 0.4, y: 0.6, rotation: 45 },
          { playerId: 'p2', x: 0.6, y: 0.4, rotation: 200 },
        ],
      },
      {
        timestamp: 3000,
        players: [
          { playerId: 'p1', x: 0.7, y: 0.3, rotation: 90 },
          { playerId: 'p2', x: 0.3, y: 0.7, rotation: 270 },
        ],
      },
    ],
  };

  it('should pass for valid recording', () => {
    const result = validateMovementRecording(validRecording);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail for null input', () => {
    const result = validateMovementRecording(null);
    expect(result.valid).toBe(false);
  });

  it('should fail for invalid version', () => {
    const result = validateMovementRecording({ ...validRecording, version: '2.0' });
    expect(result.valid).toBe(false);
  });

  it('should fail for zero duration', () => {
    const result = validateMovementRecording({ ...validRecording, duration: 0 });
    expect(result.valid).toBe(false);
  });

  it('should fail for negative duration', () => {
    const result = validateMovementRecording({ ...validRecording, duration: -100 });
    expect(result.valid).toBe(false);
  });

  it('should fail for non-increasing timestamps', () => {
    const result = validateMovementRecording({
      ...validRecording,
      keyframes: [
        { timestamp: 2000, players: [{ playerId: 'p1', x: 0.5, y: 0.5, rotation: 0 }] },
        { timestamp: 1000, players: [{ playerId: 'p1', x: 0.6, y: 0.6, rotation: 0 }] },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('greater than previous'))).toBe(true);
  });

  it('should fail for timestamp exceeding duration', () => {
    const result = validateMovementRecording({
      ...validRecording,
      duration: 2000,
      keyframes: [
        { timestamp: 3000, players: [{ playerId: 'p1', x: 0.5, y: 0.5, rotation: 0 }] },
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('exceeds'))).toBe(true);
  });

  it('should fail for coordinates out of range in keyframe', () => {
    const result = validateMovementRecording({
      ...validRecording,
      keyframes: [
        { timestamp: 1000, players: [{ playerId: 'p1', x: 1.5, y: 0.5, rotation: 0 }] },
      ],
    });
    expect(result.valid).toBe(false);
  });

  it('should fail for invalid rotation in initialState', () => {
    const result = validateMovementRecording({
      ...validRecording,
      initialState: [{ playerId: 'p1', x: 0.5, y: 0.5, rotation: 400 }],
    });
    expect(result.valid).toBe(false);
  });
});
