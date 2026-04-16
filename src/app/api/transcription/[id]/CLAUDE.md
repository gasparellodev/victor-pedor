# API Route: GET /api/transcription/[id]/status

## Propósito
Checa o status de uma transcrição no AssemblyAI. Client faz polling nesta rota.

## Request
- Method: GET
- Path param: `id` (transcriptId do AssemblyAI)

## Response
- 200: `{ status: 'queued' | 'processing' | 'completed' | 'error', subtitles?: Subtitle[], error?: string }`
- 500: `{ error: string }`

## Dependências
- `@/lib/assemblyai/client` — checkTranscriptionStatus, wordsToSubtitles
