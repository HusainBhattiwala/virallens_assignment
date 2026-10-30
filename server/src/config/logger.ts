import { pino } from "pino";
import { env, isProduction } from "./env.js";

const { LOG_LEVEL } = env;

const prettyTransport = {
  target: "pino-pretty",
  options: { translateTime: "SYS:HH:MM:ss", singleLine: true },
};

export const logger = pino({
  level: LOG_LEVEL,
  base: null,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: { level: (label) => ({ level: label }) },
  ...(isProduction ? {} : { transport: prettyTransport }),
});
