# JP → ZH/EN Translator (Node.js, offline via LibreTranslate)

Segments a Japanese sentence into words with furigana readings (via
kuromoji), then translates the sentence — and each word individually —
into both Chinese and English using a local LibreTranslate server. No
Claude/cloud LLM calls, no ongoing API costs, and it can run fully
offline once LibreTranslate's language models are downloaded.

## Setup

### 1. Install Node dependencies
```
npm install
```

### 2. Run LibreTranslate locally (Docker is easiest)
```
docker run -it -p 5000:5000 libretranslate/libretranslate
```
First run downloads the language models (needs internet once). After
that, you can run the container without a network connection.

Confirm it's up by visiting http://localhost:5000 in a browser — you
should see the LibreTranslate web UI.

### 3. Run the translator
```
node index.js 私は毎日日本語を勉強しています
```
Or run without arguments to be prompted:
```
node index.js
```

## Project layout

```
tokenizer.js   - wraps kuromoji, returns [{ surface, reading, pos, chinese, english }]
translator.js  - calls the local LibreTranslate server (ja→zh and ja→en)
index.js       - CLI entry point: reads input, ties the two together, prints output
```

## Trade-offs vs. the Claude version

- **No sentence-context alignment.** Claude could look at the whole
  sentence and figure out the best Chinese/English gloss for each word
  in context. LibreTranslate translates each word in isolation, so
  ambiguous or context-dependent words may come back less accurate.
- **Lower translation quality ceiling.** LibreTranslate's engine (Argos
  Translate under the hood) is solid for general text but noticeably
  behind DeepL/Google/Claude on nuance, idioms, and natural phrasing.
- **In exchange:** zero API cost, no API key needed, and it can run
  fully offline once set up — good trade if privacy/cost/offline use
  matters more than best-possible translation quality.

## Things to extend as practice

- Add caching so repeated words (common particles, common verbs) aren't
  re-translated on every run — LibreTranslate is local so it's fast, but
  it's still wasted work.
- Try swapping in DeepL's API (better quality, still has a generous free
  tier) as a drop-in replacement for `translateText()` if quality matters
  more than staying fully offline for your use case.
- Batch the word-by-word calls instead of one request per word, if
  LibreTranslate's API supports batch translation in your version.
