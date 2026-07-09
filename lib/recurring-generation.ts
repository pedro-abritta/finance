import { getRecurringTemplates } from "@/lib/db/recurring-templates";
import { getConfirmedTemplateIds, createConfirmation } from "@/lib/db/recurring-confirmations";
import { createExpense } from "@/lib/db/expenses";
import { createIncomeEntry } from "@/lib/db/income-entries";
import type { ExpenseCategory, IncomeCategory, PaymentMethod } from "@/lib/types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export async function generateDueRecurringEntries(): Promise<void> {
  const today = new Date();
  const year = today.getFullYear();
  const monthNumber = today.getMonth() + 1;
  const day = today.getDate();
  const month = `${year}-${pad(monthNumber)}-01`;

  const [templates, confirmedIds] = await Promise.all([
    getRecurringTemplates(),
    getConfirmedTemplateIds(month),
  ]);

  const due = templates.filter(
    t => t.active && t.dayOfMonth <= day && !confirmedIds.has(t.id)
  );

  for (const template of due) {
    const date = `${year}-${pad(monthNumber)}-${pad(template.dayOfMonth)}`;

    if (template.type === "expense") {
      const expense = await createExpense({
        description: template.description,
        category: template.category as ExpenseCategory,
        amount: template.amount,
        date,
        paymentMethod: template.paymentMethod as PaymentMethod,
        isDeductible: template.isDeductible,
        cardId: template.cardId,
        isInstallment: false,
      });
      await createConfirmation({ recurringTemplateId: template.id, month, expenseId: expense.id });
    } else {
      const income = await createIncomeEntry({
        description: template.description,
        amount: template.amount,
        date,
        category: template.category as IncomeCategory,
        recurringTemplateId: template.id,
      });
      await createConfirmation({ recurringTemplateId: template.id, month, incomeEntryId: income.id });
    }
  }
}
