# Módulo SRT — Parser, Generator, Validator

## Propósito
Parsing, geração e validação de arquivos SRT (SubRip Subtitle).

## API Pública

### `parseSrt(content: string): Subtitle[]`
Converte uma string SRT em array de Subtitle. Lança erro para formato inválido.

### `generateSrt(subtitles: Subtitle[]): string`
Converte array de Subtitle em string SRT formatada. Re-indexa automaticamente.

### `validateSrt(subtitles: Subtitle[]): ValidationResult`
Valida array de Subtitle retornando erros encontrados:
- Timestamps desordenados
- Sobreposição de timestamps
- Texto vazio
- startTime >= endTime

## Formato SRT
```
1
00:00:01,000 --> 00:00:04,000
Primeira legenda

2
00:00:05,000 --> 00:00:08,000
Segunda legenda
```

## Dependências
- `@/types/subtitle` — tipo Subtitle

## Regras
- Funções puras — sem side effects
- Timestamps em milissegundos internamente
- Formato de timestamp SRT: `HH:MM:SS,mmm`
- Tolerância zero para erros de formato no parser
