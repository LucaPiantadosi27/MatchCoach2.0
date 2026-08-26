# MatchCoach-AI

Applicazione di analisi tattica per il futsal, con lavagna interattiva, sistema di registrazione/playback degli schemi, motore di analisi geometrica dei movimenti e cervello tattico AI (Google Gemini).

## Architettura

```
apps/
├── mobile/     # Flutter (mobile-first, Android/iOS/Web)
├── api/        # NestJS backend
└── worker/     # BullMQ worker per analisi asincrona

infra/          # Docker, K8s, CI/CD

documentazione funzionale/   # Documentazione per macrostep
```

## Stack tecnologico

- **Frontend**: Flutter + Riverpod + go_router
- **Backend**: NestJS (TypeScript) + Prisma ORM
- **Database**: PostgreSQL + pgvector
- **Storage**: MinIO (S3-compatible)
- **Queue**: Redis + BullMQ
- **AI**: Google Gemini (behind backend proxy)
- **Containerizzazione**: Docker + Docker Compose (dev) / K8s (prod)
- **CI/CD**: GitHub Actions + ArgoCD

## Contratti comuni

- `BoardState` — stato della lavagna (giocatori, posizioni normalizzate 0-1)
- `MovementRecording` — registrazione keyframe dei movimenti

## Pipeline principale

```
BoardState/MovementRecording
       ↓
Movement Analysis Engine (geometria deterministica)
       ↓
MovementAnalysisReport
       ↓
Gemini (cervello tattico)
       ↓
Tactical Interpretation / Scheme Insight
```
