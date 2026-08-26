import {
  BoardState,
  MovementRecording,
  PlayerKeyframe,
  Keyframe,
} from 'src/schemes/interfaces';
import {
  MovementAnalysisInput,
  MovementAnalysisReport,
  PlayerMovementMetrics,
  TeamMovementMetrics,
} from '../interfaces';

const FIELD_WIDTH_METERS = 20;
const FIELD_HEIGHT_METERS = 40;

type TrackPoint = PlayerKeyframe & { timestamp: number };

export class MovementAnalysisEngine {
  analyze(input: MovementAnalysisInput): MovementAnalysisReport {
    const { board, recording } = input;

    if (!recording?.keyframes?.length && !recording?.initialState?.length) {
      return this.emptyReport(recording?.duration ?? 0);
    }

    const duration = recording.duration || this.deriveDuration(recording);
    const playerIds = this.extractPlayerIds(recording);
    const timeline = this.buildTimeline(recording, duration, playerIds);

    const playerMetrics = playerIds.map((id) =>
      this.analyzePlayer(id, board, timeline.get(id) ?? [], duration),
    );

    const teamMetrics = ['A', 'B'].map((team) =>
      this.analyzeTeam(team, playerMetrics),
    );

    const totalDistance = playerMetrics.reduce(
      (sum, p) => sum + p.totalDistanceMeters,
      0,
    );

    const mostActive = playerMetrics.length
      ? playerMetrics.reduce((max, p) =>
          p.totalDistanceMeters > max.totalDistanceMeters ? p : max,
        )
      : null;

    return {
      version: '1.0',
      durationMs: duration,
      fieldWidthMeters: FIELD_WIDTH_METERS,
      fieldHeightMeters: FIELD_HEIGHT_METERS,
      playerMetrics,
      teamMetrics,
      summary: {
        totalDistanceMeters: Math.round(totalDistance * 1000) / 1000,
        highestAverageSpeedMetersPerSecond: mostActive
          ? Math.round(mostActive.averageSpeedMetersPerSecond * 1000) / 1000
          : 0,
        mostActivePlayerId: mostActive ? mostActive.playerId : null,
      },
    };
  }

  private emptyReport(duration: number): MovementAnalysisReport {
    return {
      version: '1.0',
      durationMs: duration,
      fieldWidthMeters: FIELD_WIDTH_METERS,
      fieldHeightMeters: FIELD_HEIGHT_METERS,
      playerMetrics: [],
      teamMetrics: [],
      summary: {
        totalDistanceMeters: 0,
        highestAverageSpeedMetersPerSecond: 0,
        mostActivePlayerId: null,
      },
    };
  }

  private deriveDuration(recording: MovementRecording): number {
    const maxTs = Math.max(
      ...recording.keyframes.map((k) => k.timestamp),
      0,
    );
    return recording.duration || maxTs;
  }

  private extractPlayerIds(recording: MovementRecording): string[] {
    const ids = new Set<string>();
    recording.initialState.forEach((p) => ids.add(p.playerId));
    recording.keyframes.forEach((k) =>
      k.players.forEach((p) => ids.add(p.playerId)),
    );
    return Array.from(ids);
  }

  private buildTimeline(
    recording: MovementRecording,
    duration: number,
    playerIds: string[],
  ): Map<string, TrackPoint[]> {
    const timeline = new Map<string, TrackPoint[]>();

    playerIds.forEach((id) => timeline.set(id, []));

    recording.initialState.forEach((p) => {
      timeline.get(p.playerId)?.push({ ...p, timestamp: 0 });
    });

    recording.keyframes.forEach((k) => {
      k.players.forEach((p) => {
        timeline.get(p.playerId)?.push({ ...p, timestamp: k.timestamp });
      });
    });

    playerIds.forEach((id) => {
      const track = timeline.get(id) ?? [];
      track.sort((a, b) => a.timestamp - b.timestamp);
      const last = track[track.length - 1];
      if (last.timestamp < duration) {
        track.push({ ...last, timestamp: duration });
      }
      timeline.set(id, track);
    });

    return timeline;
  }

