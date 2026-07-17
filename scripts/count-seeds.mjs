import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const slugs = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      "spain", "latvia", "liechtenstein", "lithuania", "malta", "moldova", "monaco",
      "montenegro", "netherlands", "north-macedonia", "norway", "poland", "portugal",
      "russia", "san-marino", "serbia", "slovakia", "slovenia", "sweden", "switzerland",
      "turkey", "ukraine", "united-kingdom",
    ];

for (const s of slugs) {
  try {
    const d = JSON.parse(readFileSync(join(ROOT, `data/seeds/${s}.json`), "utf8"));
    const cities = d.cities ?? [];
    const places = cities.reduce((n, c) => n + (c.places?.length || 0), 0);
    const adv = d.adventure?.places?.length || 0;
    const short = cities.filter((c) => (c.places?.length || 0) < 10).map((c) => `${c.city}:${c.places?.length || 0}`);
    console.log(`${s}: ${places}/100 places, ${adv}/10 adv, ${cities.length} cities${short.length ? " | short: " + short.join(", ") : ""}`);
  } catch (e) {
    console.log(`${s}: NO SEED (${e.message})`);
  }
}
