import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: country } = await sb
  .from("countries")
  .select("id, slug")
  .eq("slug", "turkey")
  .single();
const { data: adv } = await sb
  .from("adventure_collections")
  .select("id, hero_image")
  .eq("country_id", country.id)
  .single();
const { data: places } = await sb
  .from("adventure_places")
  .select("name, lat, lng, image_url, region, order_index")
  .eq("collection_id", adv.id)
  .order("order_index");

for (const p of places ?? []) {
  const img = p.image_url
    ? p.image_url.startsWith("https://upload.wikimedia")
      ? "wiki"
      : "other"
    : "MISSING";
  console.log(
    `${p.order_index + 1}. ${p.name} | ${p.region} | ${p.lat?.toFixed(4)}, ${p.lng?.toFixed(4)} | ${img}`
  );
}
