# API Route: POST /api/transcribe

## Propósito
Submete um vídeo (via blob URL) ao AssemblyAI para transcrição.

## Request
- Method: POST
- Content-Type: application/json
- Body: `{ blobUrl: string }`

## Response
- 200: `{ transcriptId: string }`
- 400: `{ error: string }` (blobUrl ausente)
- 500: `{ error: string }` (falha na submissão)

## Dependências
- `@/lib/assemblyai/client` — submitTranscription
- `zod` — validação
