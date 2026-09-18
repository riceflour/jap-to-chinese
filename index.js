import readline from "node:readline";
import { tokenize } from "./tokenizer.js";
import { translate } from "./translator.js";

async function main() {
  const argSentence = process.argv.slice(2).join(" ").trim();
  const sentence = argSentence || (await promptForSentence());

  if (!sentence) {
    console.error("No sentence provided.");
    process.exit(1);
  }

  console.log("\nSegmenting with kuromoji...");
  const tokens = await tokenize(sentence);

  console.log("Translating via local LibreTranslate server...\n");
  const { fullChinese, fullEnglish } = await translate(sentence, tokens);

  console.log(`Original : ${sentence}`);
  console.log(`Chinese  : ${fullChinese}`);
  console.log(`English  : ${fullEnglish}`);
  console.log();
  console.log("Word-by-word breakdown:");
  console.log("-".repeat(75));
  console.log(
    "Word".padEnd(12) + "Furigana".padEnd(14) + "POS".padEnd(10) +
    "Chinese".padEnd(14) + "English"
  );
  console.log("-".repeat(75));
  for (const t of tokens) {
    console.log(
      t.surface.padEnd(12) + t.reading.padEnd(14) + t.pos.padEnd(10) +
      (t.chinese || "").padEnd(14) + (t.english || "")
    );
  }
}

function promptForSentence() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question("Enter a Japanese sentence: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

main().catch((err) => {
  console.error("Something went wrong:", err.message);
  process.exit(1);
});
