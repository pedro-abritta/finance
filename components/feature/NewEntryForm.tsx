"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createExpense, createInstallmentGroup } from "@/lib/db/expenses";
import { createIncomeEntry } from "@/lib/db/income-entries";
import { createRecurringTemplate } from "@/lib/db/recurring-templates";
import { getCreditCards } from "@/lib/db/credit-cards";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { RecurringType, CreditCard, PaymentMethod, ExpenseCategory, IncomeCategory } from "@/lib/types";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "PIX", label: "PIX" },
  { value: "DEBITO", label: "Débito" },
  { value: "CREDITO", label: "Crédito" },
  { value: "BOLETO", label: "Boleto" },
];

const input = "w-full px-3 py-2 text-sm border border-gray-200 rounded-md outline-none focus:border-primary transition-colors";
const label = "text-xs text-gray-600 block mb-1";

function ChipToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-4 py-1.5 text-sm rounded-full transition-colors",
            value === opt.value
              ? "bg-primary-light text-primary font-500"
              : "text-gray-600 border border-gray-200 hover:bg-gray-50"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function NewEntryForm() {
  const [entryType, setEntryType] = useState<RecurringType>("expense");
  const [isRecurring, setIsRecurring] = useState(false);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>(Object.keys(EXPENSE_CATEGORIES)[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dayOfMonth, setDayOfMonth] = useState("1");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [cardId, setCardId] = useState("");
  const [isDeductible, setIsDeductible] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState("2");

  const [cards, setCards] = useState<CreditCard[]>([]);
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getCreditCards()
      .then(setCards)
      .catch(() => {})
      .finally(() => setCardsLoaded(true));
  }, []);

  const noCardsForExpense = entryType === "expense" && cardsLoaded && cards.length === 0;

  const categoryOptions = entryType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  useEffect(() => {
    setCategory(Object.keys(categoryOptions)[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryType]);

  useEffect(() => {
    if (isRecurring) setIsInstallment(false);
  }, [isRecurring]);

  function resetAfterSuccess() {
    setDescription("");
    setAmount("");
    setCategory(Object.keys(categoryOptions)[0]);
    setDate(new Date().toISOString().slice(0, 10));
    setDayOfMonth("1");
    setPaymentMethod("PIX");
    setCardId("");
    setIsDeductible(false);
    setIsInstallment(false);
    setTotalInstallments("2");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedAmount = parseFloat(amount);
    const parsedDay = parseInt(dayOfMonth);

    if (!description.trim()) {
      setError("Descrição é obrigatória.");
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError("Valor deve ser maior que zero.");
      return;
    }
    if (!category) {
      setError("Selecione uma categoria.");
      return;
    }
    if (noCardsForExpense) {
      setError("Cadastre um cartão antes de registrar uma despesa.");
      return;
    }
    if (entryType === "expense" && paymentMethod === "CREDITO" && !cardId) {
      setError("Selecione um cartão para despesas no crédito.");
      return;
    }
    if (isRecurring && (!parsedDay || parsedDay < 1 || parsedDay > 31)) {
      setError("Dia deve estar entre 1 e 31.");
      return;
    }
    if (!isRecurring && !date) {
      setError("Data é obrigatória.");
      return;
    }

    setSubmitting(true);
    try {
      if (isRecurring) {
        await createRecurringTemplate({
          type: entryType,
          description: description.trim(),
          category,
          amount: parsedAmount,
          dayOfMonth: parsedDay,
          ...(entryType === "expense" && {
            paymentMethod,
            cardId: paymentMethod === "CREDITO" ? cardId : undefined,
            isDeductible,
          }),
        });
        setSuccess("Template criado.");
      } else if (entryType === "expense") {
        const base = {
          description: description.trim(),
          category: category as ExpenseCategory,
          amount: parsedAmount,
          date,
          paymentMethod,
          isDeductible,
          cardId: cardId || undefined,
        };
        if (isInstallment) {
          await createInstallmentGroup(base, parseInt(totalInstallments));
        } else {
          await createExpense({ ...base, isInstallment: false });
        }
        setSuccess("Despesa salva.");
      } else {
        await createIncomeEntry({
          description: description.trim(),
          amount: parsedAmount,
          date,
          category: category as IncomeCategory,
        });
        setSuccess("Ganho salvo.");
      }
      resetAfterSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 bg-white border-thin border border-gray-200 rounded-lg max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={label}>Tipo</label>
          <ChipToggle
            options={[
              { value: "expense" as RecurringType, label: "Despesa" },
              { value: "income" as RecurringType, label: "Ganho" },
            ]}
            value={entryType}
            onChange={setEntryType}
          />
        </div>

        <div>
          <label className={label}>Recorrente</label>
          <ChipToggle
            options={[
              { value: "no", label: "Não" },
              { value: "yes", label: "Sim" },
            ]}
            value={isRecurring ? "yes" : "no"}
            onChange={v => setIsRecurring(v === "yes")}
          />
        </div>

        <div>
          <label className={label}>Descrição</label>
          <input
            className={input}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={entryType === "expense" ? "Ex: Aluguel" : "Ex: Salário"}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label}>Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className={input}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={label}>Categoria</label>
            <select className={input} value={category} onChange={e => setCategory(e.target.value)}>
              {Object.entries(categoryOptions).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        {isRecurring ? (
          <div>
            <label className={label}>Dia do mês</label>
            <input
              type="number"
              min="1"
              max="31"
              className={input}
              value={dayOfMonth}
              onChange={e => setDayOfMonth(e.target.value)}
              required
            />
          </div>
        ) : (
          <div>
            <label className={label}>Data</label>
            <input
              type="date"
              className={input}
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
        )}

        {entryType === "expense" && (
          <>
            <div>
              <label className={label}>Pagamento</label>
              <select
                className={input}
                value={paymentMethod}
                onChange={e => {
                  const pm = e.target.value as PaymentMethod;
                  setPaymentMethod(pm);
                  if (pm !== "CREDITO") setIsInstallment(false);
                }}
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {cards.length > 0 && (
              <div>
                <label className={label}>Cartão/Conta</label>
                <select className={input} value={cardId} onChange={e => setCardId(e.target.value)}>
                  <option value="">Selecione um cartão</option>
                  {cards.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ••{c.lastFourDigits}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDeductible}
                  onChange={e => setIsDeductible(e.target.checked)}
                  className="accent-primary"
                />
                Dedutível no IR
              </label>

              {!isRecurring && paymentMethod === "CREDITO" && (
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={e => setIsInstallment(e.target.checked)}
                    className="accent-primary"
                  />
                  Parcelado
                </label>
              )}
            </div>

            {isInstallment && !isRecurring && paymentMethod === "CREDITO" && (
              <div>
                <label className={label}>Número de parcelas</label>
                <input
                  type="number"
                  min="2"
                  max="48"
                  className={input}
                  value={totalInstallments}
                  onChange={e => setTotalInstallments(e.target.value)}
                />
              </div>
            )}

            {noCardsForExpense && (
              <p className="text-xs text-danger">
                Cadastre um cartão antes de registrar uma despesa.{" "}
                <Link href="/cartoes" className="underline font-500">
                  Ir para Cartões
                </Link>
              </p>
            )}
          </>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}
        {success && <p className="text-xs text-success">{success}</p>}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting || noCardsForExpense}
            className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? "Salvando..." : isRecurring ? "Criar template" : "Lançar"}
          </button>
        </div>
      </form>
    </div>
  );
}
