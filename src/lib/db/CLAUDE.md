# Database Module — Neon Serverless Postgres

## Proposito
Camada de persistencia para armazenar metadados de videos processados. Utiliza Neon Serverless Postgres (substituto oficial do Vercel Postgres).

## API Publica

### `getDb(): NeonQueryFunction`
Retorna instancia do cliente SQL do Neon. Usa `POSTGRES_URL` do env.

### `createVideo(data: CreateVideoInput): Promise<Video>`
Cria registro de video no banco. Retorna o video criado com `id` gerado.

### `listVideos(): Promise<Video[]>`
Lista todos os videos ordenados por `created_at DESC`.

### `getVideoById(id: string): Promise<Video | null>`
Busca video por UUID. Retorna `null` se nao encontrado.

### `updateVideo(id: string, data: UpdateVideoInput): Promise<Video | null>`
Atualiza campos do video. Retorna video atualizado ou `null` se nao encontrado.

### `deleteVideo(id: string): Promise<boolean>`
Deleta video por UUID. Retorna `true` se deletado, `false` se nao encontrado.

### `initializeDatabase(): Promise<void>`
Cria a tabela `videos` se nao existir (usado em setup/migration).

## Tipos

### `Video`
```typescript
interface Video {
  id: string;
  title: string;
  blobUrl: string;
  thumbnailUrl: string | null;
  durationMs: number | null;
  status: VideoStatus;
  transcriptId: string | null;
  subtitles: Subtitle[] | null;
  subtitleStyle: SubtitleStyle | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### `VideoStatus`
`'uploading' | 'transcribing' | 'correcting' | 'ready' | 'error'`

### `CreateVideoInput`
```typescript
{ title: string; blobUrl: string; durationMs?: number }
```

### `UpdateVideoInput`
```typescript
Partial<{ status: VideoStatus; transcriptId: string; subtitles: Subtitle[]; subtitleStyle: SubtitleStyle; errorMessage: string; thumbnailUrl: string; durationMs: number }>
```

## Dependencias
- `@neondatabase/serverless` — cliente SQL serverless
- `zod` — validacao de inputs
- `@/types/subtitle` — tipo Subtitle

## Env Vars
- `POSTGRES_URL` — connection string do Neon/Vercel Postgres

## Regras de Negocio
- Todas as queries usam parameterized queries (nunca string interpolation)
- UUIDs gerados pelo banco (gen_random_uuid())
- `updated_at` atualizado automaticamente em cada UPDATE
- Status so pode transicionar: uploading → transcribing → correcting → ready | error
- Subtitles armazenados como JSONB para flexibilidade

## Edge Cases
- `getVideoById` com UUID invalido retorna null (nao lanca erro)
- `deleteVideo` com ID inexistente retorna false
- `updateVideo` com ID inexistente retorna null
- Connection failure lanca erro que deve ser tratado pelo caller

## Estrategia de Testes
- Mock do `@neondatabase/serverless` com `vi.mock()`
- Testar todos os CRUD operations
- Testar validacao de input com Zod
- Testar mapeamento de snake_case (DB) para camelCase (TS)
