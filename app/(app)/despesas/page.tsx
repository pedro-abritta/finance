"use client";

import { Header } from "@/components/shared/Header";
import { MonthSelector } from "@/components/shared/MonthSelector";
import { ExpenseItem } from "@/components/feature/ExpenseItem";
import { ExpenseDialog } from "@/components/feature/ExpenseDialog";
import { ForecastItem } from "@/components/feature/ForecastItem";
import { Mascot } from "@/components/shared/Mascot";
import { formatCurrency } from "@/lib/utils";
import { Plus } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { getExpenses } from "@/lib/db/expenses";
import { getRecurringTemplates } from "@/lib/db/recurring-templates";
import { getCreditCards } from "@/lib/db/credit-cards";
import { getConfirmedTemplateKeys } from "@/lib/db/recurring-confirmations";
import { getRecurringForecast, type ForecastEntry } from "@/lib/recurring-forecast";
import type { Expense } from "@/lib/types";

const MONTHS_AHEAD = 6;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function Despesas() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [forecast, setForecast] = useState<ForecastEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | undefined>();

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    const today = new Date();
    const horizonEnd = new Date(today.getFullYear(), today.getMonth() + MONTHS_AHEAD - 1, 1);
    const fromMonth = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
    const toMonth = `${horizonEnd.getFullYear()}-${pad(horizonEnd.getMonth() + 1)}-01`;

    Promise.all([
      getExpenses(currentMonth.getFullYear(), currentMonth.getMonth()),
      getRecurringTemplates(),
      getCreditCards(),
      getConfirmedTemplateKeys(fromMonth, toMonth),
    ])
      .then(([exp, templates, cards, confirmedKeys]) => {
        setExpenses(exp);
        setForecast(getRecurringForecast(templates, cards, confirmedKeys, today, MONTHS_AHEAD));
      })
      .catch(() => setError("Erro ao carregar despesas."))
      .finally(() => setLoading(false));
  }, [currentMonth]);

  useEffect(() => { refresh(); }, [refresh]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const selectedCompetenceMonth = `${currentMonth.getFullYear()}-${pad(currentMonth.getMonth() + 1)}-01`;
  const forecastedExpenses = forecast.filter(
    (e) => e.type === "expense" && e.competenceMonth === selectedCompetenceMonth
  );

  return (
    <div className="flex flex-col h-full">
      <Header title="Despesas" />

      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-8 p-6 bg-white border-thin border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-6">
              <MonthSelector onChange={setCurrentMonth} />
              <button
                onClick={() => { setEditingExpense(undefined); setDialogOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm font-500"
              >
                <Plus size={16} />
                Nova despesa
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Total do mês</p>
              <h2 className="text-3xl font-600 text-gray-900">{formatCurrency(totalExpenses)}</h2>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-danger text-center py-8">{error}</p>
          ) : expenses.length > 0 ? (
            <div className="bg-white border-thin border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-thin border-b border-gray-200">
                <p className="text-xs font-600 text-gray-600 uppercase">
                  {expenses.length} despesa{expenses.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {expenses.map((expense) => (
                  <ExpenseItem
                    key={expense.id}
                    expense={expense}
                    onEdit={() => { setEditingExpense(expense); setDialogOpen(true); }}
                    onDelete={refresh}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white border-thin border border-gray-200 rounded-lg">
              <Mascot size="lg" />
              <p className="text-sm text-gray-500 mt-4">Nenhuma despesa registrada neste mês</p>
            </div>
          )}

          {!loading && !error && forecastedExpenses.length > 0 && (
            <div className="mt-6 bg-white border-thin border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-thin border-b border-gray-200">
                <p className="text-xs font-600 text-gray-600 uppercase">
                  {forecastedExpenses.length} previsto{forecastedExpenses.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {forecastedExpenses.map((entry) => (
                  <ForecastItem key={entry.templateId} entry={entry} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ExpenseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        expense={editingExpense}
        onSuccess={refresh}
      />
    </div>
  );
}
