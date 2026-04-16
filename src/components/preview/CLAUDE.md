# Componentes de Preview

## VideoPlayer
Player de vídeo nativo com controles padrão.

## SubtitleOverlay
Overlay que exibe a legenda ativa sincronizada com o currentTime do vídeo.

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
  currentTime: number; // em milissegundos
}
```

## Hook: useVideoSync
Sincroniza currentTime do vídeo com a legenda ativa via requestAnimationFrame.

## Regras
- Player usa controles nativos do browser
- Overlay é posicionado absolutamente sobre o vídeo
- Atualização suave sem flicker
