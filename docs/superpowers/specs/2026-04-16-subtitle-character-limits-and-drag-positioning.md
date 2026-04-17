# Victor Pedor — Limite de Caracteres por Legenda & Drag-to-Position

**Date:** 2026-04-16
**Status:** Proposed

## Context

Hoje o projeto SpeakChuk Video gera e edita legendas sem nenhuma regra de tamanho. O tipo `Subtitle` armazena só `{ index, startTime, endTime, text }`, o overlay renderiza com `whitespace-pre-line` e `max-w-[85%]`, e não existe limite de caracteres nem validação de comprimento em nenhuma etapa do pipeline (AssemblyAI, Claude, editor, export).

Isso causa três problemas reais:
1. Legendas geradas pela IA extrapolam a largura confortável do vídeo e viram 3+ linhas visuais.
2. Edição manual não tem feedback sobre caber ou não na tela.
3. Posicionamento é limitado a `top | center | bottom` global — não há controle fino.

Esta fase eleva o nível do editor aplicando uma regra clássica de legendagem profissional: **1 ou 2 linhas, com limite de caracteres configurável por vídeo**, com **quebra automática** quando excede e **divisão em dois subtítulos** quando o texto é grande demais para caber em 2 linhas. Complementa com **posicionamento por arrastar** sobre a preview (coordenadas em %), mantendo `top/center/bottom` como fallback retrocompatível.

O foco permanece sendo o ciclo: **legendar → editar sem erros → exportar corretamente**.

**Decisões de produto já fechadas:**
- Limite de caracteres: **configurável por vídeo** (slider 20–60 chars/linha, default 42).
- Máximo de linhas: **1 ou 2** (toggle, default 2).
- Quando excede 2 linhas: **quebra automática em 2 linhas respeitando palavras**; se ainda não couber, **divide em 2 subtítulos** com timestamps proporcionais.
- Posicionamento: **drag-to-position** visual sobre o vídeo, salvo como `anchor: { xPercent, yPercent }`.
- Aplicação: **pipeline de geração** + **auto-quebra não-destrutiva ao abrir editor** + **botão "Reformatar todas"** (destrutivo).

## Engineering Principles

Mesmas regras do spec v2 e do `CLAUDE.md` raiz:
- TypeScript strict — sem `any`.
- TDD obrigatório — testes antes da implementação.
- Cada módulo novo (`src/lib/subtitle-format/`) ganha seu próprio `CLAUDE.md`.
- Validação Zod em API routes e schemas persistidos.
- Function components + hooks, camelCase/PascalCase.
- Mensagens ao usuário em pt-BR.

### Workflow por fase
1. GitHub Issue com o escopo da fase.
2. Branch dedicada (`feat/fase-X-nome`).
3. TDD: testes primeiro.
4. `CLAUDE.md` para o módulo novo.
5. PR com descrição detalhada.
6. `/code-review` e `/security-review` antes do merge.
7. Frontend review (fases com UI).
8. Squash merge para main.

## Architecture

### Decisão arquitetural central — onde mora a quebra de linha

**`\n` embutido em `Subtitle.text`** (não computado on-the-fly).

Motivos:
- Export SRT (`src/lib/srt/generator.ts`) e ASS (`src/lib/ffmpeg-export/ass-generator.ts`) já esperam `\n` no texto — mantém contratos atuais.
- `SubtitleOverlay` já renderiza `\n` via `whitespace-pre-line`.
- Textarea preserva `\n` (Shift+Enter) — edição manual funciona de graça.
- Retrocompat: vídeos antigos sem `\n` continuam válidos; a quebra é aditiva.

A função pura `breakTextIntoLines()` roda em **aplicadores** (pipeline, auto-format on load, action do reducer) — nunca em **leitores** (overlay, export).

### Shape retrocompatível de `SubtitleStyle`

Todos os novos campos **opcionais** para não invalidar Zod de registros existentes:

