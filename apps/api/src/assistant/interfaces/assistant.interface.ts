export interface AskDto {
  channel: 'A' | 'B';
  question: string;
  schemeId?: string;
}

export interface AskResponse {
  answer: string;
  sources?: string[];
}
