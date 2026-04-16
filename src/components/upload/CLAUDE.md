# Componentes de Upload

## UploadDropzone
Zona de drag & drop e click para upload de vídeo. Valida tipo e tamanho client-side antes de enviar.

## UploadProgress
Barra de progresso com etapas do pipeline: Upload → Transcrição → Correção.

## Props
```typescript
// UploadDropzone
interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

// UploadProgress
interface UploadProgressProps {
  stage: PipelineStage;
  progress: number;
}
```

## Regras
- Aceitar apenas video/mp4, video/webm, video/quicktime
- Mostrar mensagem clara de erro para arquivos inválidos
- Feedback visual no drag over
