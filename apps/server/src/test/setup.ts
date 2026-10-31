import { afterAll, beforeAll, beforeEach, inject } from "vitest";

const mongoUri = new URL(inject("mongoUri"));
mongoUri.pathname = `/test-${process.env.VITEST_POOL_ID ?? "0"}`;
process.env.MONGO_URI = mongoUri.toString();

const { connectDatabase, disconnectDatabase } = await import("@/config/database.js");
const { mongoClient } = await import("@/config/mongo-client.js");

beforeAll(connectDatabase);

beforeEach(async () => {
  const collections = await mongoClient.db().collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(disconnectDatabase);
