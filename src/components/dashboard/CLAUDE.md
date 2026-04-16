# Dashboard Components — SpeakChuk Video

## Proposito
Componentes para a pagina de listagem de videos (Dashboard), seguindo o design Stitch/Lumen Edit.

## Componentes

### `VideoCard`
Card de video com thumbnail, titulo, status badge, duracao e menu de acoes.
- aspect-video thumbnail area (placeholder ou imagem real)
- Status badges: Ready (green), Transcribing (blue/animated), Error (red)
- Duracao no canto inferior direito com glass-panel
- Titulo em Manrope bold
- Data de edicao em uppercase tracking-widest
- Hover: ring-1 ring-outline-variant/40
- Click navega para /videos/[id]

### `VideoGrid`
Grid responsivo de VideoCards.
- 1 col mobile, 2 cols md, 3 cols lg, 4 cols xl
- gap-6 entre cards
- Inclui card "Start New Video" como ultimo item (dashed border, icon +)

### `EmptyState`
Estado vazio quando nao ha videos.
- Icone central, titulo, descricao, CTA para upload

## Props

### VideoCard
```typescript
{ video: Video; onDelete?: (id: string) => void }
```

### VideoGrid
```typescript
{ videos: Video[] }
```

## Dependencias
- `@/lib/db/schema` — tipo Video, VideoStatus
- Next.js Link para navegacao
- Design tokens do globals.css

## Testes
- Renderiza titulo e status corretos
- Badge de status com cor correta por status
- Grid com numero correto de colunas
- Empty state quando lista vazia
- Click navega para URL correta
