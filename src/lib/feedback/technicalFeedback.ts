export type TechnicalFeedbackInput = {
  moduleSlug: string;
  score: number;
  technicalFocus?: string | null;
  learningObjective?: string | null;
  sourceLesson?: string | null;
};

export function getTechnicalFeedback(input: TechnicalFeedbackInput): string {
  const moduleName =
    input.moduleSlug === "telemarketing" ? "Telemarketing" : "Técnicas de Vendas";

  const focus = input.technicalFocus || "postura profissional, comunicação e tomada de decisão";
  const objective = input.learningObjective || "melhorar a condução do atendimento";

  if (input.score >= 9) {
    return `Excelente decisão. Em ${moduleName}, essa resposta mostra domínio técnico em ${focus}. Você manteve uma postura segura, coerente com o objetivo da atividade: ${objective}.`;
  }

  if (input.score >= 7) {
    return `Boa escolha. Em ${moduleName}, sua resposta está no caminho certo, principalmente em ${focus}. Ainda dá para melhorar a precisão da fala e deixar a condução mais estratégica.`;
  }

  if (input.score >= 5) {
    return `A resposta tem pontos aproveitáveis, mas precisa de mais técnica. Observe melhor o foco da atividade: ${focus}. Antes de responder, pense no objetivo: ${objective}.`;
  }

  return `Essa resposta não foi a melhor para a situação. Em ${moduleName}, é importante evitar decisões apressadas. Reforce ${focus} e tente conduzir o cliente com mais escuta, clareza e profissionalismo.`;
}
