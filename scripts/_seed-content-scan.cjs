const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "../data/seeds");
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".json") && !f.includes("phase") && !f.includes("input"));

let cities = 0;
let dups = 0;
let empty = 0;
let bad = 0;
const top = [];
const far = [];

function hav(a, b, c, d) {
  const R = 6371;
  const to = (x) => (x * Math.PI) / 180;
  const dLat = to(c - a);
  const dLon = to(d - b);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(to(a)) * Math.cos(to(c)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

const BAD_IMG = /map\.svg|location.?map|flag.?of|mosque|xhamia|mezquita|adsbox/i;
const BAD_NAME =
  /\b(mosque|xhamia|masjid|mezquita|synagogue|tekke|teqe|džamij|dzamij|camii)\b/i;

const religious = [];

for (const f of files) {
  let j;
  try {
    j = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  } catch {
    continue;
  }
  for (const city of j.cities || []) {
    cities++;
    const list = city.places || [];
    const lats = list.map((p) => p.lat).filter(Number.isFinite);
    const lngs = list.map((p) => p.lng).filter(Number.isFinite);
    const med = (arr) => {
      const s = [...arr].sort((a, b) => a - b);
      return s[Math.floor(s.length / 2)] || 0;
    };
    const clat = med(lats);
    const clng = med(lngs);
    const urls = new Map();
    for (const p of list) {
      const u = (p.image_url || "").trim();
      if (!u) empty++;
      else if (BAD_IMG.test(u)) bad++;
      if (u) urls.set(u, (urls.get(u) || 0) + 1);
      if (BAD_NAME.test(p.name || "")) {
        religious.push({ f, city: city.city, name: p.name });
      }
      if (clat && Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
        const km = hav(clat, clng, p.lat, p.lng);
        if (km > 40) {
          far.push({
            f,
            city: city.city,
            name: p.name,
            km: +km.toFixed(1),
          });
        }
      }
    }
    for (const [u, n] of urls) {
      if (n > 1) {
        dups += n - 1;
        top.push({ file: f, city: city.city, n, u: u.slice(-70) });
      }
    }
  }
}

top.sort((a, b) => b.n - a.n);
far.sort((a, b) => b.km - a.km);

const byFile = {};
for (const t of top) {
  byFile[t.file] = (byFile[t.file] || 0) + (t.n - 1);
}

console.log(
  JSON.stringify(
    {
      files: files.length,
      cities,
      dupExtras: dups,
      emptyImg: empty,
      badImgPattern: bad,
      far40: far.length,
      religious: religious.length,
    },
    null,
    2
  )
);
console.log("\nWorst dups by country:");
Object.entries(byFile)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([f, n]) => console.log(n, f));
console.log("\nWorst city dups:");
top.slice(0, 20).forEach((t) =>
  console.log(t.n, t.file.replace(".json", ""), t.city)
);
console.log("\nFar places:");
far.slice(0, 25).forEach((t) =>
  console.log(t.km + "km", t.f.replace(".json", ""), t.city, "/", t.name)
);
console.log("\nReligious leftovers:");
religious.forEach((t) =>
  console.log("-", t.f.replace(".json", ""), t.city, "/", t.name)
);

fs.writeFileSync(
  path.join(__dirname, "../data/seed-content-scan.json"),
  JSON.stringify({ top: top.slice(0, 100), far, religious, byFile }, null, 2)
);
