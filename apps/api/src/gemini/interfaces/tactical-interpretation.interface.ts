export interface TacticalInterpretation {
  version: string;
  summary: string;
  tags: string[];
  confidence: number; // 0.0 - 1.0
  suggestedImprovements: string[];
  rawResponse?: string;
  modelName: string;
  tokenUsage?: number;
}
