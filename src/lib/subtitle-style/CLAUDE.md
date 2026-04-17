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
  (background `transparent`, outline 2 px preto)
- `FONT_SIZE_MIN` / `FONT_SIZE_MAX` — limites do slider (16-48px)
- `OUTLINE_WIDTH_MIN` / `OUTLINE_WIDTH_MAX` — limites do slider (0-8px)
- `POSITION_OPTIONS` — ['top', 'center', 'bottom']
- `FONT_COLOR_PALETTE` — paleta restrita para a fonte: branco, amarelo, preto
- `OUTLINE_COLOR_PALETTE` — paleta restrita para o outline: preto, branco
- `TEXT_COLOR_PRESETS` / `BG_COLOR_PRESETS` — paletas legacy (mantidas para
  retrocompat — UI nova usa `FONT_COLOR_PALETTE`)

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
