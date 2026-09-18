import { lookupEnglishGloss } from "./dictionary.js";

const LIBRETRANSLATE_URL = "http://localhost:5000/translate";

/**
 * Calls a local LibreTranslate server to translate text.
 * source/target use ISO codes: "ja", "zh", "en".
 */
async function translateText(text, source, target) {
  const response = await fetch(LIBRETRANSLATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, source, target, format: "text" }),
  });

  if (!response.ok) {
    throw new Error(`LibreTranslate error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.translatedText;
}

/**
 * Full-sentence translations still go through LibreTranslate directly —
 * a whole sentence gives the model enough context to translate reasonably.
 *
 * Per-word glosses use a different, more reliable path:
 *   1. Look up the word's real dictionary meaning in JMdict (offline,
 *      accurate, no MT guessing involved).
 *   2. Translate *that short English gloss* into Chinese via LibreTranslate.
 *      A clean English word like "daily" is a much safer/shorter input for
 *      the MT model than an isolated 2-character kanji string, so this
 *      avoids the garbage output you were seeing (e.g. 毎日 -> "pets").
 *
 * Mutates each token with `english` and `chinese`, returns the two full
 * sentence translations.
 */
export async function translate(originalSentence, tokens) {
  const [fullChinese, fullEnglish] = await Promise.all([
    translateText(originalSentence, "ja", "zh"),
    translateText(originalSentence, "ja", "en"),
  ]);

  for (const token of tokens) {
    // Skip particles/punctuation with no real dictionary meaning.
    if (token.pos === "助詞" || token.pos === "記号") {
      token.english = "";
      token.chinese = "";
      continue;
    }

    const gloss = lookupEnglishGloss(token.basicForm, token.surface);
    if (!gloss) {
      token.english = "(not found)";
      token.chinese = "(not found)";
      continue;
    }

    token.english = gloss;
    try {
      token.chinese = await translateText(gloss, "en", "zh");
    } catch {
      token.chinese = "(translation failed)";
    }
  }

  return { fullChinese, fullEnglish };
}
