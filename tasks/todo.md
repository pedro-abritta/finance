# Phase 4 — Section 4.1: Schema + TypeScript types ✅

Todos os itens concluídos. Schema validado, RLS confirmado, build limpo.

---

# Phase 4 — Section 4.2: Tela /recorrentes (CRUD de templates) ✅

Tela completa entregue. Templates de despesa e renda gerenciados via duas abas. Dois bugs de schema corrigidos via ALTER TABLE no Supabase (`payment_method` DROP NOT NULL, DROP FK de categoria).

**Arquivos criados/modificados:**
- `components/shared/Sidebar.tsx` — link Recorrentes adicionado
- `components/feature/RecurringTemplateItem.tsx` — item com toggle, edit, delete
- `components/feature/RecurringTemplateDialog.tsx` — dialog com campos condicionais por type
- `app/(app)/recorrentes/page.tsx` — página com abas chip-style

**Next:** Section 4.3 — confirmação mensal de recorrentes + lançamento de renda.

---

# Phase 4 — Section 4.3: Confirmação mensal de recorrentes (revertido)

Implementação original: fluxo de confirmação manual mensal (aba "Este mês" em `/recorrentes`, `ConfirmTemplateDialog`, `recurring_confirmations`) + lançamento avulso de renda via dialog dedicado.

**Pivô de escopo:** o fluxo de confirmação manual e o dialog de lançamento de renda foram removidos. Lançamento avulso (despesa/renda, único ou recorrente) passou a ser coberto pela página `/novo` (`NewEntryForm`), tornando a confirmação manual redundante.

**Removido:**
- Aba "Este mês" e toda a lógica de confirmação (`app/(app)/recorrentes/page.tsx`)
- `components/feature/ConfirmTemplateDialog.tsx` (deletado)
- `components/feature/IncomeEntryDialog.tsx` (deletado — redundante com `/novo`)
- `lib/db/recurring-confirmations.ts` (deletado — sem consumidores)
- `RecurringConfirmation` em `lib/types.ts` (deletado)
- Botão "Lançar renda"

**Mantido em `/recorrentes`:** lista de templates (abas Despesas/Renda), toggle ativar/desativar, editar, excluir.

**Nota:** a tabela `recurring_confirmations` permanece no schema do Supabase (não foi dropada) — apenas o código client não a referencia mais.

---

**Seção 4.3 encerrada com escopo reduzido.** Próximo: revisar Fase 5 (Dashboard) quando aprovado.

---

# Phase 4 — Seção C: Geração automática de recorrentes

**Lógica:** ao criar um template recorrente (`/novo`), nenhum lançamento é criado imediatamente — só o template. A geração roda ao carregar o dashboard: para cada template ativo, se `day_of_month <= dia atual do mês corrente` e ainda não existe `recurring_confirmations` para template+mês, cria a despesa/renda e registra a confirmação. Templates com `day_of_month` futuro não geram nada ainda (previsto, não realizado).

**Verificado antes de implementar:** `NewEntryForm.tsx` já chamava só `createRecurringTemplate` para recorrentes — nenhuma mudança necessária lá.

**Schema `recurring_confirmations` (confirmado pelo usuário):** `id`, `user_id`, `recurring_template_id`, `month` (date, `YYYY-MM-01`), `confirmed_at` (timestamptz), `expense_id` (nullable), `income_entry_id` (nullable).

**Arquivos:**
- [x] `lib/db/recurring-confirmations.ts` — recriado: `getConfirmedTemplateIds(month)` e `createConfirmation(...)`.
- [x] `lib/recurring-generation.ts` — novo: `generateDueRecurringEntries()`, filtra templates ativos + `dayOfMonth <= dia atual` + sem confirmação no mês, cria despesa/renda e grava confirmação.
- [x] `app/(app)/page.tsx` — dashboard chama `generateDueRecurringEntries()` uma vez por montagem (guardado por `useRef`), antes do primeiro fetch de despesas do mês corrente, para os itens gerados aparecerem já na carga inicial.
- [x] `npx tsc --noEmit` e `npm run lint` limpos.

**Pendente de verificação manual:** rodar `npm run dev`, criar um template com `day_of_month <= hoje`, confirmar que aparece uma despesa/renda no dashboard e uma linha em `recurring_confirmations`; criar outro com `day_of_month` futuro e confirmar que nada é gerado.
