"use client";

import { Header } from "@/components/shared/Header";
import { MonthSelector } from "@/components/shared/MonthSelector";
import { ExpenseItem } from "@/components/feature/ExpenseItem";
import { CardItem } from "@/components/feature/CardItem";
import { Mascot } from "@/components/shared/Mascot";
import { formatCurrency, buildUsedByCardId, cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect, useRef } from "react";
import { getExpenses } from "@/lib/db/expenses";
import { getIncomeEntries } from "@/lib/db/income-entries";
import { getCreditCards } from "@/lib/db/credit-cards";
import { getInvoices } from "@/lib/db/invoices";
import { generateDueRecurringEntries } from "@/lib/recurring-generation";
import { getRecurringTemplates } from "@/lib/db/recurring-templates";
import { getConfirmedTemplateKeys } from "@/lib/db/recurring-confirmations";
import { getRecurringForecast, type ForecastEntry } from "@/lib/recurring-forecast";
import type { Expense, IncomeEntry, CreditCard, Invoice } from "@/lib/types";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [forecast, setForecast] = useState<ForecastEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const generatedRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const ready = generatedRef.current
      ? Promise.resolve()
      : generateDueRecurringEntries().catch(() => {});

    const today = new Date();
    const todayFireMonth = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;

    ready
      .then(() => {
        generatedRef.current = true;
        return Promise.all([
          getExpenses(currentMonth.getFullYear(), currentMonth.getMonth()),
          getIncomeEntries(currentMonth.getFullYear(), currentMonth.getMonth()),
          getCreditCards(),
          getInvoices(),
          getRecurringTemplates(),
          getConfirmedTemplateKeys(todayFireMonth, todayFireMonth),
        ]);
      })
      .then(([e, inc, c, i, templates, confirmedKeys]) => {
        setExpenses(e);
        setIncomeEntries(inc);
        setCards(c);
        setInvoices(i);
        setForecast(getRecurringForecast(templates, c, confirmedKeys, today, 1));
      })
      .catch(() => setError("Erro ao carregar dados."))
      .finally(() => setLoading(false));
  }, [currentMonth]);

  const usedByCardId = buildUsedByCardId(invoices);

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const saldo = totalIncome - totalExpenses;

  const today = new Date();
  const isRealCurrentMonth =
    currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth();
  const todayFireMonth = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-01`;
  const forecastExpenseTotal = isRealCurrentMonth
    ? forecast
        .filter((f) => f.type === "expense" && f.competenceMonth === todayFireMonth)
        .reduce((sum, f) => sum + f.amount, 0)
    : 0;
  const forecastIncomeTotal = isRealCurrentMonth
    ? forecast
        .filter((f) => f.type === "income" && f.competenceMonth === todayFireMonth)
        .reduce((sum, f) => sum + f.amount, 0)
    : 0;

  const weeklyData = [
    { name: "Sem 1", valor: 0 },
    { name: "Sem 2", valor: 0 },
    { name: "Sem 3", valor: 0 },
    { name: "Sem 4", valor: 0 },
  ];
  for (const exp of expenses) {
    const day = parseInt(exp.date.slice(8, 10), 10);
    const bucket = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
    weeklyData[bucket].valor += exp.amount;
  }
  const totalCardUsage = invoices
    .filter((inv) => inv.status === "OPEN")
    .reduce((sum, inv) => sum + inv.total, 0);
  const totalCardLimit = cards.reduce((sum, card) => sum + card.limit, 0);
  const activeCards = cards.filter((card) => card.status === "ACTIVE").length;

  if (error) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Dashboard" />
        <p className="text-sm text-danger text-center mt-16">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />

      <div className="flex-1 overflow-y-auto">
        <div className="p-8 space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-white border-thin border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Faturas abertas</p>
              <h3 className="text-2xl font-600 text-gray-900">
                {formatCurrency(totalCardUsage)}
              </h3>
            </div>

            <div className="p-4 bg-white border-thin border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Despesas</p>
              <h3 className="text-2xl font-600 text-gray-900">
                {formatCurrency(totalExpenses)}
              </h3>
            </div>

            <div className="p-4 bg-white border-thin border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Cartões ativos</p>
              <h3 className="text-2xl font-600 text-gray-900">{activeCards}</h3>
            </div>

            <div className="p-4 bg-white border-thin border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Limite utilizado</p>
              <h3 className="text-2xl font-600 text-gray-900">
                {totalCardLimit > 0
                  ? `${((totalCardUsage / totalCardLimit) * 100).toFixed(0)}%`
                  : "—"}
              </h3>
            </div>
          </div>

          {/* Este mês */}
          <div className="p-6 bg-white border-thin border border-gray-200 rounded-lg">
            <h2 className="text-sm font-600 text-gray-900 mb-4">Este mês</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-xs text-gray-600 mb-2">Ganhos</p>
                    <h3 className="text-2xl font-600 text-gray-900">
                      {formatCurrency(totalIncome)}
                    </h3>
                    {forecastIncomeTotal > 0 && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        + {formatCurrency(forecastIncomeTotal)} previsto
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 rounded-md">
                    <p className="text-xs text-gray-600 mb-2">Despesas</p>
                    <h3 className="text-2xl font-600 text-gray-900">
                      {formatCurrency(totalExpenses)}
                    </h3>
                    {forecastExpenseTotal > 0 && (
                      <p className="text-[10px] text-gray-400 mt-1">
                        + {formatCurrency(forecastExpenseTotal)} previsto
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Saldo</span>
                  <span
                    className={cn(
                      "text-sm font-500",
                      saldo >= 0 ? "text-success" : "text-danger"
                    )}
                  >
                    {formatCurrency(saldo)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white border-thin border border-gray-200 rounded-lg">
              <h2 className="text-sm font-600 text-gray-900 mb-4">
                Despesas da semana
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="valor"
                    stroke="#BA7517"
                    strokeWidth={2}
                    dot={{ fill: "#BA7517", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="p-6 bg-white border-thin border border-gray-200 rounded-lg">
              <h2 className="text-sm font-600 text-gray-900 mb-4">Cartões</h2>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {cards.slice(0, 2).map((card) => {
                    const cardUsed = usedByCardId.get(card.id) ?? 0;
                    const pct = card.limit > 0 ? (cardUsed / card.limit) * 100 : 0;
                    return (
                      <div
                        key={card.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                      >
                        <span className="text-sm text-gray-900">{card.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-500 text-gray-600 w-10 text-right">
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="p-6 bg-white border-thin border border-gray-200 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-sm font-600 text-gray-900">Últimas despesas</h2>
                <MonthSelector onChange={setCurrentMonth} />
              </div>
              <button className="text-xs font-500 text-primary hover:text-primary/80 transition-colors">
                Ver todas
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : expenses.length > 0 ? (
              <div className="space-y-0">
                {expenses.slice(0, 5).map((expense) => (
                  <ExpenseItem key={expense.id} expense={expense} />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center space-y-4">
                <Mascot size="md" />
                <p className="text-sm text-gray-500">
                  Nenhuma despesa registrada neste mês
                </p>
              </div>
            )}
          </div>

          {/* Cards Grid */}
          <div className="p-6 bg-white border-thin border border-gray-200 rounded-lg">
            <h2 className="text-sm font-600 text-gray-900 mb-4">Seus cartões</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {cards.map((card) => (
                  <CardItem
                    key={card.id}
                    card={card}
                    used={usedByCardId.get(card.id) ?? 0}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
