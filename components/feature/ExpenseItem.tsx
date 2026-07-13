"use client";

import { Expense } from "@/lib/types";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_COLORS } from "@/lib/constants";
import { formatCurrency, formatDayMonth, cn } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteExpense } from "@/lib/db/expenses";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ExpenseItemProps {
  expense: Expense;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ExpenseItem({ expense, onEdit, onDelete }: ExpenseItemProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const categoryLabel = EXPENSE_CATEGORIES[expense.category as keyof typeof EXPENSE_CATEGORIES];
  const dotColor = EXPENSE_CATEGORY_COLORS[expense.category] || "bg-gray-500";
  const installmentLabel =
    expense.isInstallment && expense.installmentNumber && expense.totalInstallments
      ? `parcela ${expense.installmentNumber}/${expense.totalInstallments}`
      : null;
  const purchaseDate = formatDayMonth(expense.date);

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteExpense(expense.id);
      onDelete?.();
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <div className="group flex items-center justify-between px-4 py-3 border-thin border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3 flex-1">
          <div className={cn("w-2 h-2 rounded-full flex-shrink-0", dotColor)} />
          <div className="flex-1">
            <p className="text-sm font-500 text-gray-900">{expense.description}</p>
            <p className="text-xs text-gray-500">
              {categoryLabel}
              {installmentLabel && <span className="text-gray-400"> · {installmentLabel}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-600 text-gray-900">{formatCurrency(expense.amount)}</p>
            <p className="text-xs text-gray-500">compra em {purchaseDate}</p>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-primary rounded transition-colors" title="Editar">
                  <Pencil size={13} />
                </button>
              )}
              {onDelete && (
                <button onClick={() => setConfirmOpen(true)} className="p-1.5 text-gray-400 hover:text-danger rounded transition-colors" title="Excluir">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${expense.description}"`} será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-danger hover:bg-danger/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
