import type { BoardState, PlayerState, DrawingPath } from '../interfaces';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validatore server-side per BoardState.
 * Controlla:
 *   - coordinate 0–1
 *   - team validi (A/B)
 *   - numero giocatore (1–99)
 *   - rotation 0–360
 *   - struttura JSON
 *   - versione del contratto
 */
export function validateBoardState(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['boardState must be an object'] };
  }

  const bs = data as Record<string, unknown>;

  // Version check
  if (!bs.version || typeof bs.version !== 'string') {
    errors.push('boardState.version is required and must be a string');
  } else if (!['1.0', '2.0'].includes(bs.version)) {
    errors.push(`boardState.version "${bs.version}" is not supported (allowed: 1.0, 2.0)`);
  }

  // Players
  if (!Array.isArray(bs.players)) {
    errors.push('boardState.players must be an array');
  } else {
    bs.players.forEach((player: unknown, i: number) => {
      const playerErrors = validatePlayer(player, i);
      errors.push(...playerErrors);
    });
  }

  // Paths (optional)
  if (bs.paths !== undefined) {
    if (!Array.isArray(bs.paths)) {
      errors.push('boardState.paths must be an array');
    } else {
      bs.paths.forEach((path: unknown, i: number) => {
        const pathErrors = validatePath(path, i);
        errors.push(...pathErrors);
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

function validatePlayer(data: unknown, index: number): string[] {
  const errors: string[] = [];
  const prefix = `players[${index}]`;

  if (!data || typeof data !== 'object') {
    return [`${prefix}: must be an object`];
  }

  const p = data as Record<string, unknown>;

  // id
  if (!p.id || typeof p.id !== 'string') {
    errors.push(`${prefix}.id: required string`);
  }

  // team
  if (!p.team || !['A', 'B'].includes(p.team as string)) {
    errors.push(`${prefix}.team: must be "A" or "B"`);
  }

  // number
  if (typeof p.number !== 'number' || !Number.isInteger(p.number) || p.number < 1 || p.number > 99) {
    errors.push(`${prefix}.number: must be integer 1–99`);
  }

  // x coordinate
  if (typeof p.x !== 'number' || p.x < 0 || p.x > 1) {
    errors.push(`${prefix}.x: must be number 0.0–1.0`);
  }

  // y coordinate
  if (typeof p.y !== 'number' || p.y < 0 || p.y > 1) {
    errors.push(`${prefix}.y: must be number 0.0–1.0`);
  }

  // rotation
  if (typeof p.rotation !== 'number' || p.rotation < 0 || p.rotation > 360) {
    errors.push(`${prefix}.rotation: must be number 0–360`);
  }

  return errors;
}

function validatePath(data: unknown, index: number): string[] {
  const errors: string[] = [];
  const prefix = `paths[${index}]`;

  if (!data || typeof data !== 'object') {
    return [`${prefix}: must be an object`];
  }

  const path = data as Record<string, unknown>;

  // id
  if (!path.id || typeof path.id !== 'string') {
    errors.push(`${prefix}.id: required string`);
  }

  // type
  if (!path.type || !['line', 'arrow', 'freehand'].includes(path.type as string)) {
    errors.push(`${prefix}.type: must be "line", "arrow", or "freehand"`);
  }

  // points
  if (!Array.isArray(path.points)) {
    errors.push(`${prefix}.points: must be an array`);
  } else {
    path.points.forEach((point: unknown, pi: number) => {
      if (!point || typeof point !== 'object') {
        errors.push(`${prefix}.points[${pi}]: must be an object`);
        return;
      }
      const pt = point as Record<string, unknown>;
      if (typeof pt.x !== 'number' || pt.x < 0 || pt.x > 1) {
        errors.push(`${prefix}.points[${pi}].x: must be number 0.0–1.0`);
      }
      if (typeof pt.y !== 'number' || pt.y < 0 || pt.y > 1) {
        errors.push(`${prefix}.points[${pi}].y: must be number 0.0–1.0`);
      }
    });
  }

  return errors;
}
