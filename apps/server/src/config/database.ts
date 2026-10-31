import mongoose from "mongoose";
import { createAuthIndexes } from "@/auth/auth.js";
import { mongoClient } from "./mongo-client.js";

mongoose.set("autoIndex", false);

const createModelIndexes = async (): Promise<void> => {
  await Promise.all(mongoose.modelNames().map((name) => mongoose.model(name).createIndexes()));
};

export const connectDatabase = async (): Promise<void> => {
  await mongoClient.connect();
  if (mongoose.connection.readyState === mongoose.ConnectionStates.disconnected) {
    mongoose.connection.setClient(mongoClient);
  }
  await Promise.all([createModelIndexes(), createAuthIndexes()]);
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
};