```typescript
interface SubtitleStyle {
  // existentes
  fontFamily: string;
  fontSize: number;
  fontWeight: "400" | "500" | "600" | "700";
  fontColor: string;
  backgroundColor: string;
  position: "top" | "center" | "bottom";

  // novos (Phase 1)
  maxCharsPerLine?: number;               // default runtime: 42, range 20–60
  maxLines?: 1 | 2;                        // default runtime: 2
  anchor?: { xPercent: number; yPercent: number }; // 0..100
}
```

Regra de leitura:
- Se `anchor` existe → usa coordenadas precisas.
- Senão → usa `position` (legado).

`DEFAULT_SUBTITLE_STYLE` passa a incluir `maxCharsPerLine: 42` e `maxLines: 2`. **Não** inclui `anchor` por padrão — mantém bottom-center atual para vídeos existentes.

### New Module Map

```
src/
  lib/
    subtitle-format/              ← NEW (Phase 1)
      CLAUDE.md
      types.ts                    — FormatOptions, FormatResult
      break-lines.ts              — breakTextIntoLines(text, opts)
      break-lines.test.ts
      split-subtitle.ts           — splitIntoTwoSubtitles(sub, opts)
      split-subtitle.test.ts
      format-subtitle.ts          — orquestrador (não-destrutivo | destrutivo)
      format-subtitle.test.ts
      index.ts                    — barrel export

    subtitle-style/               ← EXISTING (update types + presets)
      types.ts                    — estender Zod schema
      presets.ts                  — default ganha maxCharsPerLine, maxLines

    assemblyai/                   ← EXISTING (update client)
      client.ts                   — MAX_WORDS_PER_SUBTITLE ajustado + limite por chars

    claude/                       ← EXISTING (pós-processamento)
      prompts.ts                  — NÃO alterar SYSTEM_PROMPT (preserva cache ephemeral)

    ffmpeg-export/                ← EXISTING (update ass-generator)
      ass-generator.ts            — suportar anchor via {\pos(x,y)}

  hooks/
    useSubtitleState.ts           ← EXISTING (add FORMAT_TEXT, REFORMAT_ALL)
    useDraggableOverlay.ts        ← NEW (Phase 5)
    useDraggableOverlay.test.ts

  components/
    editor/
      StylePanel.tsx              ← EXISTING (add slider + toggle)
      EditorToolbar.tsx           ← EXISTING (add "Reformatar todas")

    preview/
      SubtitleOverlay.tsx         ← EXISTING (drag handler + anchor positioning)
```

Nenhuma rota nova. Nenhuma migração de DB (JSONB absorve campos opcionais).

---

## Phase 1 — Núcleo puro `subtitle-format` + tipos

**Issue:** #TBD | **Branch:** `feat/fase-1-subtitle-format-core`

### Objetivo
Criar a base algorítmica 100% pura e testada, sem tocar em UI/DB/pipeline.

### Novo módulo `src/lib/subtitle-format/`

**`types.ts`:**
```typescript
interface FormatOptions {
  maxCharsPerLine: number;   // range 20-60, validado via Zod
  maxLines: 1 | 2;
}

interface BreakResult {
  lines: string[];           // 1 ou 2 entradas
  overflow: string | null;   // texto que não coube
}

interface FormatResult {
  subtitles: Subtitle[];     // 1 ou 2 itens
  wasSplit: boolean;
}
```

**`break-lines.ts`:** `breakTextIntoLines(text, opts) → BreakResult`
- Normaliza whitespace interno (`\s+` → ` `), ignora `\n` pré-existente.
- Greedy word-wrap: tenta caber em 1 linha; se não, distribui em 2 respeitando fronteira de palavra mais próxima do centro.
- Palavra única > maxChars: aceita overflow visual na linha 1 (documentado como edge case).
- `overflow` populado quando o texto não cabe em `maxLines`.

