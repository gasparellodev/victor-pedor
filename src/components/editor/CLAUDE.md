# Componentes do Editor de Legendas

## SubtitleEditor
Container principal com lista de legendas editáveis e toolbar.

## SubtitleRow
Linha individual com texto editável + timestamps start/end.

## TimestampInput
Input formatado HH:MM:SS,mmm com validação.

## EditorToolbar
Ações em lote: shift all timestamps, merge, split.

## StylePanel
Painel direito da aba "Style" do editor de vídeo. Organizado em **seções
colapsáveis** alinhadas ao visual do dribbble VisionX:

- **Position** — alignment (top/center/bottom) + readout do anchor (X%, Y%)
  + botão "Reset position" (aparece só quando anchor existe).
- **Text Style** — Font Family (dropdown), Size (px input), Weight (select).
- **Fill** — paleta restrita de 3 cores para o texto: branco, amarelo, preto.
- **Border** — slider de outline width (0–8 px), 2 swatches de cor de
  outline (preto, branco) e toggle de Background (off por padrão; quando
  on, aplica `#000000CC` para a caixa opt-in).
- **Effects** — placeholder colapsado (drop shadow / blur — futuro).
- **Format** — slider de "Limite por linha", botões "Linhas" 1/2 e botão
  destrutivo "Reformatar todas" (chama `onReformatAll` no parent).

Helper local `<Section>` controla o estado open/close de cada bloco.

## Regras
- Cada legenda é editável inline
- Timestamps validados no formato SRT
- Ações de merge/split/delete com feedback visual
- Reducer centralizado via useSubtitleState
