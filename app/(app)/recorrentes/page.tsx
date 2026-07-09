"use client";

import { useEffect, useState } from "react";
import { getRecurringTemplates } from "@/lib/db/recurring-templates";
import { getCreditCards } from "@/lib/db/credit-cards";
import { RecurringTemplateItem } from "@/components/feature/RecurringTemplateItem";
import { RecurringTemplateDialog } from "@/components/feature/RecurringTemplateDialog";
import type { RecurringTemplate, RecurringType, CreditCard } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function RecorrentesPage() {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RecurringType>("expense");

  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | undefined>(undefined);
  const [templateDialogDefaultType, setTemplateDialogDefaultType] = useState<RecurringType>("expense");

  async function reloadTemplates() {
    try {
      const data = await getRecurringTemplates();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar templates.");
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [templateData, cardData] = await Promise.all([
          getRecurringTemplates(),
          getCreditCards(),
        ]);
        setTemplates(templateData);
        setCards(cardData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function openEditTemplate(template: RecurringTemplate) {
    setEditingTemplate(template);
    setTemplateDialogDefaultType(template.type);
    setTemplateDialogOpen(true);
  }

  const filtered = templates.filter(t => t.type === activeTab);

  const tabs: { value: RecurringType; label: string }[] = [
    { value: "expense", label: "Despesas" },
    { value: "income", label: "Renda" },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-6 py-5 border-thin border-b border-gray-200">
        <h1 className="text-lg font-500 text-gray-900">Recorrentes</h1>
        <p className="text-xs text-gray-500 mt-0.5">Templates de despesas e renda mensais</p>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 pb-2 flex gap-2">
        {tabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-4 py-1.5 text-sm rounded-full transition-colors",
              activeTab === tab.value
                ? "bg-primary-light text-primary font-500"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-2">
        {loading && (
          <p className="text-sm text-gray-500 py-8 text-center">Carregando...</p>
        )}

        {!loading && error && (
          <p className="text-sm text-danger py-8 text-center">{error}</p>
        )}

        {!loading && !error && (
          <div className="bg-white border-thin border border-gray-200 rounded-lg overflow-hidden">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center">Nenhum template cadastrado.</p>
            ) : (
              filtered.map(template => (
                <RecurringTemplateItem
                  key={template.id}
                  template={template}
                  onEdit={() => openEditTemplate(template)}
                  onDelete={reloadTemplates}
                  onToggle={reloadTemplates}
                />
              ))
            )}
          </div>
        )}
      </div>

      <RecurringTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        template={editingTemplate}
        defaultType={templateDialogDefaultType}
        cards={cards}
        onSuccess={reloadTemplates}
      />
    </div>
  );
}
