import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const p = join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: dest } = await supabase
  .from("destinations")
  .select("id,city")
  .ilike("country", "%bulgaria%")
  .ilike("city", "Nessebar")
  .maybeSingle();

const { data: places } = await supabase
  .from("places")
  .select("name,lat,lng,order_index,translations")
  .eq("destination_id", dest.id)
  .order("order_index");

const w = places?.find((p) => p.order_index === 6) ?? places?.find((p) => /windmill/i.test(p.name));
console.log(JSON.stringify(w, null, 2));
