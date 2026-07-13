export const INCOME_CATEGORIES = {
  SALARIO: "Salário",
  FREELANCE: "Freela",
  BONUS: "Bônus",
  ALUGUEL: "Aluguel recebido",
  INVESTIMENTO: "Rendimentos",
  OUTROS: "Outros",
} as const;

export const EXPENSE_CATEGORIES = {
  ALIMENTACAO: "Alimentação",
  TRANSPORTE: "Transporte",
  SAUDE: "Saúde",
  EDUCACAO: "Educação",
  LAZER: "Lazer",
  MORADIA: "Moradia",
  UTILIDADES: "Utilidades",
  TELEFONE: "Telefone",
  SEGUROS: "Seguros",
  DIVERSOS: "Diversos",
} as const;

export const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  ALIMENTACAO: "bg-blue-500",
  TRANSPORTE: "bg-green-500",
  SAUDE: "bg-red-500",
  EDUCACAO: "bg-yellow-500",
  LAZER: "bg-purple-500",
  MORADIA: "bg-orange-500",
  UTILIDADES: "bg-cyan-500",
  TELEFONE: "bg-pink-500",
  SEGUROS: "bg-indigo-500",
  DIVERSOS: "bg-gray-500",
};

export const IR_CATEGORIES = {
  ALUGUEL: "Aluguel",
  MATERIAL: "Material de Consumo",
  EDUCACAO: "Educação",
  SAUDE: "Saúde",
  DESPESAS_VIAGEM: "Despesas de Viagem",
  PROFISSIONAL: "Material Profissional",
  OUTROS: "Outros",
} as const;

export const DOCUMENT_STATUS = {
  PENDING: "Pendente",
  ORGANIZED: "Organizado",
  USED: "Utilizado",
} as const;

export const CARD_STATUS = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  BLOCKED: "Bloqueado",
} as const;

export const INVOICE_STATUS = {
  OPEN: "Aberta",
  CLOSED: "Fechada",
  PAID: "Paga",
} as const;

export const INVOICE_STATUS_COLOR: Record<string, string> = {
  OPEN: "bg-info text-white",
  CLOSED: "bg-warning text-white",
  PAID: "bg-success text-white",
};
