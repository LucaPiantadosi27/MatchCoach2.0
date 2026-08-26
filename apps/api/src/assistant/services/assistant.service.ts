import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AskDto, AskResponse } from '../interfaces';

interface GeminiCandidate {
  content?: {
    parts?: { text?: string }[];
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

@Injectable()
export class AssistantService {
  private readonly model = 'gemini-1.5-flash';

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async ask(dto: AskDto, userId: string): Promise<AskResponse> {
    if (dto.channel === 'B' && !dto.schemeId) {
      throw new BadRequestException('schemeId is required for channel B');
    }

    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      return this.fallback(dto);
    }

    const prompt = await this.buildPrompt(dto, userId);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      return this.fallback(dto);
    }

    const data = (await response.json()) as GeminiResponse;
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return this.formatResponse(answer, dto);
  }

  private async buildPrompt(dto: AskDto, userId: string): Promise<string> {
    if (dto.channel === 'A') {
      return `Sei un assistente tattico di futsal. Rispondi in italiano in modo chiaro e conciso.\n\nDomanda: ${dto.question}`;
    }

    const scheme = await this.prisma.scheme.findUnique({
      where: { id: dto.schemeId },
      include: { insight: true },
    });

    if (!scheme || scheme.userId !== userId) {
      throw new BadRequestException('Scheme not found or access denied');
    }

    const context = [
      `Nome schema: ${scheme.name}`,
      `Descrizione: ${scheme.description ?? 'N/A'}`,
      `Insight: ${scheme.insight?.description ?? 'Nessuna analisi disponibile'}`,
      `Tag: ${(scheme.insight?.tags ?? []).join(', ')}`,
    ].join('\n');

    return `Sei un assistente tattico di futsal. Rispondi in italiano basandoti sul seguente contesto dello schema dell'utente.\n\nContesto:\n${context}\n\nDomanda: ${dto.question}`;
  }

  private formatResponse(answer: string, dto: AskDto): AskResponse {
    const sources: string[] = [];
    if (dto.channel === 'B' && dto.schemeId) {
      sources.push(`scheme:${dto.schemeId}`);
    }
    return { answer, sources };
  }

  private fallback(dto: AskDto): AskResponse {
    const answer =
      dto.channel === 'A'
        ? 'Sono un assistente tattico di futsal in modalità fallback. Configura GEMINI_API_KEY per risposte complete.'
        : 'Non ho abbastanza contesto per rispondere sullo schema specifico. Configura GEMINI_API_KEY.';
    return { answer };
  }
}