**`split-subtitle.ts`:** `splitIntoTwoSubtitles(sub, opts) → [Subtitle, Subtitle]`
- Reusa lógica SPLIT existente em `useSubtitleState` (split por palavras na metade).
- Timestamps proporcionais ao número de palavras de cada parte, gap de 1ms entre os dois.
- Cada parte é re-formatada com `breakTextIntoLines`.

**`format-subtitle.ts`:** `formatSubtitle(sub, opts, { destructive }) → FormatResult`
- `destructive: false` → aplica só `breakTextIntoLines`, nunca divide.
- `destructive: true` → se `overflow` existe, aplica `splitIntoTwoSubtitles`.

### Update `src/lib/subtitle-style/`
- `types.ts` — Zod schema ganha `maxCharsPerLine` (z.number().min(20).max(60).optional()), `maxLines` (z.union([z.literal(1), z.literal(2)]).optional()), `anchor` (z.object({ xPercent: z.number().min(0).max(100), yPercent: z.number().min(0).max(100) }).optional()).
- `presets.ts` — `DEFAULT_SUBTITLE_STYLE` ganha `maxCharsPerLine: 42, maxLines: 2`.

### Testes TDD (casos primários)
- `breakTextIntoLines`:
  - Texto curto (≤ maxChars) → 1 linha intacta, overflow null.
  - Texto médio → quebra em 2 linhas sem cortar palavra.
  - Texto longo → 2 linhas + overflow populado.
  - Palavra única gigante → linha 1 com overflow visual, overflow null.
  - Texto vazio → lines=[""], overflow null.
  - Normaliza múltiplos espaços.
- `splitIntoTwoSubtitles`:
  - 80 chars com 42/2 → 2 subs, timestamps proporcionais às palavras.
  - `first.endTime < second.startTime` com gap de 1ms.
  - Cada sub resultante cabe em 2 linhas.
- `formatSubtitle`:
  - Não destrutivo + cabe → `[original com \n]`, wasSplit=false.
  - Não destrutivo + não cabe → `[original com \n aceito overflow]`, wasSplit=false.
  - Destrutivo + cabe → mesma coisa.
  - Destrutivo + não cabe → 2 subs, wasSplit=true.
- `subtitle-style/presets`:
  - DEFAULT contém `maxCharsPerLine: 42, maxLines: 2`.
  - Zod aceita registro antigo sem os novos campos.

### Validação
- `npm run test -- src/lib/subtitle-format` → verde.
- `npm run test` → sem regressão (zero tocou em runtime de usuário).
- `npm run typecheck` e `npm run lint` limpos.

---

## Phase 2 — Reducer actions + auto-format on load

**Issue:** #TBD | **Branch:** `feat/fase-2-format-reducer`

### Objetivo
Integrar o núcleo puro ao estado, aplicando quebra automática não-destrutiva quando o editor abre.

### Update `src/hooks/useSubtitleState.ts`
Duas novas actions:

```typescript
| { type: "FORMAT_TEXT"; index: number; options: FormatOptions }
| { type: "REFORMAT_ALL"; options: FormatOptions; destructive: boolean }
```

- `FORMAT_TEXT` → aplica `formatSubtitle` em um subtitle específico, não destrutivo; textos longos aceitam overflow.
- `REFORMAT_ALL destructive=false` → itera o array, quebra linha em cada item, nunca insere/remove subs. Idempotente.
- `REFORMAT_ALL destructive=true` → itera, e quando `wasSplit=true` insere o segundo sub ajustando `index` subsequente. Reindex final.

### Update `src/app/(app)/videos/[id]/page.tsx`
Após o `dispatch({ type: "SET" })` inicial, disparar `REFORMAT_ALL destructive=false` com as opções do estilo carregado. Isso aplica quebra silenciosa em vídeos legados. O debounce de auto-save existente vai persistir o `\n` no próximo ciclo — **migração gradual desejada**.

