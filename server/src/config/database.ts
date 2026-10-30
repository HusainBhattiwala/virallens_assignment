import mongoose from "mongoose";
import { env } from "./env.js";

const { MONGO_URI } = env;

export const connectDatabase = async (): Promise<void> => {
  await mongoose.connect(MONGO_URI);
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
