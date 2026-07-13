import type { ForecastEntry } from "@/lib/recurring-forecast";
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_COLORS } from "@/lib/constants";
import { formatCurrency, cn } from "@/lib/utils";

interface ForecastItemProps {
  entry: ForecastEntry;
}

export function ForecastItem({ entry }: ForecastItemProps) {
  const categoryLabel = EXPENSE_CATEGORIES[entry.category as keyof typeof EXPENSE_CATEGORIES];
  const dotColor = EXPENSE_CATEGORY_COLORS[entry.category] || "bg-gray-500";

  return (
    <div className="flex items-center justify-between px-4 py-3 border-thin border-b border-gray-100 last:border-b-0 opacity-60">
      <div className="flex items-center gap-3 flex-1">
        <div className={cn("w-2 h-2 rounded-full flex-shrink-0", dotColor)} />
        <div className="flex-1">
          <p className="text-sm font-500 text-gray-900">{entry.description}</p>
          <p className="text-xs text-gray-500">{categoryLabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-sm font-600 text-gray-900">{formatCurrency(entry.amount)}</p>
        <span className="text-xs font-500 px-2 py-1 rounded-full bg-primary-light text-primary">
          Previsto
        </span>
      </div>
    </div>
  );
}
