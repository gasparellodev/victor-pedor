# Módulo AssemblyAI — Transcrição

## Propósito
Cliente para transcrição de áudio via AssemblyAI com agrupamento de palavras em legendas.

## API Pública

### `submitTranscription(audioUrl: string): Promise<string>`
Submete um áudio para transcrição no AssemblyAI com `language_code: 'pt'`. Retorna o `transcriptId`.

### `checkTranscriptionStatus(transcriptId: string): Promise<TranscriptionStatus>`
Checa o status de uma transcrição. Retorna status, progresso e palavras transcritas quando pronto.

### `wordsToSubtitles(words: TranscribedWord[], opts?: Partial<FormatOptions>): Subtitle[]`
Agrupa palavras transcritas em legendas. Critérios de agrupamento:
- Máximo **7 palavras** por legenda (reduzido de 10 para alinhar com ~42 chars × 2 linhas)
- Quebra em pausas naturais (>500ms entre palavras)
- Respeita pontuação final (., !, ?)
- Quebra quando os caracteres acumulados + próxima palavra excederiam
  `maxCharsPerLine * maxLines` (default 42 × 2 = 84)

## Tipos
```typescript
interface TranscribedWord {
  text: string;
  start: number; // ms
  end: number;   // ms
  confidence: number;
}

interface TranscriptionStatus {
  status: 'queued' | 'processing' | 'completed' | 'error';
  words?: TranscribedWord[];
  error?: string;
}
```

## Dependências
- `assemblyai` — SDK oficial
- `@vercel/blob` — leitura do vídeo armazenado
- `@/types/subtitle` — tipo Subtitle
- `@/lib/subtitle-format` — defaults de limite de caracteres

## Env Vars
- `ASSEMBLYAI_API_KEY`