  private analyzePlayer(
    playerId: string,
    board: BoardState,
    track: TrackPoint[],
    duration: number,
  ): PlayerMovementMetrics {
    const player = board.players.find((p) => p.id === playerId);

    let totalDistance = 0;
    let maxSpeed = 0;
    let attackMs = 0;
    let midfieldMs = 0;
    let defenseMs = 0;

    for (let i = 0; i < track.length - 1; i++) {
      const a = track[i];
      const b = track[i + 1];
      const dtSeconds = (b.timestamp - a.timestamp) / 1000;

      const distance = this.euclideanMeters(a, b);
      totalDistance += distance;

      const speed = dtSeconds > 0 ? distance / dtSeconds : 0;
      if (speed > maxSpeed) maxSpeed = speed;

      const timeSpent = b.timestamp - a.timestamp;
      const zone = this.zoneFor(b.y);
      if (zone === 'attack') attackMs += timeSpent;
      else if (zone === 'midfield') midfieldMs += timeSpent;
      else defenseMs += timeSpent;
    }

    const start = track[0];
    const end = track[track.length - 1];
    const displacement = this.euclideanMeters(start, end);

    const avgSpeed = duration > 0 ? totalDistance / (duration / 1000) : 0;

    const totalZoneMs = attackMs + midfieldMs + defenseMs || 1;

    return {
      playerId,
      team: player?.team,
      number: player?.number,
      totalDistanceMeters: Math.round(totalDistance * 1000) / 1000,
      averageSpeedMetersPerSecond: Math.round(avgSpeed * 1000) / 1000,
      maxSpeedMetersPerSecond: Math.round(maxSpeed * 1000) / 1000,
      displacementMeters: Math.round(displacement * 1000) / 1000,
      startX: start.x,
      startY: start.y,
      endX: end.x,
      endY: end.y,
      timeInZones: {
        attackMs,
        midfieldMs,
        defenseMs,
        attackPct: Math.round((attackMs / totalZoneMs) * 1000) / 1000,
        midfieldPct: Math.round((midfieldMs / totalZoneMs) * 1000) / 1000,
        defensePct: Math.round((defenseMs / totalZoneMs) * 1000) / 1000,
      },
    };
  }

  private analyzeTeam(
    team: string,
    playerMetrics: PlayerMovementMetrics[],
  ): TeamMovementMetrics {
    const teamPlayers = playerMetrics.filter((p) => p.team === team);
    if (!teamPlayers.length) {
      return {
        team,
        averagePlayerDistanceMeters: 0,
        averageSpreadMeters: 0,
        centroidX: 0.5,
        centroidY: 0.5,
        symmetryScore: 1,
      };
    }

    const xs = teamPlayers.map((p) => p.endX);
    const ys = teamPlayers.map((p) => p.endY);
    const centroidX = xs.reduce((a, b) => a + b, 0) / xs.length;
    const centroidY = ys.reduce((a, b) => a + b, 0) / ys.length;

    const centroidXMet = this.toMetersX(centroidX);
    const centroidYMet = this.toMetersY(centroidY);

    let pairCount = 0;
    let pairSum = 0;
    for (let i = 0; i < teamPlayers.length; i++) {
      for (let j = i + 1; j < teamPlayers.length; j++) {
        const a = teamPlayers[i];
        const b = teamPlayers[j];
        const dx = this.toMetersX(a.endX) - this.toMetersX(b.endX);
        const dy = this.toMetersY(a.endY) - this.toMetersY(b.endY);
        pairSum += Math.sqrt(dx * dx + dy * dy);
        pairCount++;
      }
    }

    const avgDistance = pairCount ? pairSum / pairCount : 0;

    const spread =
      teamPlayers.reduce((sum, p) => {
        const dx = this.toMetersX(p.endX) - centroidXMet;
        const dy = this.toMetersY(p.endY) - centroidYMet;
        return sum + Math.sqrt(dx * dx + dy * dy);
      }, 0) / teamPlayers.length;

    const leftCount = teamPlayers.filter((p) => p.endX < 0.5).length;
    const rightCount = teamPlayers.filter((p) => p.endX > 0.5).length;
    const total = teamPlayers.length;
    const symmetry = 1 - Math.abs(leftCount - rightCount) / total;

    return {
      team,
      averagePlayerDistanceMeters: Math.round(avgDistance * 1000) / 1000,
      averageSpreadMeters: Math.round(spread * 1000) / 1000,
      centroidX: Math.round(centroidX * 1000) / 1000,
      centroidY: Math.round(centroidY * 1000) / 1000,
      symmetryScore: Math.round(symmetry * 1000) / 1000,
    };
  }

  private euclideanMeters(a: TrackPoint, b: TrackPoint): number {
    const dx = this.toMetersX(b.x) - this.toMetersX(a.x);
    const dy = this.toMetersY(b.y) - this.toMetersY(a.y);
    return Math.sqrt(dx * dx + dy * dy);
  }

  private toMetersX(nx: number): number {
    return nx * FIELD_WIDTH_METERS;
  }

  private toMetersY(ny: number): number {
    return ny * FIELD_HEIGHT_METERS;
  }

  private zoneFor(ny: number): 'attack' | 'midfield' | 'defense' {
    if (ny > 0.66) return 'attack';
    if (ny < 0.33) return 'defense';
    return 'midfield';
  }
}
