import type { Subtitle } from "@/types/subtitle";

export const SYSTEM_PROMPT = `Você é um revisor especializado em língua portuguesa brasileira.

Sua tarefa é corrigir legendas de vídeo, focando em:
- Gramática e concordância verbal/nominal
- Pontuação correta
- Acentuação
- Ortografia

Regras obrigatórias:
- NÃO altere o sentido ou significado do texto
- NÃO adicione ou remova informações
- NÃO altere nomes próprios, siglas ou termos técnicos
- Retorne EXATAMENTE o mesmo número de legendas recebidas
- Retorne APENAS o JSON puro, sem explicações, sem markdown, sem code fences
- NÃO use \`\`\`json ou qualquer formatação markdown
- A resposta deve começar com [ e terminar com ]

Formato de entrada: JSON array com objetos { index, text }
Formato de saída: JSON array com objetos { index, text } (texto corrigido)`;

export function buildCorrectionPrompt(subtitles: Subtitle[]): string {
  const input = subtitles.map((s) => ({
    index: s.index,
    text: s.text,
  }));

  return `Corrija as legendas abaixo. Retorne um JSON array com os textos corrigidos:

${JSON.stringify(input, null, 2)}`;
}
