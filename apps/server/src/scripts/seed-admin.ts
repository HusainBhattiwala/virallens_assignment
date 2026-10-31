import { z } from "zod";
import { type AuthUser, auth } from "@/auth/auth.js";
import { connectDatabase, disconnectDatabase } from "@/config/database.js";
import { logger } from "@/config/logger.js";

const ADMIN_ROLE = "admin";
const CREDENTIAL_PROVIDER = "credential";

const adminEnvSchema = z.object({
  ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email()),
  ADMIN_PASSWORD: z.string().min(8).max(128),
  ADMIN_NAME: z.string().trim().min(1).default("Admin"),
});

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = adminEnvSchema.parse(process.env);

const hasAdminRole = (role: string | null | undefined): boolean => role?.split(",").includes(ADMIN_ROLE) ?? false;

const hasCredential = async (userId: string): Promise<boolean> => {
  const { internalAdapter } = await auth.$context;
  const accounts = await internalAdapter.findAccounts(userId);
  return accounts.some(({ providerId }) => providerId === CREDENTIAL_PROVIDER);
};

const ensureCredential = async (userId: string): Promise<void> => {
  if (await hasCredential(userId)) return;

  const { internalAdapter, password } = await auth.$context;
  try {
    await internalAdapter.linkAccount({
      providerId: CREDENTIAL_PROVIDER,
      accountId: userId,
      userId,
      password: await password.hash(ADMIN_PASSWORD),
    });
    logger.info(`Linked a password to admin ${ADMIN_EMAIL}`);
  } catch (error) {
    if (!(await hasCredential(userId))) throw error;
  }
};

const seedAdmin = async (): Promise<void> => {
  try {
    await auth.api.createUser({
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: ADMIN_NAME, role: ADMIN_ROLE },
    });
    logger.info(`Created admin ${ADMIN_EMAIL}`);
  } catch (error) {
    const { adapter } = await auth.$context;
    const existing = await adapter.findOne<AuthUser>({ model: "user", where: [{ field: "email", value: ADMIN_EMAIL }] });
    if (!existing) throw error;
    if (!hasAdminRole(existing.role)) {
      throw new Error(`${ADMIN_EMAIL} is already registered without the ${ADMIN_ROLE} role`, { cause: error });
    }
    await ensureCredential(existing.id);
    logger.info(`Admin ${ADMIN_EMAIL} already exists`);
  }
};

await connectDatabase();
try {
  await seedAdmin();
} finally {
  await disconnectDatabase();
}
