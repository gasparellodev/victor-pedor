# Módulo AssemblyAI — Transcrição

## Propósito
Cliente para transcrição de áudio via AssemblyAI com agrupamento de palavras em legendas.

## API Pública

### `submitTranscription(audioUrl: string): Promise<string>`
Submete um áudio para transcrição no AssemblyAI com `language_code: 'pt'`. Retorna o `transcriptId`.

### `checkTranscriptionStatus(transcriptId: string): Promise<TranscriptionStatus>`
Checa o status de uma transcrição. Retorna status, progresso e palavras transcritas quando pronto.

### `wordsToSubtitles(words: TranscribedWord[]): Subtitle[]`
Agrupa palavras transcritas em legendas. Critérios de agrupamento:
- Máximo ~10 palavras por legenda
- Quebra em pausas naturais (>500ms entre palavras)
- Respeita pontuação final (., !, ?)

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
- `@/types/subtitle` — tipo Subtitle

## Env Vars
- `ASSEMBLYAI_API_KEY`
