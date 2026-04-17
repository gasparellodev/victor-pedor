# Custom Hooks

## useVideoSync
Sincroniza o currentTime de um elemento `<video>` com o estado React via requestAnimationFrame.
Retorna currentTime em milissegundos.

## useSubtitleState
Reducer para gerenciar array de Subtitle com acoes: SET, UPDATE_TEXT, UPDATE_START,
UPDATE_END, DELETE, INSERT, MERGE, SPLIT, SHIFT_ALL, FORMAT_TEXT, REFORMAT_ALL.

FORMAT_TEXT (nao-destrutivo, 1 subtitulo) e REFORMAT_ALL (array inteiro, com flag
`destructive`) usam o modulo `@/lib/subtitle-format` para aplicar regra de limite de
caracteres por linha e dividir subtitulos longos em dois quando necessario.

## useProcessPipeline
State machine do pipeline: idle → uploading → transcribing → correcting → editing → done.
Orquestra chamadas as API routes e gerencia estado.

## useSubtitleStyle
Reducer + auto-save debounced para `SubtitleStyle` por video. Persiste no DB via
PATCH `/api/videos/[id]` apos 1s de inatividade.

## useDraggableOverlay
Hook que adiciona drag-to-position sobre a preview do video. Recebe `containerRef`
(elemento do player), `initialAnchor` opcional e flag `enabled`. Em cada movimento
emite `onChange({ xPercent, yPercent })`; o valor eh sempre clampado em 0-100.
Retorna `{ anchor, isDragging, onPointerDown }`. Usa Pointer Events — cobre mouse e
touch.

## useAutoScroll
Faz scroll suave ate o elemento com `[data-index="{activeIndex}"]`. Pode operar em
modo horizontal (timeline) ou vertical (sidebar).

## Regras
- Hooks sao puros — sem side effects diretos
- Cleanup de requestAnimationFrame e listeners no unmount
- Tipos explicitos para todos os retornos
- Evitar setState sincrono dentro de useEffect (usar valores derivados)
