import { validateBoardState } from './board-state.validator';

describe('validateBoardState', () => {
  const validBoardState = {
    version: '2.0',
    players: [
      { id: 'p1', team: 'A', number: 1, x: 0.5, y: 0.5, rotation: 0 },
      { id: 'p2', team: 'B', number: 7, x: 0.3, y: 0.8, rotation: 90 },
    ],
    paths: [],
  };

  it('should pass for valid boardState', () => {
    const result = validateBoardState(validBoardState);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail for null input', () => {
    const result = validateBoardState(null);
    expect(result.valid).toBe(false);
  });

  it('should fail for missing version', () => {
    const { version, ...noVersion } = validBoardState;
    const result = validateBoardState(noVersion);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('version'))).toBe(true);
  });

  it('should fail for invalid version', () => {
    const result = validateBoardState({ ...validBoardState, version: '99.0' });
    expect(result.valid).toBe(false);
  });

  it('should fail for player with x > 1', () => {
    const result = validateBoardState({
      ...validBoardState,
      players: [{ id: 'p1', team: 'A', number: 1, x: 1.5, y: 0.5, rotation: 0 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('x'))).toBe(true);
  });

  it('should fail for player with y < 0', () => {
    const result = validateBoardState({
      ...validBoardState,
      players: [{ id: 'p1', team: 'A', number: 1, x: 0.5, y: -0.1, rotation: 0 }],
    });
    expect(result.valid).toBe(false);
  });

  it('should fail for invalid team', () => {
    const result = validateBoardState({
      ...validBoardState,
      players: [{ id: 'p1', team: 'C', number: 1, x: 0.5, y: 0.5, rotation: 0 }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('team'))).toBe(true);
  });

  it('should fail for player number > 99', () => {
    const result = validateBoardState({
      ...validBoardState,
      players: [{ id: 'p1', team: 'A', number: 100, x: 0.5, y: 0.5, rotation: 0 }],
    });
    expect(result.valid).toBe(false);
  });

  it('should fail for rotation > 360', () => {
    const result = validateBoardState({
      ...validBoardState,
      players: [{ id: 'p1', team: 'A', number: 1, x: 0.5, y: 0.5, rotation: 400 }],
    });
    expect(result.valid).toBe(false);
  });

  it('should validate paths with invalid point coordinates', () => {
    const result = validateBoardState({
      ...validBoardState,
      paths: [{ id: 'path1', type: 'arrow', points: [{ x: 2.0, y: 0.5 }] }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('points'))).toBe(true);
  });

  it('should accept valid paths', () => {
    const result = validateBoardState({
      ...validBoardState,
      paths: [{ id: 'path1', type: 'arrow', points: [{ x: 0.2, y: 0.3 }, { x: 0.8, y: 0.7 }] }],
    });
    expect(result.valid).toBe(true);
  });
});
