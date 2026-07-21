/**
 * Detect landmarks that represent non-Christian religions
 * (Islam, Judaism, Buddhism, Hinduism, Shinto, pagan temples, etc.).
 * Christian churches / cathedrals / monasteries / chapels are kept.
 */

const CHRISTIAN_KEEP =
  /\b(church|cathedral|chapel|basilica|monastery|abbey|orthodox|catholic|christian|baptist|lutheran|protestant|anglican|sacred heart|co-cathedral|concathedral)\b/i;

const NON_CHRISTIAN_NAME = [
  /\bmosque\b/i,
  /\bmasjid\b/i,
  /\bmezquita\b/i,
  /\bcami\b/i,
  /\bdžamij/i,
  /\bdzamij/i,
  /\btekke\b/i,
  /\bteqe\b/i,
  /\bsynagogue\b/i,
  /\bsynagog\b/i,
  /\bgurdwara\b/i,
  /\bpagoda\b/i,
  /\bminaret\b/i,
  /\bshinto\b/i,
  /\bjinja\b/i,
  /\bjingu\b/i,
  /\btenmangu\b/i,
  /\binari\b/i,
  /\bhachimangu\b/i,
  /\bvihara\b/i,
  /\bklenteng\b/i,
  /\bstupa\b/i,
  /\bmandir\b/i,
  /\bfire temple\b/i,
  /\bmithras\b/i,
  /\bkul sharif\b/i,
  /\bistiqlal\b/i,
  /\bborobudur\b/i,
  /\bsri mariamman\b/i,
  /\btemple of all religions\b/i,
  /\b\w+\s+shrine\b/i,
  /\bshrine\b/i,
  /\btemple\b/i,
  /\bwat\b/i,
];

/** Phrases that look like temples/shrines but are Christian — still kept via CHRISTIAN_KEEP. */
const CHRISTIAN_TEMPLE_OR_SHRINE =
  /\b(catholic|christian|orthodox|baptist|lutheran|mormon|latter.?day|holy)\s+temple\b/i;

export function isNonChristianReligiousPlace(
  name: string,
  description?: string | null
): boolean {
  const n = (name || "").trim();
  if (!n) return false;

  // Mosque–Cathedral / Mezquita-Iglesia / similar hybrids → exclude
  if (/\b(mosque|mezquita|masjid|synagogue|tekke|džamij|dzamij|cami)\b/i.test(n)) {
    return true;
  }

  if (CHRISTIAN_KEEP.test(n) || CHRISTIAN_TEMPLE_OR_SHRINE.test(n)) {
    return false;
  }

  if (NON_CHRISTIAN_NAME.some((p) => p.test(n))) return true;

  if (description) {
    const d = description;
    if (
      /\b(mosque|synagogue|hindu temple|buddhist temple|shinto shrine|tekke|masjid)\b/i.test(
        d
      ) &&
      !CHRISTIAN_KEEP.test(n)
    ) {
      return true;
    }
  }

  return false;
}
