import type { IncomingMessage, ServerResponse } from "node:http";
import { connectDatabase } from "@/config/database.js";
import { toError } from "@/lib/errors.js";
import { createApp } from "./app.js";

const app = createApp();

let connection: Promise<void> | undefined;

const ensureDatabase = async (): Promise<void> => {
  connection ??= connectDatabase();
  try {
    await connection;
  } catch (error) {
    connection = undefined;
    throw toError(error);
  }
};

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  await ensureDatabase();
  app(req, res);
}
