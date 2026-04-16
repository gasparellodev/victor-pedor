# API Route: POST /api/correct

## Propósito
Recebe legendas brutas, envia ao Claude para correção gramatical, retorna legendas corrigidas via SSE stream.

## Request
- Method: POST
- Content-Type: application/json
- Body: `{ subtitles: Subtitle[] }`

## Response
- SSE stream com eventos:
  - `event: status` — `{ stage: 'correcting' }`
  - `event: result` — `{ subtitles: Subtitle[] }`
  - `event: error` — `{ message: string }`

## Dependências
- `@/lib/claude/client` — correctSubtitles
- `zod` — validação
