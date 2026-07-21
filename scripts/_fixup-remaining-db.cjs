const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnv() {
  const p = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    )
      v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

const MAP = {
  "Et'hem Bey Mosque": {
    name: "Tirana Clock Tower",
    wiki_title: "Clock Tower of Tirana",
    lat: 41.3278,
    lng: 19.8185,
    description: "19th-century clock tower on Skanderbeg Square.",
  },
  "King Mosque": {
    name: "Berat Belvedere Viewpoint",
    wiki_title: "Berat",
    lat: 40.7085,
    lng: 19.9465,
    description: "Hillside lookout over Berat old town.",
  },
  "Synagogue of Saranda": {
    name: "Saranda Ferry Port Viewpoint",
    wiki_title: "Saranda",
    lat: 39.8755,
    lng: 20.005,
    description: "Harbour viewpoint over Ionian ferry routes.",
  },
  "Gjirokastër Mosque": {
    name: "Gjirokastër Clock Tower",
    wiki_title: "Gjirokastër Castle",
    lat: 40.0738,
    lng: 20.1385,
    description: "Clock tower within Gjirokastër Castle walls.",
  },
  "Lead Mosque": {
    name: "Rruga Kole Idromeno",
    wiki_title: "Shkodër",
    lat: 42.068,
    lng: 19.5125,
    description: "Pedestrian heart of Shkodër.",
  },
  "Ebu Bekr Mosque": {
    name: "Shkodër Civic Centre",
    wiki_title: "Shkodër",
    lat: 42.0685,
    lng: 19.5115,
    description: "Civic plaza in central Shkodër.",
  },
  "Fatih Mosque": {
    name: "Durrës Waterfront Promenade",
    wiki_title: "Durrës",
    lat: 41.314,
    lng: 19.445,
    description: "Adriatic promenade in Durrës.",
  },
  "Muradie Mosque": {
    name: "Vlorë Lungomare",
    wiki_title: "Vlorë",
    lat: 40.456,
    lng: 19.484,
    description: "Seafront boulevard of Vlorë.",
  },
  "Dollma Tekke": {
    name: "Krujë Castle Walls Walk",
    wiki_title: "Krujë Castle",
    lat: 41.5125,
    lng: 19.7935,
    description: "Castle ramparts above Krujë.",
  },
  "Sari Salltik Tekke": {
    name: "Krujë Panorama Terrace",
    wiki_title: "Krujë",
    lat: 41.5118,
    lng: 19.7945,
    description: "High terrace views from Krujë.",
  },
  "Mirahori Mosque": {
    name: "Korçë Boulevard of the Republic",
    wiki_title: "Korçë",
    lat: 40.6185,
    lng: 20.7805,
    description: "Main boulevard of Korçë.",
  },
  "Dzhumaya Mosque": {
    name: "Plovdiv Kapana Creative District",
    wiki_title: "Kapana",
    lat: 42.1485,
    lng: 24.7485,
    description: "Creative district beside Plovdiv old town.",
  },
  "Temple of Cybele": {
    name: "Balchik White Cliffs Walk",
    wiki_title: "Balchik",
    lat: 43.4075,
    lng: 28.1645,
    description: "Chalk cliff paths above the Black Sea.",
  },
  "Temple of Olympian Zeus": {
    name: "Panathenaic Stadium Approach",
    wiki_title: "Panathenaic Stadium",
    lat: 37.9685,
    lng: 23.7405,
    description: "Marble stadium of the first modern Olympics.",
  },
  "Temple of Apollo": {
    name: "Delphi Ancient Gymnasium",
    wiki_title: "Delphi",
    lat: 38.4815,
    lng: 22.5005,
    description: "Terraced gymnasium ruins below Delphi theatre.",
  },
  "Old Mosque": {
    name: "Kumanovo City Square",
    wiki_title: "Kumanovo",
    lat: 42.1322,
    lng: 21.7144,
    description: "Central civic square of Kumanovo.",
  },
  "terminal mitnitsa tetovo": {
    name: "Tetovo City Park",
    wiki_title: "Tetovo",
    lat: 42.0085,
    lng: 20.9715,
    description: "Central park and promenade in Tetovo.",
  },
};

async function main() {
  loadEnv();
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  let n = 0;
  for (const [oldName, hit] of Object.entries(MAP)) {
    const { data: rows } = await supabase
      .from("places")
      .select("id,name,translations")
      .eq("name", oldName);
    for (const row of rows || []) {
      const translations = {
        ...(row.translations || {}),
        en: {
          ...((row.translations && row.translations.en) || {}),
          description: hit.description,
          seo_phrase: hit.name,
          wiki_title: hit.wiki_title,
        },
      };
      const { error } = await supabase
        .from("places")
        .update({
          name: hit.name,
          lat: hit.lat,
          lng: hit.lng,
          image_url: null,
          translations,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (error) console.log("FAIL", oldName, error.message);
      else {
        console.log("OK", oldName, "->", hit.name);
        n++;
      }
    }
  }

  // Tetovo fortress Cyrillic name leftover
  const { data: kaleRows } = await supabase
    .from("places")
    .select("id,name,translations")
    .ilike("name", "%ale%");
  for (const row of kaleRows || []) {
    if (!/tetov/i.test(row.name) && row.name !== "Тетовско Кале") continue;
    if (row.name === "Tetovo Kale Approach") continue;
    if (row.name !== "Тетовско Кале") continue;
    const hit = {
      name: "Tetovo Kale Approach",
      wiki_title: "Tetovo Fortress",
      lat: 42.0145,
      lng: 20.978,
      description: "Hill approach toward Tetovo fortress ruins.",
    };
    const translations = {
      ...(row.translations || {}),
      en: {
        ...((row.translations && row.translations.en) || {}),
        description: hit.description,
        seo_phrase: hit.name,
        wiki_title: hit.wiki_title,
      },
    };
    const { error } = await supabase
      .from("places")
      .update({
        name: hit.name,
        lat: hit.lat,
        lng: hit.lng,
        image_url: null,
        translations,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);
    if (!error) {
      console.log("OK", row.name, "->", hit.name);
      n++;
    }
  }

  console.log("fixed", n);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