### Testes TDD
- `useSubtitleState.test.ts` — novos casos:
  - `FORMAT_TEXT` em sub longo → texto ganha `\n`.
  - `FORMAT_TEXT` em sub curto → texto inalterado.
  - `FORMAT_TEXT` em índice inválido → noop.
  - `REFORMAT_ALL destructive=false` idempotente (aplicar 2× = aplicar 1×).
  - `REFORMAT_ALL destructive=true` com 1 sub longo → array passa a ter 2 subs reindexados.
  - Array vazio → noop.

### Validação
- `npm run test -- useSubtitleState` → verde.
- Manual: abrir um vídeo legado com legendas longas → texto passa a quebrar em 2 linhas automaticamente; após 2s, DB reflete a quebra.
- Rollback: reverter hook + dispatch da página = zero impacto.

### Pergunta aberta
Migração silenciosa de `\n` no DB é ok, ou precisa de flag `subtitleStyle.hasBeenFormatted` para gated? **Recomendação:** ok silenciosa — o shape do DB não muda e nenhum consumidor externo existe hoje.

---

## Phase 3 — Pipeline de geração (AssemblyAI + pós-Claude)

**Issue:** #TBD | **Branch:** `feat/fase-3-generation-pipeline`

### Objetivo
Subtítulos recém-gerados já nascem respeitando o limite.

### Update `src/lib/assemblyai/client.ts`
- `MAX_WORDS_PER_SUBTITLE`: 10 → 7 (alinha com ~42 chars × 2 linhas).
- Novo gatilho em `wordsToSubtitles`: quebrar quando `accumulatedCharCount >= maxCharsPerLine * maxLines` (default 84).
- Exportar assinatura flexível: `wordsToSubtitles(words, opts?: Partial<FormatOptions>)`.

### Pós-processamento Claude
Após a correção gramatical retornar, aplicar `formatSubtitle` (não destrutivo) em cada sub antes de persistir. Local: onde a orquestração consome o output do Claude (rota `/api/correct` ou hook `useProcessPipeline`, conforme implementação atual).

### **NÃO** alterar `src/lib/claude/prompts.ts` nesta fase
O `SYSTEM_PROMPT` usa `cache_control: ephemeral`. Qualquer mudança invalida o cache e encarece. Fazemos o corte de tamanho em pós — o Claude entrega texto corrigido, nós aplicamos o layout.

### Testes TDD
- `assemblyai/client.test.ts`:
  - 20 palavras curtas sem pausas → múltiplos subs respeitando limite de chars.
  - Palavra única gigante → sub sozinho (nunca vazio).
  - Pausa > 500ms ainda quebra prioritariamente (regressão zero).
  - `opts` customiza o limite.
- Teste de integração do pipeline (onde a pós-formatação é aplicada):
  - Output do Claude com texto longo → após pós-processamento, texto ganha `\n`.
  - Output curto passa inalterado.

### Validação
- Upload de vídeo novo em dev → legendas já vêm em 1-2 linhas sem overflow.
- Medir cache hit rate do Claude em staging (deve permanecer > 90% — sem mudança no prompt).
- Rollback: reverter `MAX_WORDS_PER_SUBTITLE` e comentar pós-processamento.

### Perguntas abertas
- 7 é o sweet spot ou 8 funciona melhor? Validar empiricamente com 3–4 vídeos staging.
- Risco de divergência entre `index` in/out do Claude por causa do nosso split? Não, porque o split vem DEPOIS do Claude. Sem risco.

---

## Phase 4 — UI: slider de chars + toggle de linhas + botão "Reformatar todas"

**Issue:** #TBD | **Branch:** `feat/fase-4-format-ui`

### Objetivo
Dar ao usuário controle sobre o limite e uma ação explícita para reformatar o vídeo inteiro (destrutivo).

### Update `src/components/editor/StylePanel.tsx`
Nova seção "Formato da legenda":
- Slider: **"Limite por linha"** 20–60, default 42, display do valor atual.
- Toggle: **"Linhas"** 1 / 2, default 2.
- Mudança dispara `updateStyle({ maxCharsPerLine })` / `updateStyle({ maxLines })` via `useSubtitleStyle` (auto-save existente, debounce 1s).
- `useEffect` na página dispara `REFORMAT_ALL destructive=false` sempre que `maxCharsPerLine` ou `maxLines` mudam — quebra ao vivo.

