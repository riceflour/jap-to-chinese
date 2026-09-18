const LIBRETRANSLATE_URL = "http://localhost:5000/translate";

/**
 * Calls a local LibreTranslate server to translate a full sentence.
 * source/target use ISO codes: "ja", "zh", "en".
 */
async function translateText(text, source, target) {
  const response = await fetch(LIBRETRANSLATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source,
      target,
      format: "text",
    }),
  });

  if (!response.ok) {
    throw new Error(`LibreTranslate error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  return data.translatedText;
}

/**
 * Translates the full sentence into both Chinese and English, then
 * translates each already-segmented word individually into both languages
 * too (word-by-word, since LibreTranslate doesn't give aligned output the
 * way an LLM call can).
 *
 * Mutates each token with `chinese` and `english` fields, and returns
 * { fullChinese, fullEnglish }.
 */
export async function translate(originalSentence, tokens) {
  const [fullChinese, fullEnglish] = await Promise.all([
    translateText(originalSentence, "ja", "zh"),
    translateText(originalSentence, "ja", "en"),
  ]);

  // Word-by-word glosses: translate each surface form on its own.
  // This loses sentence context (a known trade-off vs. the Claude version),
  // so short/ambiguous words may come back less accurate.
  for (const token of tokens) {
    const [zh, en] = await Promise.all([
      translateText(token.surface, "ja", "zh"),
      translateText(token.surface, "ja", "en"),
    ]);
    token.chinese = zh;
    token.english = en;
  }

  return { fullChinese, fullEnglish };
}
