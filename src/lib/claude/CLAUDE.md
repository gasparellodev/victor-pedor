# Módulo Claude — Correção Gramatical

## Propósito
Correção de gramática, pontuação e concordância de legendas em português usando a Claude API.

## API Pública

### `correctSubtitles(subtitles: Subtitle[]): Promise<Subtitle[]>`
Envia legendas para a Claude API, retorna legendas com texto corrigido. Preserva timestamps e índices.

### `buildCorrectionPrompt(subtitles: Subtitle[]): string`
Constrói o prompt de correção para o Claude. Exportado para testes.

## Dependências
- `@anthropic-ai/sdk` — Anthropic SDK
- `@/types/subtitle` — tipo Subtitle

## Regras
- Nunca alterar timestamps — apenas o texto
- Manter sentido original
- Corrigir: gramática, pontuação, concordância, acentuação
- Usar prompt caching para economia de tokens
- Retorno estruturado em JSON

## Env Vars
- `ANTHROPIC_API_KEY`
