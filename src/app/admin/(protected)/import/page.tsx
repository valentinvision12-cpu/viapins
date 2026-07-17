import { SeedImportForm } from "@/components/admin/seed-import-form";
import { FileJson } from "lucide-react";

export default function ImportPage() {
  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[oklch(0.72_0.13_82)]/15 flex items-center justify-center">
            <FileJson className="w-5 h-5 text-[oklch(0.72_0.13_82)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Качи държава</h1>
            <p className="text-white/40 text-sm">
              Ръчен import — или кажи на Cursor agent да качи вместо теб
            </p>
          </div>
        </div>
      </div>

      <SeedImportForm />
    </div>
  );
}
