import { Header } from "@/components/shared/Header";
import { NewEntryForm } from "@/components/feature/NewEntryForm";

export default function NovoPage() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Novo lançamento" />

      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <NewEntryForm />
        </div>
      </div>
    </div>
  );
}
