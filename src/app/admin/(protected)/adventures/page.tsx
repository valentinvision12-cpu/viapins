import { Compass } from "lucide-react";
import { readdirSync } from "fs";
import { join } from "path";
import { getAdventuresForAdmin } from "@/actions/admin-adventure";
import { AdventuresAdminList } from "@/components/admin/adventures-admin-list";

export const metadata = { title: "Adventures" };

function listSeedSlugs(): string[] {
  try {
    const dir = join(process.cwd(), "data", "seeds");
    return readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(/\.json$/, ""));
  } catch {
    return [];
  }
}

export default async function AdventuresAdminPage() {
  const adventures = await getAdventuresForAdmin();
  const seedAvailable = listSeedSlugs();

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2.5 mb-6">
        <Compass className="w-5 h-5 text-orange-500" />
        <h1 className="text-xl font-bold text-gray-900">Adventures</h1>
        <span className="text-sm text-gray-400">({adventures.length})</span>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        Road trip маршрути по държава — 10 спирки, отделно от градските Top 10.
        Кликни за редакция на спирките.
      </p>
      <AdventuresAdminList adventures={adventures} seedAvailable={seedAvailable} />
    </div>
  );
}
