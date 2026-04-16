# Thumbnail Module — SpeakChuk Video

## Proposito
Captura frame de video via canvas no browser durante upload. Gera thumbnail para exibicao no dashboard.

## API Publica

### `captureVideoFrame(file: File, timeSeconds?: number): Promise<Blob>`
Carrega video em elemento temporario, seek para o timestamp, captura frame via canvas.
- Default timeSeconds: 1 (1 segundo do inicio)
- Output: JPEG blob, 320x180 (16:9), qualidade 0.8

### `uploadThumbnail(blob: Blob, videoId: string): Promise<string>`
Faz upload do thumbnail para Vercel Blob via API e retorna URL.

## Dependencias
- HTML5 Canvas API
- HTML5 Video element (offscreen)
- Vercel Blob (via API route)

## Limitacoes
- Video precisa ser decodificavel pelo browser
- CORS pode bloquear videos de outras origens
- Canvas nao funciona em Web Workers

## Testes
- captureVideoFrame retorna Blob com type image/jpeg
- captureVideoFrame respeita dimensoes 320x180
- captureVideoFrame usa timestamp default de 1s
