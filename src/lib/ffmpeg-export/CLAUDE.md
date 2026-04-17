# FFmpeg Export Module — SpeakChuk Video

## Proposito
Exporta video com legendas burned-in usando ffmpeg.wasm (client-side). Converte legendas + estilo para formato ASS e executa ffmpeg no browser.

## API Publica

### `generateAssContent(subtitles, style): string`
Converte array de Subtitle + SubtitleStyle para formato ASS (Advanced SubStation Alpha).
- Mapeia fontFamily, fontSize, fontWeight → ASS style block
- Mapeia fontColor, backgroundColor → ASS color codes (AABBGGRR format)
- Mapeia position → ASS alignment codes (2=bottom, 8=top, 5=center)
- Quando `style.anchor` existe, prepende `{\pos(X,Y)}` inline em cada Dialogue
  com coordenadas escaladas para PlayRes (1920×1080) — override do alignment.
- Gera dialogue events com timestamps no formato ASS (H:MM:SS.cc)

### `initFFmpeg(): Promise<FFmpeg>`
Inicializa instancia do ffmpeg.wasm. Carrega core + WASM (~25MB, cached pelo browser).

### `exportVideoWithSubtitles(options): Promise<Uint8Array>`
Executa o pipeline completo: write input video + ASS file → run ffmpeg → read output.

## Formato ASS
- Header: [Script Info], [V4+ Styles], [Events]
- PlayRes fixo: 1920×1080 (base para o calculo de `{\pos}`).
- Style: Name, Fontname, Fontsize, PrimaryColour, BackColour, Alignment, etc.
- Dialogue: Layer, Start, End, Style, Text
- Cores: formato &HAABBGGRR (hex, alpha-blue-green-red, invertido do CSS)
- Timestamps: H:MM:SS.cc (centesimos de segundo)
- Override de posicao: `{\pos(X,Y)}` no inicio do texto do Dialogue (em pixels).

## Dependencias
- `@ffmpeg/ffmpeg` — FFmpeg WASM runtime
- `@ffmpeg/util` — utilities (fetchFile, toBlobURL)
- `@/types/subtitle` — tipo Subtitle
- `@/lib/subtitle-style/types` — tipos SubtitleStyle e SubtitleAnchor

## Limitacoes
- Requer SharedArrayBuffer (COOP/COEP headers no Next.js)
- Videos grandes (>200MB) podem ser lentos ou estourar memoria
- Primeiro load do WASM ~25MB (cached depois)
- Sem suporte a fontes custom no ASS (usa fontes do sistema como fallback)
- SRT export nao suporta coordenadas — `{\pos}` so existe no ASS

## Testes
- generateAssContent gera header valido
- generateAssContent mapeia cores CSS → ASS corretamente
- generateAssContent mapeia posicoes corretamente
- generateAssContent gera timestamps no formato correto
- generateAssContent escapa caracteres especiais no texto
- generateAssContent omite `{\pos}` quando style nao tem anchor
- generateAssContent inclui `{\pos(X,Y)}` em toda Dialogue quando anchor existe
- generateAssContent escala coordenadas para 1920×1080
