import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "@/app.js";
import { connectDatabase } from "@/config/database.js";
import { toError } from "@/lib/errors.js";

const app = createApp();

let connection: Promise<void> | undefined;

const ensureDatabase = (): Promise<void> => {
  connection ??= connectDatabase().catch((error: unknown) => {
    connection = undefined;
    throw toError(error);
  });
  return connection;
};

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await ensureDatabase();
  app(req, res);
}
