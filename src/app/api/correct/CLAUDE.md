# API Route: POST /api/correct

## Propósito
Recebe legendas brutas, envia ao Claude para correção gramatical, aplica o formato
de linhas (`formatAllSubtitles` não-destrutivo) e retorna via SSE stream. Persiste
o resultado no DB quando `videoId` é fornecido.

## Request
- Method: POST
- Content-Type: application/json
- Body: `{ subtitles: Subtitle[], videoId?: string }`

## Response
- SSE stream com eventos:
  - `event: status` — `{ stage: 'correcting' }`
  - `event: result` — `{ subtitles: Subtitle[] }` (legendas já com `\n` entre linhas)
  - `event: error` — `{ message: string }`

## Pipeline
1. Validação Zod do body.
2. `correctSubtitles` (Claude) corrige gramática preservando `{ index, text }`.
3. `formatAllSubtitles` aplica `breakTextIntoLines` em cada subtítulo com
   `DEFAULT_FORMAT_OPTIONS` (42/2). Não-destrutivo — nunca divide em 2 subs nesta etapa.
4. Persiste no DB (`status: 'ready'`, `subtitles: formatted`).
5. Emite `event: result` com os subtítulos formatados.

## Decisão arquitetural
O `SYSTEM_PROMPT` do Claude **não** inclui instrução de limite de caracteres —
preserva o `cache_control: ephemeral` e mantém alta taxa de cache hit. O layout
acontece em pós-processamento puro.

## Dependências
- `@/lib/claude/client` — `correctSubtitles`
- `@/lib/subtitle-format` — `formatAllSubtitles`, `DEFAULT_FORMAT_OPTIONS`
- `@/lib/db/videos` — `updateVideo`
- `zod` — validação
