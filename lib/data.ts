import type { Area, Person, Priority, PriorityId, Status, Task } from "./types";

export const STATUSES: Status[] = [
  { id: "discovery", name: "Discovery", sub: "Pesquisa / ideia", color: "#64748B", soft: "#EEF1F5", light: true },
  { id: "backlog", name: "Backlog", sub: "No radar, sem prazo", color: "#7C8598", soft: "#F0F2F5", light: true },
  { id: "planejado", name: "Planejado", sub: "Na esteira", color: "#6366F1", soft: "#ECEDFE" },
  { id: "execucao", name: "Em execução", sub: "Sendo feito", color: "#F97316", soft: "#FEF0E4" },
  { id: "validacao", name: "Em validação", sub: "Em conferência", color: "#A855F7", soft: "#F5ECFE" },
  { id: "pronto", name: "Pronto p/ entrega", sub: "Aguardando", color: "#CA9A00", soft: "#FBF3D6" },
  { id: "entregue", name: "Entregue", sub: "No ar / oficializado", color: "#10B981", soft: "#E3F7EF" },
];

export const AREAS: Area[] = [
  { id: "dev", name: "Desenvolvimento", color: "#F97316" },
  { id: "juridico", name: "Jurídico", color: "#3B82F6" },
  { id: "cobranca", name: "Cobrança", color: "#8B5CF6" },
  { id: "financeiro", name: "Financeiro", color: "#10B981" },
  { id: "parcerias", name: "Parcerias", color: "#EC4899" },
];

export const PHASES: string[] = [
  "v1.0 · Base sólida",
  "v2.0 · Reter & renegociar",
  "v3.0 · Receita recorrente",
  "v4.0 · Plataforma financeira",
];

export const PRIO: Record<PriorityId, Priority> = {
  alta: { label: "Alta", bg: "#FDE4DE", text: "#D14328" },
  media: { label: "Média", bg: "#FEF0D8", text: "#B4700A" },
  baixa: { label: "Baixa", bg: "#EBEEF2", text: "#5B6472" },
};

