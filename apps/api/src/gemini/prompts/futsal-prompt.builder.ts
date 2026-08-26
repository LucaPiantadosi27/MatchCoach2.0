import { MovementAnalysisReport } from 'src/movement/interfaces';

export class FutsalPromptBuilder {
  static build(report: MovementAnalysisReport): string {
    const playerLines = report.playerMetrics
      .map(
        (p) =>
          `- ${p.playerId} (team ${p.team}, #${p.number}): distanza ${p.totalDistanceMeters}m, ` +
          `velocità media ${p.averageSpeedMetersPerSecond}m/s, ` +
          `max ${p.maxSpeedMetersPerSecond}m/s, spostamento ${p.displacementMeters}m. ` +
          `Tempo in zona: attacco ${p.timeInZones.attackPct * 100}%, ` +
          `centrocampo ${p.timeInZones.midfieldPct * 100}%, difesa ${p.timeInZones.defensePct * 100}%`,
      )
      .join('\n');

    const teamLines = report.teamMetrics
      .map(
        (t) =>
          `- Squadra ${t.team}: distanza media tra giocatori ${t.averagePlayerDistanceMeters}m, ` +
          `spread ${t.averageSpreadMeters}m, centroide (${t.centroidX}, ${t.centroidY}), ` +
          `simmetria ${t.symmetryScore}`,
      )
      .join('\n');

    return `Sei un assistente tattico espertodifutsal.
Analizza il seguente report di movimento e fornisci un'interpretazione tattica breve in italiano.

CAMPO: ${report.fieldWidthMeters}x${report.fieldHeightMeters} metri
DURATA: ${report.durationMs} ms
DISTANZA TOTALE: ${report.summary.totalDistanceMeters}m
GIOCATORE PIÙ ATTIVO: ${report.summary.mostActivePlayerId}

GIOCATORI:
${playerLines}

SQUADRE:
${teamLines}

Restituisci un oggetto JSON con questi campi:
- summary (string): interpretazione tattica in 2-3 frasi
- tags (string[]): 3-5 tag tattici, es. ["pressing alto", "transizione", "fascia sinistra"]
- confidence (number): stima di confidenza 0.0-1.0
- suggestedImprovements (string[]): 1-3 suggerimenti concreti

Non aggiungere testo fuori dal JSON.`;
  }
}
