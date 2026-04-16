# API Route: POST /api/upload

## Propósito
Recebe upload de vídeo via FormData, valida e armazena no Vercel Blob.

## Request
- Method: POST
- Content-Type: multipart/form-data
- Body: FormData com campo `file` (video)

## Response
- 200: `{ blobUrl: string, jobId: string }`
- 400: `{ error: string }` (tipo/tamanho inválido)
- 500: `{ error: string }` (falha no upload)

## Dependências
- `@/lib/blob/client` — uploadVideo
- `zod` — validação
- `crypto.randomUUID()` — geração de jobId
