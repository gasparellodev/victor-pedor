# Componentes de Preview

## VideoPlayer
Player de vídeo nativo com controles padrão.

## SubtitleOverlay
Overlay que exibe a legenda ativa sincronizada com o currentTime do vídeo.
Suporta posicionamento fixo (`top` / `center` / `bottom`) via `SubtitleStyle.position`
ou posicionamento livre via `SubtitleStyle.anchor` (coordenadas em %). Quando
`draggable` é `true`, o usuário pode arrastar a legenda sobre o vídeo para ajustar
a posição; cada movimento emite `onAnchorChange`.

## Props
```typescript
// VideoPlayer
interface VideoPlayerProps {
  src: string;
  videoRef: React.RefObject<HTMLVideoElement>;
}

// SubtitleOverlay
interface SubtitleOverlayProps {
  subtitles: Subtitle[];
  currentTime: number;              // em milissegundos
  style?: SubtitleStyle;
  draggable?: boolean;              // default: false
  onAnchorChange?: (anchor: { xPercent: number; yPercent: number }) => void;
}
```

## Hooks
- **useVideoSync** — sincroniza `currentTime` do vídeo com a legenda ativa via
  `requestAnimationFrame`.
- **useDraggableOverlay** — encapsula Pointer Events do drag-to-position.
  `SubtitleOverlay` usa este hook internamente quando `draggable=true`.

## Regras
- Player usa controles nativos do browser.
- Overlay é posicionado absolutamente sobre o vídeo.
- Atualização suave sem flicker.
- Drag desabilitado durante edição inline da legenda (caller passa
  `draggable={editingIndex === null}`).
- Anchor clampado em 0–100% — sem coordenadas fora do container.
