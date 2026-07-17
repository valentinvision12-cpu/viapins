#!/usr/bin/env node
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COUNTRIES = [
  "Andorra","Austria","Estonia","Luxembourg",
  "Spain","Latvia","Liechtenstein","Lithuania","Malta","Moldova","Monaco","Montenegro",
  "Netherlands","North Macedonia","Norway","Poland","Portugal","Russia","San Marino",
  "Serbia","Slovakia","Slovenia","Sweden","Switzerland","Turkey","Ukraine","United Kingdom",
];
function loadEnv(){const p=join(ROOT,".env.local");if(!existsSync(p))return;for(const line of readFileSync(p,"utf8").split("\n")){const t=line.trim();if(!t||t.startsWith("#"))continue;const eq=t.indexOf("=");if(eq===-1)continue;const k=t.slice(0,eq).trim();let v=t.slice(eq+1).trim();if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);if(!process.env[k])process.env[k]=v;}}
function norm(s){return(s||"").trim().toLowerCase().replace(/\s+/g," ");}
function keepScore(city,name){const c=norm(city),n=norm(name);if(n.includes(c))return 100;return 1;}
const MICRO = new Set(["Liechtenstein","Monaco","North Macedonia","San Marino"]);
async function main(){
  loadEnv();
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  let removed = 0;
  let dupNames = 0;
  for (const country of COUNTRIES) {
    const { data: dests } = await sb
      .from("destinations")
      .select("id, city, created_at")
      .ilike("country", country)
      .order("created_at", { ascending: true });
    const byCity = new Map();
    for (const d of dests ?? []) {
      const key = norm(d.city);
      if (!byCity.has(key)) byCity.set(key, []);
      byCity.get(key).push(d);
    }
    for (const [, list] of byCity) {
      if (list.length <= 1) continue;
      for (const dup of list.slice(1)) {
        await sb.from("places").delete().eq("destination_id", dup.id);
        await sb.from("destinations").delete().eq("id", dup.id);
        removed++;
      }
    }
    for (const dest of dests ?? []) {
      const { data: places } = await sb
        .from("places")
        .select("id, order_index")
        .eq("destination_id", dest.id)
        .order("order_index", { ascending: true });
      if ((places?.length ?? 0) <= 10) continue;
      for (const p of places.slice(10)) await sb.from("places").delete().eq("id", p.id);
    }
    if (MICRO.has(country)) {
      const byName = new Map();
      for (const dest of dests ?? []) {
        const { data: places } = await sb
          .from("places")
          .select("id, name")
          .eq("destination_id", dest.id);
        for (const p of places ?? []) {
          const key = norm(p.name);
          if (!byName.has(key)) byName.set(key, []);
          byName.get(key).push({ id: p.id, city: dest.city, name: p.name });
        }
      }
      for (const [, list] of byName) {
        if (list.length <= 1) continue;
        list.sort((a, b) => keepScore(b.city, b.name) - keepScore(a.city, a.name));
        for (const dup of list.slice(1)) {
          await sb.from("places").delete().eq("id", dup.id);
          dupNames++;
        }
      }
    }
  }
  console.log("Dedupe done, removed", removed, "dest dupes,", dupNames, "name dupes");
}
main().catch(e=>{console.error(e);process.exit(1);});