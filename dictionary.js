import fs from "node:fs";

/**
 * Wraps a local copy of JMdict-simplified (a free, open-source
 * Japanese-English dictionary maintained by the EDRDG project) to look up
 * accurate word meanings offline
 */
const JMDICT_PATH = "./jmdict-eng.json";

let indexByWord = null; // Map: kanji or kana form -> array of English glosses

function buildIndex(dictData) {
  const index = new Map();

  for (const entry of dictData.words) {
    const glosses = [];
    for (const sense of entry.sense) {
      for (const g of sense.gloss) {
        if (g.lang === "eng") glosses.push(g.text);
      }
    }
    if (glosses.length === 0) continue;

    // Index under every kanji spelling...
    for (const k of entry.kanji || []) {
      addToIndex(index, k.text, glosses);
    }
    // ...and every kana (reading-only) spelling, so words with no kanji
    // (or when kuromoji gives us a kana surface form) still resolve.
    for (const k of entry.kana || []) {
      addToIndex(index, k.text, glosses);
    }
  }

  return index;
}

function addToIndex(index, key, glosses) {
  if (!index.has(key)) {
    index.set(key, glosses);
  }
}

function loadIndex() {
  if (indexByWord) return indexByWord;

  if (!fs.existsSync(JMDICT_PATH)) {
    throw new Error(
      `JMdict file not found at ${JMDICT_PATH}.\n` +
      "Download it from https://github.com/scriptin/jmdict-simplified/releases " +
      "(the 'jmdict-eng-*.json' file) and place it in the project folder."
    );
  }

  const raw = fs.readFileSync(JMDICT_PATH, "utf-8");
  const dictData = JSON.parse(raw);
  indexByWord = buildIndex(dictData);
  return indexByWord;
}

/**
 * Looks up a word (try basicForm first, then surface as a fallback) and
 * returns its top English gloss, or null if not found.
 */
export function lookupEnglishGloss(basicForm, surface) {
  const index = loadIndex();

  const glosses = index.get(basicForm) || index.get(surface);
  if (!glosses || glosses.length === 0) return null;

  // First gloss is generally the most common/primary meaning.
  return glosses[0];
}
