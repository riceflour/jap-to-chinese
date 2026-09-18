# JP → ZH/EN Translator (Node.js, offline-first)

Segments Japanese text into words (kuromoji), looks up accurate word
meanings from a local JMdict dictionary, and translates full sentences
via a local LibreTranslate server. No Claude/cloud LLM calls.

## Why JMdict for word-level meanings

Running short, isolated words (especially 1-2 character kanji) through a
translation model produces unreliable results — MT models need sentence
context to disambiguate, and short fragments confuse them badly (e.g.
毎日 "daily" coming back as "pets"). JMdict is a real dictionary, not a
translation model, so per-word lookups are accurate and instant, with no
model guessing involved. Full sentences still go through LibreTranslate,
since a whole sentence gives it enough context to work with.

## Setup

### 1. Install Node dependencies
```
npm install
```

### 2. Download JMdict
Get the English JSON dictionary from:
https://github.com/scriptin/jmdict-simplified/releases

Download the file named like `jmdict-eng-3.x.x.json.zip` (NOT the
`jmdict-eng-common` variant unless you want a smaller/faster but less
complete dictionary), unzip it, rename it to `jmdict-eng.json`, and place
it in this project's root folder (next to `package.json`).

### 3. Run LibreTranslate locally (only used for full-sentence translation)
```
docker run -it -p 5000:5000 libretranslate/libretranslate --load-only ja,zh,en
```
First run downloads language models (needs internet once); after that it
can run offline.

### 4. Run the translator
```
node index.js 私は毎日日本語を勉強しています
```
Or run without arguments to be prompted:
```
node index.js
```

## Project layout

```
tokenizer.js   - wraps kuromoji, returns surface/reading/basicForm/pos per word
dictionary.js  - loads JMdict once, looks up English glosses by word
translator.js  - full sentence -> LibreTranslate; per-word -> JMdict, then
                  the short English gloss -> LibreTranslate for Chinese
index.js       - CLI entry point, prints the breakdown table
```

## Known limitations

- If a word isn't in JMdict (rare proper nouns, some slang), it'll show
  `(not found)` — you could fall back to the old MT-based approach for
  just those cases if you want a "best effort" instead of a blank.
- JMdict entries can have multiple senses/meanings; this picks the first
  (usually most common) gloss. For a word like 木 (tree / wood / Thursday
  abbreviation in some contexts), you're getting the top dictionary sense,
  which is usually but not always what you want in context.
- Particles (は, を, etc.) and punctuation are skipped entirely since they
  don't have standalone dictionary meanings.

## Things to extend as practice

- If a JMdict lookup fails, try stripping okurigana or checking common
  conjugation patterns kuromoji's basic_form doesn't always normalize.
- Cache LibreTranslate results for repeated glosses across runs (e.g. to
  a small JSON file) since gloss->Chinese pairs repeat a lot in practice.
- Use JMdict's part-of-speech and sense-ordering data to pick a gloss that
  better matches kuromoji's reported part of speech for the token.
