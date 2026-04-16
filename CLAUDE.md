# SpeakChuk Video — AI Subtitle Generator

## Sobre
Aplicação Next.js que gera legendas SRT a partir de vídeos usando AssemblyAI + Claude API. Design system baseado no Stitch/Lumen Edit (Material Design 3 dark theme).

## Regras do Projeto
- TypeScript strict mode — sem `any`
- TDD obrigatório — testes antes da implementação
- Cada módulo tem seu próprio CLAUDE.md
- Validação de input com Zod em todas as API routes
- Tratamento de erros explícito — nunca engolir erros silenciosamente
- Componentes React: function components apenas, hooks para lógica
- Naming: camelCase para variáveis/funções, PascalCase para componentes/tipos

## Comandos
- `npm run dev` — Inicia o dev server
- `npm run build` — Build de produção
- `npm run test` — Roda todos os testes (Vitest)
- `npm run test:watch` — Testes em modo watch
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript type check

## Env Vars Obrigatórias
- `ASSEMBLYAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `BLOB_READ_WRITE_TOKEN`
- `POSTGRES_URL` — Neon Serverless Postgres connection string

## Arquitetura
- SSE Híbrido: SSE para steps rápidos, polling leve para espera do AssemblyAI
- API Routes: upload, transcribe, status polling, correct (SSE), srt download, videos CRUD
- Lib modules: blob, assemblyai, claude, srt, pipeline, db (cada um com CLAUDE.md)
- Persistência: Neon Serverless Postgres para metadados de vídeos

## Estrutura
```
src/
  app/           — Pages e API routes (App Router)
  lib/           — Módulos de negócio (blob, assemblyai, claude, srt, pipeline, db)
  components/    — Componentes React (upload, preview, editor)
  hooks/         — Custom hooks (useProcessPipeline, useVideoSync, useSubtitleState)
  types/         — Tipos compartilhados (Subtitle, PipelineState)
```
