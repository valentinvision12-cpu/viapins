import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnv() {
  try {
    const raw = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i === -1) continue;
      const k = t.slice(0, i).trim();
      const v = t.slice(i + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* ignore */
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url || !serviceKey || url.includes("placeholder")) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: buckets, error: listError } = await supabase.storage.listBuckets();
if (listError) {
  console.error("Could not list buckets:", listError.message);
  process.exit(1);
}

const exists = buckets?.some((b) => b.id === "avatars" || b.name === "avatars");

if (!exists) {
  const { error: createError } = await supabase.storage.createBucket("avatars", {
    public: true,
    fileSizeLimit: 3145728,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
  if (createError) {
    console.error("Could not create avatars bucket:", createError.message);
    process.exit(1);
  }
  console.log("Created bucket: avatars (public, max 3 MB)");
} else {
  console.log("Bucket avatars already exists");
}

const testPath = "_setup/smoke-test.txt";
const body = new Blob(["ok"], { type: "text/plain" });
const { error: upErr } = await supabase.storage.from("avatars").upload(testPath, body, {
  upsert: true,
  contentType: "text/plain",
});
if (upErr) {
  console.warn("Upload test failed:", upErr.message);
} else {
  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(testPath);
  console.log("Upload test OK:", pub.publicUrl);
  await supabase.storage.from("avatars").remove([testPath]);
}

console.log("\nDone. Profile photo uploads use /api/profile/avatar on the site.");
