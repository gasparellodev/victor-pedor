# Componentes do Editor de Legendas

## SubtitleEditor
Container principal com lista de legendas editáveis e toolbar.

## SubtitleRow
Linha individual com texto editável + timestamps start/end.

## TimestampInput
Input formatado HH:MM:SS,mmm com validação.

## EditorToolbar
Ações em lote: shift all timestamps, merge, split.

## Regras
- Cada legenda é editável inline
- Timestamps validados no formato SRT
- Ações de merge/split/delete com feedback visual
- Reducer centralizado via useSubtitleState