### Update `src/components/editor/EditorToolbar.tsx`
Novo botão: **"Reformatar todas"**
- Click abre confirmação ("Reformatar pode dividir legendas longas em 2. Continuar?") usando o mesmo padrão de dialog do delete, se já existente.
- Confirmado → `dispatch({ type: "REFORMAT_ALL", options, destructive: true })`.

### Testes TDD
- `StylePanel.test.tsx`:
  - Slider renderiza com default 42.
  - Drag chama `onUpdate({ maxCharsPerLine: N })`.
  - Valor fora do range é clampado.
  - Toggle chama `onUpdate({ maxLines: N })`.
- `EditorToolbar.test.tsx`:
  - Botão renderiza.
  - Click + confirm=true → dispatch com destructive=true.
  - Click + confirm=false → nenhum dispatch.

### Validação
- `npm run test` verde.
- Manual: mover slider 42 → 30 → legendas quebram ao vivo; clicar "Reformatar todas" → confirmar → subs longos se dividem em 2.
- Rollback: remover novos elementos do JSX; reducer continua funcionando isolado.

### Pergunta aberta
Confirmação via `window.confirm` nativo ou via `ConfirmDialog` existente? **Recomendação:** reusar o mesmo padrão do delete dialog.

---

## Phase 5 — Drag-to-Position sobre a preview

**Issue:** #TBD | **Branch:** `feat/fase-5-drag-position`

### Objetivo
Usuário arrasta a legenda sobre o vídeo; coordenadas salvas em `anchor`.

### Novo hook `src/hooks/useDraggableOverlay.ts`
- Pointer Events (cobre mouse + touch).
- Recebe `containerRef` (elemento do vídeo) e `initialAnchor`.
- Retorna `{ anchor, onPointerDown, isDragging }`.
- `xPercent` e `yPercent` calculados contra `getBoundingClientRect()`, clampados 0–100.
- Cleanup remove listeners globais.

### Update `src/components/preview/SubtitleOverlay.tsx`
Novas props: `draggable?: boolean`, `onAnchorChange?: (anchor) => void`.
- Se `style.anchor` existe → CSS `position: absolute; left: ${x}%; top: ${y}%; transform: translate(-50%, -50%)` (substitui `bottom-12`).
- Se não existe → comportamento atual (`absolute bottom-12 left-0 right-0 flex justify-center`) baseado em `position`.
- `draggable=true` → cursor grab, `pointer-events-auto`, pointerDown inicia drag.
- `draggable=false` (default) → `pointer-events-none` (atual).
- Durante `editingIndex !== null` na página, passar `draggable={false}` para não interferir com edição.

### Update `src/lib/ffmpeg-export/ass-generator.ts`
- Se `style.anchor` existe → gerar inline `{\pos(X,Y)}` no início do texto do dialogue, com X = `xPercent * 1920 / 100`, Y = `yPercent * 1080 / 100` (PlayResX/Y fixos do header).
- Se não existe → `positionToAssAlignment` atual (regressão zero).

### Update `src/app/(app)/videos/[id]/page.tsx`
- Passar `draggable={editingIndex === null}` e `onAnchorChange={(anchor) => updateStyle({ anchor })}` para `SubtitleOverlay`.

### Testes TDD
- `useDraggableOverlay.test.ts`:
  - pointerDown + pointerMove + pointerUp → anchor calculado contra bounding rect.
  - Clampa em 0–100.
  - pointerMove sem down → sem update.
  - unmount remove listeners.
- `SubtitleOverlay.test.tsx`:
  - Sem anchor → bottom-12 (regressão zero).
  - Com anchor → `left: X%; top: Y%`.
  - `draggable=true` → cursor grab.
  - `draggable=false` → `pointer-events-none`.
