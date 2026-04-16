# Custom Hooks

## useVideoSync
Sincroniza o currentTime de um elemento `<video>` com o estado React via requestAnimationFrame.
Retorna currentTime em milissegundos.

## useSubtitleState
Reducer para gerenciar array de Subtitle com ações: SET, UPDATE_TEXT, UPDATE_START, UPDATE_END, DELETE, INSERT, MERGE, SPLIT.

## useProcessPipeline
State machine do pipeline: idle → uploading → transcribing → correcting → editing → done.
Orquestra chamadas às API routes e gerencia estado.

## Regras
- Hooks são puros — sem side effects diretos
- Cleanup de requestAnimationFrame no unmount
- Tipos explícitos para todos os retornos
