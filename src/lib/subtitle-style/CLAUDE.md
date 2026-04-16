# Subtitle Style Module — SpeakChuk Video

## Proposito
Define tipos, validacao e presets para customizacao visual das legendas. Segue o design do Stitch "Caption Style" panel.

## API Publica

### Tipos
- `SubtitleStyle` — interface completa de estilo de legenda
- `SubtitleStyleSchema` — Zod schema para validacao
- `FontPreset` — interface de preset de fonte

### Constantes
- `FONT_PRESETS` — 6 fontes curadas para legendas
- `DEFAULT_SUBTITLE_STYLE` — estilo padrao aplicado a novos videos
- `FONT_SIZE_MIN` / `FONT_SIZE_MAX` — limites do slider (16-48px)
- `POSITION_OPTIONS` — ['top', 'center', 'bottom']
- `COLOR_PRESETS` — cores pre-definidas para texto e background

## Fontes Curadas
1. **Manrope** — Clean, modern geometric sans-serif
2. **Inter** — Neutral, highly readable
3. **Roboto Mono** — Monospaced, technical feel
4. **Montserrat** — Bold, impactful headlines
5. **Playfair Display** — Elegant serif
6. **Open Sans** — Friendly, universal

## Dependencias
- `zod` — validacao de schema

## Testes
- Validacao do schema aceita estilos validos
- Validacao rejeita fontSize fora dos limites
- Validacao rejeita position invalida
- DEFAULT_SUBTITLE_STYLE passa validacao
- Todos os FONT_PRESETS tem campos obrigatorios
- COLOR_PRESETS tem formato hex valido
