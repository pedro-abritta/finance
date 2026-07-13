import { createClient } from "@/lib/supabase/client";

export async function getConfirmedTemplateIds(month: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recurring_confirmations")
    .select("recurring_template_id")
    .eq("month", month);

  if (error) throw new Error(error.message);
  return new Set((data as { recurring_template_id: string }[]).map(row => row.recurring_template_id));
}

/**
 * Returns `${recurring_template_id}|${month}` keys for every confirmation in
 * [fromMonth, toMonth], used by the client-side recurring forecast to know
 * which (template, month) pairs already have a real entry generated.
 */
export async function getConfirmedTemplateKeys(fromMonth: string, toMonth: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recurring_confirmations")
    .select("recurring_template_id, month")
    .gte("month", fromMonth)
    .lte("month", toMonth);

  if (error) throw new Error(error.message);
  return new Set(
    (data as { recurring_template_id: string; month: string }[]).map(
      row => `${row.recurring_template_id}|${row.month}`
    )
  );
}

/**
 * Reserves the (recurring_template_id, month) slot before the expense/income
 * entry is created, so concurrent calls (e.g. React StrictMode double-mount)
 * race on the UNIQUE constraint instead of both creating an entry.
 * Returns false if the slot was already claimed by another call.
 */
export async function claimConfirmation(recurringTemplateId: string, month: string): Promise<boolean> {
  const supabase = createClient();
  const { error } = await supabase.from("recurring_confirmations").insert({
    recurring_template_id: recurringTemplateId,
    month,
    confirmed_at: new Date().toISOString(),
    expense_id: null,
    income_entry_id: null,
  });

  if (!error) return true;
  if (error.code === "23505") return false;
  throw new Error(error.message);
}

export async function attachConfirmationEntry(
  recurringTemplateId: string,
  month: string,
  entry: { expenseId?: string; incomeEntryId?: string }
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("recurring_confirmations")
    .update({
      expense_id: entry.expenseId ?? null,
      income_entry_id: entry.incomeEntryId ?? null,
    })
    .eq("recurring_template_id", recurringTemplateId)
    .eq("month", month);

  if (error) throw new Error(error.message);
}