export const TASKS: Task[] = [
  { id: "t1", desc: "Desenvolver 2ª via de boleto e histórico de pagamentos", area: "dev", phase: PHASES[0], who: "Rafael Soares", prio: "alta", status: "execucao", start: "2026-07-01", end: "2026-08-15", dep: "" },
  { id: "t2", desc: "Criar acompanhamento de obra com fotos por etapa", area: "dev", phase: PHASES[0], who: "Victor", prio: "media", status: "validacao", start: "2026-07-05", end: "2026-08-10", dep: "" },
  { id: "t3", desc: "Publicar central de documentos (contrato, comprovantes)", area: "dev", phase: PHASES[0], who: "Rafael Soares", prio: "media", status: "pronto", start: "2026-06-20", end: "2026-07-30", dep: "" },
  { id: "t4", desc: "Implantar login CPF + WhatsApp com consentimento LGPD", area: "dev", phase: PHASES[0], who: "Victor", prio: "alta", status: "entregue", start: "2026-06-01", end: "2026-06-28", dep: "" },
  { id: "t5", desc: "Emitir parecer sobre cobrança acolhedora (CDC art. 42)", area: "juridico", phase: PHASES[1], who: "Jurídico", prio: "alta", status: "planejado", start: "2026-08-01", end: "2026-08-20", dep: "" },
  { id: "t6", desc: "Homologar régua de renegociação e mínimo existencial", area: "cobranca", phase: PHASES[1], who: "", prio: "media", status: "backlog", start: "", end: "", dep: "depende de parecer jurídico" },
  { id: "t7", desc: "Estruturar FIDC próprio p/ recapturar spread do pró-soluto", area: "financeiro", phase: PHASES[2], who: "", prio: "alta", status: "discovery", start: "", end: "", dep: "validação jurídica + cota subordinada" },
  { id: "t8", desc: "Fechar parceiro emissor do cartão Meu INC (powered by)", area: "parcerias", phase: PHASES[2], who: "", prio: "alta", status: "execucao", start: "2026-09-01", end: "2026-11-30", dep: "depende de definição de BaaS" },
  { id: "t9", desc: "Pesquisar consórcio white label via administradora autorizada", area: "parcerias", phase: PHASES[3], who: "", prio: "baixa", status: "discovery", start: "", end: "", dep: "" },
  { id: "t10", desc: "Simular renegociação digital com proposta na hora", area: "dev", phase: PHASES[1], who: "Victor", prio: "media", status: "planejado", start: "2026-08-15", end: "2026-09-30", dep: "depende de homologação de régua" },
  { id: "t11", desc: "Implementar push de lembrete de vencimento de parcela", area: "dev", phase: PHASES[0], who: "Rafael Soares", prio: "alta", status: "execucao", start: "2026-07-10", end: "2026-08-05", dep: "" },
  { id: "t12", desc: "Publicar tela inicial com resumo do contrato do cliente", area: "dev", phase: PHASES[0], who: "Victor", prio: "media", status: "entregue", start: "2026-05-20", end: "2026-06-15", dep: "" },
  { id: "t13", desc: "Criar chat de atendimento in-app com histórico", area: "dev", phase: PHASES[1], who: "", prio: "media", status: "backlog", start: "", end: "", dep: "" },
  { id: "t14", desc: "Integrar assinatura eletrônica de aditivos contratuais", area: "dev", phase: PHASES[1], who: "Rafael Soares", prio: "alta", status: "planejado", start: "2026-09-01", end: "2026-10-10", dep: "" },
  { id: "t15", desc: "Revisar termos de uso e política de privacidade (LGPD)", area: "juridico", phase: PHASES[0], who: "Jurídico", prio: "alta", status: "entregue", start: "2026-05-05", end: "2026-05-30", dep: "" },
  { id: "t16", desc: "Analisar viabilidade regulatória do FIDC próprio", area: "juridico", phase: PHASES[2], who: "Jurídico", prio: "media", status: "discovery", start: "", end: "", dep: "aguarda estruturação financeira" },
  { id: "t17", desc: "Implantar régua de comunicação amigável (D+5, D+15, D+30)", area: "cobranca", phase: PHASES[1], who: "", prio: "media", status: "execucao", start: "2026-08-01", end: "2026-09-15", dep: "" },
  { id: "t18", desc: "Testar acordo parcelado self-service no app", area: "cobranca", phase: PHASES[1], who: "Victor", prio: "media", status: "validacao", start: "2026-08-20", end: "2026-09-20", dep: "" },
  { id: "t19", desc: "Automatizar conciliação de recebíveis com o banco", area: "financeiro", phase: PHASES[2], who: "", prio: "alta", status: "planejado", start: "2026-10-01", end: "2026-11-30", dep: "depende de API do banco" },
  { id: "t20", desc: "Estudar antecipação de recebíveis para o cliente", area: "financeiro", phase: PHASES[3], who: "", prio: "baixa", status: "discovery", start: "", end: "", dep: "" },
  { id: "t21", desc: "Mapear parceiros de seguro residencial (bundle)", area: "parcerias", phase: PHASES[2], who: "", prio: "baixa", status: "backlog", start: "", end: "", dep: "" },
  { id: "t22", desc: "Avaliar marketplace de serviços para o morador", area: "parcerias", phase: PHASES[3], who: "", prio: "baixa", status: "discovery", start: "", end: "", dep: "" },
  { id: "t23", desc: "Criar carteira digital Meu INC (saldo e extrato)", area: "dev", phase: PHASES[2], who: "Victor", prio: "alta", status: "planejado", start: "2026-10-15", end: "2026-12-20", dep: "depende de parceiro emissor" },
  { id: "t24", desc: "Disponibilizar segunda via de contrato em PDF", area: "dev", phase: PHASES[0], who: "Rafael Soares", prio: "media", status: "pronto", start: "2026-06-25", end: "2026-07-25", dep: "" },
];

/** [nome, papel, responsabilidade] */
export const PEOPLE_RAW: [string, string, string][] = [
  ["Gustavo", "Product Owner · dono do quadro", "Decide o quê e a prioridade; mantém as três camadas; monta o report do Edinho."],
  ["Rafael Brasil", "Planejamento & Estratégia", "Cronograma, dependências, riscos e evolução da estratégia."],
  ["Diogo", "Tech Lead", "Coordena tecnicamente os devs no dia a dia."],
  ["Felipe Martins", "Diretor de TI · Patrocinador técnico", "Define tecnologia e estratégia técnica do app."],
  ["Rafael Soares", "Desenvolvedor", "Executa tarefas de desenvolvimento."],
  ["Victor", "Desenvolvedor", "Executa tarefas de desenvolvimento."],
  ["Edinho", "Patrocinador (Sponsor)", "Presidente e investidor; recebe reporte e decisões-chave."],
  ["A definir", "Representante · Jurídico", "Ponto focal do jurídico no projeto."],
  ["A definir", "Representante · Cobrança", "Ponto focal de cobrança no projeto."],
  ["A definir", "Representante · Financeiro", "Ponto focal do financeiro no projeto."],
];

export const AV_PALETTE = [
  "#5B5BF5", "#3B82F6", "#8B5CF6", "#F97316", "#10B981",
  "#EC4899", "#CA9A00", "#64748B", "#0EA5E9", "#14B8A6",
];
