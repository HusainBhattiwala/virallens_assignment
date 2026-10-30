import bcrypt from "bcrypt";
import createHttpError from "http-errors";
import { mongo, type Types } from "mongoose";
import { toError } from "@/lib/errors.js";
import { User } from "@/models/user.model.js";
import { unauthenticated } from "./session.js";

const BCRYPT_ROUNDS = 12;
const DUPLICATE_KEY_ERROR = 11000;

interface Credentials {
  email: string;
  password: string;
}

export interface PublicUser {
  id: string;
  email: string;
}

const isDuplicateKeyError = (error: Error): boolean =>
  error instanceof mongo.MongoServerError && error.code === DUPLICATE_KEY_ERROR;

const toPublicUser = ({ _id, email }: { _id: Types.ObjectId; email: string }): PublicUser => ({
  id: _id.toString(),
  email,
});

export const signup = async ({ email, password }: Credentials): Promise<PublicUser> => {
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    return toPublicUser(await User.create({ email, passwordHash }));
  } catch (caught) {
    const error = toError(caught);
    if (isDuplicateKeyError(error)) throw createHttpError(409, "Email is already registered");
    throw error;
  }
};

export const login = async ({ email, password }: Credentials): Promise<PublicUser> => {
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw createHttpError(401, "Invalid email or password");
  }

  return toPublicUser(user);
};

export const findUser = async (userId: string): Promise<PublicUser> => {
  const user = await User.findById(userId);
  if (!user) throw unauthenticated();
  return toPublicUser(user);
};
