import "./config";
import { run } from "@grammyjs/runner";
import { createBot } from "./app";
import { assertBotToken } from "./config";

assertBotToken();

const bot = createBot();

console.info("[bot] starting long polling…");

run(bot);
