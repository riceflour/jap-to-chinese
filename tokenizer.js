import kuromoji from "kuromoji";

// kuromoji needs its dictionary files on disk; this path points at the
// copy bundled inside node_modules when installed via npm.
const DIC_PATH = "node_modules/kuromoji/dict";

let tokenizerInstance = null;

function getTokenizer() {
  if (tokenizerInstance) return Promise.resolve(tokenizerInstance);

  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath: DIC_PATH }).build((err, tokenizer) => {
      if (err) return reject(err);
      tokenizerInstance = tokenizer;
      resolve(tokenizer);
    });
  });
}

function katakanaToHiragana(katakana) {
  if (!katakana) return "";
  return katakana.replace(/[\u30A1-\u30F6]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0x60)
  );
}

/**
 * Tokenizes Japanese text into words, each with its surface form,
 * hiragana reading, and part of speech.
 * Returns: [{ surface, reading, pos, chinese: "" }, ...]
 */
export async function tokenize(text) {
  const tokenizer = await getTokenizer();
  const rawTokens = tokenizer.tokenize(text);

  return rawTokens.map((t) => {
    const reading = t.reading && t.reading !== "*" ? t.reading : t.surface_form;
    return {
      surface: t.surface_form,
      reading: katakanaToHiragana(reading),
      pos: t.pos, // e.g. "名詞" (noun), "動詞" (verb), "助詞" (particle)
      chinese: "",
    };
  });
}
