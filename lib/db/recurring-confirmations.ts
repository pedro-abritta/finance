import { createClient } from "@/lib/supabase/client";

export interface CreateConfirmationInput {
  recurringTemplateId: string;
  month: string;
  expenseId?: string;
  incomeEntryId?: string;
}

export async function getConfirmedTemplateIds(month: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recurring_confirmations")
    .select("recurring_template_id")
    .eq("month", month);

  if (error) throw new Error(error.message);
  return new Set((data as { recurring_template_id: string }[]).map(row => row.recurring_template_id));
}

export async function createConfirmation(input: CreateConfirmationInput): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("recurring_confirmations").insert({
    recurring_template_id: input.recurringTemplateId,
    month: input.month,
    confirmed_at: new Date().toISOString(),
    expense_id: input.expenseId ?? null,
    income_entry_id: input.incomeEntryId ?? null,
  });

  if (error) throw new Error(error.message);
}
