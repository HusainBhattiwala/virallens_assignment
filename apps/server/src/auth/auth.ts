import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { getAuthTables } from "better-auth/db";
import { betterAuth } from "better-auth/minimal";
import { admin } from "better-auth/plugins";
import { AUTH_PREFIX } from "@/config/api-paths.js";
import { env } from "@/config/env.js";
import { mongoClient } from "@/config/mongo-client.js";

const { BETTER_AUTH_SECRET, BETTER_AUTH_URL, CLIENT_ORIGIN } = env;

const ACCESS_TOKEN_TTL_SECONDS = 5 * 60;

export const auth = betterAuth({
  baseURL: BETTER_AUTH_URL,
  basePath: AUTH_PREFIX,
  secret: BETTER_AUTH_SECRET,
  trustedOrigins: [CLIENT_ORIGIN],
  database: mongodbAdapter(mongoClient.db(), { client: mongoClient }),
  emailAndPassword: { enabled: true },
  session: {
    cookieCache: { enabled: true, strategy: "jwe", maxAge: ACCESS_TOKEN_TTL_SECONDS },
  },
  rateLimit: { storage: "database" },
  plugins: [admin()],
});

export type AuthUser = typeof auth.$Infer.Session.user;

export const createAuthIndexes = async (): Promise<void> => {
  const db = mongoClient.db();
  const fieldIndexes = Object.values(getAuthTables(auth.options)).flatMap(({ modelName, fields }) =>
    Object.entries(fields)
      .filter(([, field]) => field.unique === true || field.index === true)
      .map(([name, field]) =>
        db.collection(modelName).createIndex({ [field.fieldName ?? name]: 1 }, { unique: field.unique === true }),
      ),
  );
  await Promise.all([
    ...fieldIndexes,
    db.collection("account").createIndex({ providerId: 1, accountId: 1 }, { unique: true }),
  ]);
};
