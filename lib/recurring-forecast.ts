import { getCompetenceMonth } from "@/lib/invoice-cycle";
import type {
  RecurringTemplate,
  CreditCard,
  RecurringType,
  ExpenseCategory,
  IncomeCategory,
} from "@/lib/types";

export interface ForecastEntry {
  templateId: string;
  type: RecurringType;
  description: string;
  category: ExpenseCategory | IncomeCategory;
  amount: number;
  fireMonth: string; // 'YYYY-MM-01' — calendar month the template would generate in
  competenceMonth: string; // 'YYYY-MM-01' — resulting competence month
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function lastDayOfMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

/**
 * Computes, without touching the database, which active recurring templates
 * would still generate an expense/income entry in the next `monthsAhead`
 * calendar months (including the current one). Mirrors the same cutoff rule
 * used by generateDueRecurringEntries (lib/recurring-generation.ts) so a
 * template stops showing up here the moment it's actually generated.
 */
export function getRecurringForecast(
  templates: RecurringTemplate[],
  cards: CreditCard[],
  confirmedKeys: Set<string>,
  today: Date = new Date(),
  monthsAhead: number = 6
): ForecastEntry[] {
  const cardsById = new Map(cards.map(c => [c.id, c]));
  const entries: ForecastEntry[] = [];

  for (let i = 0; i < monthsAhead; i++) {
    const target = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const year = target.getFullYear();
    const month1to12 = target.getMonth() + 1;
    const fireMonth = `${year}-${pad(month1to12)}-01`;

    for (const t of templates) {
      if (!t.active) continue;
      if (i === 0 && t.dayOfMonth <= today.getDate()) continue;
      if (confirmedKeys.has(`${t.id}|${fireMonth}`)) continue;

      const day = Math.min(t.dayOfMonth, lastDayOfMonth(year, month1to12));
      const date = `${year}-${pad(month1to12)}-${pad(day)}`;
      const card = t.cardId ? cardsById.get(t.cardId) : undefined;
      const competenceMonth = getCompetenceMonth(date, t.paymentMethod ?? "PIX", card);

      entries.push({
        templateId: t.id,
        type: t.type,
        description: t.description,
        category: t.category,
        amount: t.amount,
        fireMonth,
        competenceMonth,
      });
    }
  }

  return entries;
}
