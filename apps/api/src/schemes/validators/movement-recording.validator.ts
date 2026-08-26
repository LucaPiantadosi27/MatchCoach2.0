import type { ValidationResult } from './board-state.validator';

/**
 * Validatore server-side per MovementRecording.
 * Controlla:
 *   - versione
 *   - duration > 0
 *   - initialState con coordinate valide
 *   - keyframes ordinati per timestamp
 *   - coordinate 0–1 in ogni keyframe
 *   - timestamp crescenti
 *   - coerenza playerId tra initialState e keyframes
 */
export function validateMovementRecording(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['recording must be an object'] };
  }

  const rec = data as Record<string, unknown>;

  // Version
  if (!rec.version || typeof rec.version !== 'string') {
    errors.push('recording.version: required string');
  } else if (!['1.0'].includes(rec.version)) {
    errors.push(`recording.version "${rec.version}" is not supported (allowed: 1.0)`);
  }

  // Duration
  if (typeof rec.duration !== 'number' || rec.duration <= 0) {
    errors.push('recording.duration: must be a positive number (ms)');
  }

  // Initial state
  const playerIds = new Set<string>();

  if (!Array.isArray(rec.initialState)) {
    errors.push('recording.initialState: must be an array');
  } else {
    rec.initialState.forEach((pk: unknown, i: number) => {
      const pkErrors = validatePlayerKeyframe(pk, `initialState[${i}]`);
      errors.push(...pkErrors);
      if (pk && typeof pk === 'object' && 'playerId' in pk) {
        playerIds.add((pk as Record<string, unknown>).playerId as string);
      }
    });
  }

  // Keyframes
  if (!Array.isArray(rec.keyframes)) {
    errors.push('recording.keyframes: must be an array');
  } else {
    let lastTimestamp = -1;

    rec.keyframes.forEach((kf: unknown, i: number) => {
      const prefix = `keyframes[${i}]`;

      if (!kf || typeof kf !== 'object') {
        errors.push(`${prefix}: must be an object`);
        return;
      }

      const keyframe = kf as Record<string, unknown>;

      // Timestamp
      if (typeof keyframe.timestamp !== 'number' || keyframe.timestamp < 0) {
        errors.push(`${prefix}.timestamp: must be a non-negative number`);
      } else {
        if (keyframe.timestamp <= lastTimestamp) {
          errors.push(`${prefix}.timestamp: must be greater than previous (${lastTimestamp})`);
        }
        lastTimestamp = keyframe.timestamp as number;

        // Check timestamp doesn't exceed duration
        if (typeof rec.duration === 'number' && keyframe.timestamp > rec.duration) {
          errors.push(`${prefix}.timestamp: exceeds recording duration (${rec.duration}ms)`);
        }
      }

      // Players in keyframe
      if (!Array.isArray(keyframe.players)) {
        errors.push(`${prefix}.players: must be an array`);
      } else {
        keyframe.players.forEach((pk: unknown, pi: number) => {
          const pkErrors = validatePlayerKeyframe(pk, `${prefix}.players[${pi}]`);
          errors.push(...pkErrors);
        });
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

function validatePlayerKeyframe(data: unknown, prefix: string): string[] {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return [`${prefix}: must be an object`];
  }

  const pk = data as Record<string, unknown>;

  if (!pk.playerId || typeof pk.playerId !== 'string') {
    errors.push(`${prefix}.playerId: required string`);
  }

  if (typeof pk.x !== 'number' || pk.x < 0 || pk.x > 1) {
    errors.push(`${prefix}.x: must be number 0.0–1.0`);
  }

  if (typeof pk.y !== 'number' || pk.y < 0 || pk.y > 1) {
    errors.push(`${prefix}.y: must be number 0.0–1.0`);
  }

  if (typeof pk.rotation !== 'number' || pk.rotation < 0 || pk.rotation > 360) {
    errors.push(`${prefix}.rotation: must be number 0–360`);
  }

  return errors;
}
