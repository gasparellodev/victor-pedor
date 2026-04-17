# Subtitle Format Module — SpeakChuk Video

## Proposito
Nucleo puro (sem React, sem I/O) para aplicar limites de comprimento profissionais em legendas: quebra automatica em 1 ou 2 linhas respeitando fronteiras de palavra e divisao em dois subtitulos quando o texto nao cabe no limite.

Base algoritmica reutilizada pelo pipeline de geracao (AssemblyAI + pos-Claude), pelo reducer do editor (`FORMAT_TEXT`, `REFORMAT_ALL`) e pela UI (preview em tempo real do slider de limite).

## API Publica

### Funcoes puras
- `breakTextIntoLines(text, opts) → BreakResult` — normaliza whitespace, respeita fronteira de palavra, produz `lines: string[]` (1 ou 2) + `overflow: string | null`.
- `splitIntoTwoSubtitles(subtitle, opts) → [Subtitle, Subtitle]` — divide pelo meio das palavras com timestamps proporcionais ao numero de palavras de cada metade, gap de 1ms entre os dois. Lanca se `words.length < 2`.
- `formatSubtitle(subtitle, opts, { destructive }) → FormatResult` — orquestrador. Quando `destructive=false` mantem 1 subtitulo (aceita overflow na linha 2). Quando `destructive=true` e o texto nao cabe em 2 linhas, retorna dois subtitulos com `wasSplit=true`.

### Tipos
- `FormatOptions` — `{ maxCharsPerLine, maxLines }`
- `FormatOptionsSchema` — Zod schema para validacao
- `BreakResult` — `{ lines, overflow }`
- `FormatResult` — `{ subtitles, wasSplit }`

### Constantes
- `DEFAULT_MAX_CHARS_PER_LINE = 42` (padrao Netflix)
- `DEFAULT_MAX_LINES = 2`
- `MAX_CHARS_PER_LINE_MIN = 20`
- `MAX_CHARS_PER_LINE_MAX = 60`
- `DEFAULT_FORMAT_OPTIONS` — objeto pronto para uso

## Regras de Negocio

1. **Quebra pela fronteira de palavra**: nunca corta uma palavra ao meio.
2. **Palavra unica > maxCharsPerLine**: aceita overflow visual na linha 1, sem overflow reportado.
3. **Split balanceado**: para 2 linhas sem overflow, escolhe o ponto de quebra que minimiza a diferenca de comprimento entre as duas linhas.
4. **Split greedy + overflow**: quando o texto nao cabe em 2 linhas, enche linha 1 e linha 2 com o maximo possivel e devolve o resto em `overflow`.
5. **Normaliza whitespace**: colapsa `\s+` → ` ` e faz trim (incluindo `\n` pre-existente — o texto eh sempre reformatado do zero).
6. **`\n` eh a fonte de verdade**: `formatSubtitle` devolve texto com `\n` entre as linhas. Renderizacao (`whitespace-pre-line`) e export (SRT/ASS) ja esperam esse formato.
7. **Split reindex eh responsabilidade do caller**: `splitIntoTwoSubtitles` devolve `index=0` nos dois subtitulos.

## Dependencias
- `@/types/subtitle` — tipo `Subtitle`
- `zod` — validacao de `FormatOptions`

Nenhuma dependencia de React, fetch, DOM ou filesystem. Pode ser usado no cliente e no servidor.

## Testes
- `break-lines.test.ts` — 11 casos: happy path, overflow, palavra unica, whitespace, `\n` pre-existente, maxLines=1, split balanceado.
- `split-subtitle.test.ts` — 7 casos: timestamps proporcionais, gap de 1ms, palavras preservadas, linhas ≤ maxCharsPerLine, erro quando `words.length < 2`.
- `format-subtitle.test.ts` — 9 casos: modos destrutivo e nao-destrutivo, idempotencia em modo nao-destrutivo, preservacao de timestamps.

## Exemplos

```ts
import { formatSubtitle, DEFAULT_FORMAT_OPTIONS } from "@/lib/subtitle-format";

const result = formatSubtitle(
  { index: 1, startTime: 0, endTime: 3000, text: "Texto longo que precisa quebrar" },
  DEFAULT_FORMAT_OPTIONS,
  { destructive: false }
);
// result.subtitles[0].text tem \n entre as linhas, wasSplit=false
```
