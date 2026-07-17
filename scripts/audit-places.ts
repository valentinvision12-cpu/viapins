#!/usr/bin/env npx tsx
/** Audit places missing images or descriptions for given countries */
import { readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const path = join(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const countries = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["Croatia", "Cyprus", "Czech Republic", "Bosnia and Herzegovina"];

async function checkImage(url: string) {
  if (!url?.trim()) return false;
  try {
    const r = await fetch(url, { method: "HEAD", redirect: "follow" });
    return r.status === 200;
  } catch {
    return false;
  }
}

async function main() {
  loadEnvLocal();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const issues: {
    country: string;
    city: string;
    name: string;
    id: string;
    problem: string[];
    image_url: string;
    wiki_title?: string;
  }[] = [];

  for (const country of countries) {
    const { data: dests } = await supabase
      .from("destinations")
      .select("id, city")
      .ilike("country", country);

    for (const dest of dests ?? []) {
      const { data: places } = await supabase
        .from("places")
        .select("id, name, image_url, translations")
        .eq("destination_id", dest.id)
        .order("order_index");

      for (const p of places ?? []) {
        const en = (p.translations as Record<string, { description?: string; wiki_text?: string; wiki_title?: string }>)?.en;
        const problems: string[] = [];
        if (!p.image_url?.trim()) problems.push("no_image_url");
        else if (!(await checkImage(p.image_url))) problems.push("broken_image");
        if (!en?.description?.trim()) problems.push("no_description");
        if (!en?.wiki_text?.trim()) problems.push("no_wiki_text");
        if (problems.length) {
          issues.push({
            country,
            city: dest.city,
            name: p.name,
            id: p.id,
            problem: problems,
            image_url: p.image_url || "",
            wiki_title: en?.wiki_title,
          });
        }
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }

  const outPath = join(process.cwd(), "data", "audit-missing.json");
  writeFileSync(outPath, JSON.stringify(issues, null, 2), "utf8");

  const byCountry = new Map<string, number>();
  for (const i of issues) {
    byCountry.set(i.country, (byCountry.get(i.country) ?? 0) + 1);
  }

  console.log(`\nTotal issues: ${issues.length}`);
  for (const [c, n] of byCountry) console.log(`  ${c}: ${n}`);
  console.log(`\nSaved: ${outPath}\n`);

  for (const i of issues.slice(0, 30)) {
    console.log(`${i.country} / ${i.city} / ${i.name}: ${i.problem.join(", ")}`);
  }
  if (issues.length > 30) console.log(`... +${issues.length - 30} more`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
