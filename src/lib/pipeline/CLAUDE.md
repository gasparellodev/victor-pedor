# Módulo Pipeline — Orchestrator

## Propósito
Coordena o pipeline completo: upload → transcrição → correção gramatical.

## API Pública

### `createPipelineOrchestrator(deps: PipelineDeps): PipelineOrchestrator`
Factory que cria o orquestrador com dependências injetáveis (para testes).

### `PipelineOrchestrator.process(file: File, onProgress: ProgressCallback): Promise<Subtitle[]>`
Executa o pipeline completo, emitindo eventos de progresso.

## Tipos
```typescript
interface PipelineDeps {
  uploadVideo: (file: File) => Promise<{ url: string }>;
  submitTranscription: (audioUrl: string) => Promise<string>;
  checkTranscriptionStatus: (id: string) => Promise<TranscriptionStatus>;
  wordsToSubtitles: (words: TranscribedWord[]) => Subtitle[];
  correctSubtitles: (subtitles: Subtitle[]) => Promise<Subtitle[]>;
}

type ProgressCallback = (stage: PipelineStage, progress: number) => void;
```

## Dependências
- `@/lib/blob` — upload
- `@/lib/assemblyai` — transcrição
- `@/lib/claude` — correção
- `@/types/pipeline` — PipelineStage

## Regras
- Dependency injection para facilitar testes
- Erros devem incluir contexto do stage que falhou
- Polling do AssemblyAI com intervalo configurável
