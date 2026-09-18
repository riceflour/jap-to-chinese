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
 * hiragana reading, dictionary (base) form, and part of speech.
 *
 * `basicForm` matters a lot for dictionary lookup: a conjugated verb like
 * 勉強しています won't be found in JMdict directly, but its basic_form
 * (勉強する) will be.
 *
 * Returns: [{ surface, reading, basicForm, pos, chinese: "", english: "" }, ...]
 */
export async function tokenize(text) {
  const tokenizer = await getTokenizer();
  const rawTokens = tokenizer.tokenize(text);

  return rawTokens.map((t) => {
    const reading = t.reading && t.reading !== "*" ? t.reading : t.surface_form;
    const basicForm = t.basic_form && t.basic_form !== "*" ? t.basic_form : t.surface_form;
    return {
      surface: t.surface_form,
      reading: katakanaToHiragana(reading),
      basicForm,
      pos: t.pos, // e.g. "名詞" (noun), "動詞" (verb), "助詞" (particle)
      chinese: "",
      english: "",
    };
  });
}
