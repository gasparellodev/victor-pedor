# API Route: POST /api/srt

## Propósito
Gera e retorna arquivo SRT a partir de legendas fornecidas.

## Request
- Method: POST
- Content-Type: application/json
- Body: `{ subtitles: Subtitle[] }`

## Response
- 200: SRT file content (Content-Type: text/srt, Content-Disposition: attachment)
- 400: `{ error: string }`

## Dependências
- `@/lib/srt/generator` — generateSrt
- `@/lib/srt/validator` — validateSrt
- `zod` — validação