- `ass-generator.test.ts`:
  - Sem anchor → alignment numpad (comportamento atual).
  - Com anchor → contém `{\pos(X,Y)}` calculado.
  - SRT generator permanece sem coordenadas (formato não suporta — documentar).

### Validação
- `npm run test` verde.
- Manual: arrastar legenda → posição muda suavemente → reload mantém.
- Export ASS → abrir no VLC, conferir posição visual.
- Rollback: remover prop `draggable`, overlay volta ao comportamento atual; `anchor` no DB fica órfão sem quebrar nada.

---

## Sequenciamento e dependências

```
Fase 1 (core puro) ──┬──► Fase 2 (reducer) ──► Fase 4 (UI slider/botão)
                     │
                     ├──► Fase 3 (pipeline)
                     │
                     └──► Fase 5 (drag + ASS)
```

- Fase 1 é pré-requisito de todas.
- Fases 2 e 3 independentes — paralelizáveis.
- Fase 4 depende da 2.
- Fase 5 só precisa do shape `anchor` da fase 1.

Cada fase vira um PR separado.

## Verification Plan

### Per-Phase Verification
1. `npm run typecheck` — zero erros.
2. `npm run test` — todos verdes (existentes + novos).
3. `npm run lint` — limpo.
4. `npm run dev` — teste manual no browser.
5. `/code-review` automático.
6. `/security-review` antes do merge.

### End-to-End Verification (após todas as fases)
1. Upload de vídeo novo → legendas já vêm em 1–2 linhas respeitando 42 chars.
2. Abrir vídeo legado → quebra silenciosa aplicada, overlay bonito em 2 linhas.
3. Mover slider 42 → 30 → todas as legendas re-quebram ao vivo.
4. Clicar "Reformatar todas" em vídeo com legenda gigante → divide em 2 subs com timestamps proporcionais.
5. Arrastar legenda para top-right da preview → salva, reload mantém.
6. Export ASS com anchor → player externo (VLC) mostra na posição correta.
7. Export SRT → `\n` preservado entre linhas.

### Variáveis de ambiente
Nenhuma nova.

## Trade-offs e perguntas abertas

| # | Tema | Recomendação | Precisa validar? |
|---|------|---------------|------------------|
| 1 | Alterar `SYSTEM_PROMPT` do Claude para incluir limite | NÃO — preserva cache ephemeral, pós-processa | Validar em staging que cache hit > 90% |
| 2 | Migração silenciosa de `\n` via auto-save | OK — sem consumidores externos do DB | Confirmar |
| 3 | Split proporcional por palavras × por caracteres | Manter por palavras (consistente com SPLIT atual) | Confirmar |
| 4 | Bloquear drag durante edição inline | SIM — `draggable={editingIndex === null}` | Confirmar |
| 5 | `window.confirm` × modal custom para "Reformatar todas" | Usar mesmo padrão do delete dialog existente | Verificar se `ConfirmDialog` existe |
| 6 | Palavra única > maxChars | Aceitar overflow visual, documentar | Confirmar |
| 7 | `MAX_WORDS_PER_SUBTITLE` 10 → 7 muda UX de novos vídeos | Validar com 3–4 vídeos staging antes de mergear Fase 3 | Sim |
| 8 | Mobile touch no drag | Pointer Events cobrem — sem esforço extra | — |

## Critical Files to Touch

- `src/lib/subtitle-format/*` (novo módulo completo)
- `src/lib/subtitle-style/types.ts` + `presets.ts`
- `src/lib/assemblyai/client.ts`
- `src/lib/ffmpeg-export/ass-generator.ts`
- `src/hooks/useSubtitleState.ts`
- `src/hooks/useDraggableOverlay.ts` (novo)
- `src/components/preview/SubtitleOverlay.tsx`
- `src/components/editor/StylePanel.tsx`
- `src/components/editor/EditorToolbar.tsx`
- `src/app/(app)/videos/[id]/page.tsx`
