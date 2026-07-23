/**
 * Detect landmarks that represent non-Christian religions
 * (Islam, Judaism, Buddhism, Hinduism, Shinto, pagan temples, etc.).
 * Christian churches / cathedrals / monasteries / chapels are kept.
 */

const CHRISTIAN_KEEP =
  /\b(church|cathedral|chapel|basilica|monastery|abbey|orthodox|catholic|christian|baptist|lutheran|protestant|anglican|sacred heart|co-cathedral|concathedral)\b/i;

const NON_CHRISTIAN_NAME = [
  /\bxhamia\b/i,
  /\bcamii\b/i,
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
  /\bhindu temple\b/i,
  /\bbuddhist temple\b/i,
  /\bshinto shrine\b/i,
  /\bjapanese shrine\b/i,
  /\b\w+\s+jinja\b/i,
  /\bwat\s+\w+/i,
];

/** Ancient / tourist archaeological temples — keep as landmarks. */
const KEEP_ARCHAEOLOGICAL_TEMPLE =
  /\b(roman|greek|hellenic|hellenistic|ancient|classical|olympian|parthenon|apollo|zeus|athena|artemis|poseidon|hercules|hera|augustus|hadrian|trajan|jupiter|diana|venus|mars|vesta|isis|mithra|cybele|castor|pollux)\b/i;

/** Phrases that look like temples/shrines but are Christian — still kept via CHRISTIAN_KEEP. */
const CHRISTIAN_TEMPLE_OR_SHRINE =
  /\b(catholic|christian|orthodox|baptist|lutheran|mormon|latter.?day|holy)\s+temple\b/i;

export function isNonChristianReligiousPlace(
  name: string,
  description?: string | null,
  imageUrl?: string | null
): boolean {
  const n = (name || "").trim();
  if (!n) return false;

  // Mosque–Cathedral / Mezquita-Iglesia / similar hybrids → exclude
  if (/\b(mosque|mezquita|masjid|synagogue|tekke|džamij|dzamij|cami|xhamia|camii)\b/i.test(n)) {
    return true;
  }

  if (imageUrl && /mosque|xhamia|masjid|mezquita|minaret|synagogue|tekke|church.?and.?mosque/i.test(imageUrl)) {
    // Keep Christian places even if a shared photo filename mentions a mosque
    if (!(CHRISTIAN_KEEP.test(n) || CHRISTIAN_TEMPLE_OR_SHRINE.test(n))) {
      return true;
    }
  }

  if (CHRISTIAN_KEEP.test(n) || CHRISTIAN_TEMPLE_OR_SHRINE.test(n)) {
    return false;
  }

  // Keep Roman / ancient archaeological temples (Évora, Olympia, etc.)
  if (/\btemple\b/i.test(n) && KEEP_ARCHAEOLOGICAL_TEMPLE.test(n)) {
    return false;
  }

  if (NON_CHRISTIAN_NAME.some((p) => p.test(n))) return true;

  // Bare "temple"/"shrine" without archaeological context → exclude non-Christian
  if (/\b(temple|shrine)\b/i.test(n) && !KEEP_ARCHAEOLOGICAL_TEMPLE.test(n)) {
    return true;
  }

  if (description) {
    const d = description;
    if (
      /\b(mosque|synagogue|hindu temple|buddhist temple|shinto shrine|tekke|masjid|xhamia|camii)\b/i.test(
        d
      ) &&
      !CHRISTIAN_KEEP.test(n)
    ) {
      return true;
    }
  }

  return false;
}
