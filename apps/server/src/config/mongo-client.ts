import mongoose from "mongoose";
import { env } from "./env.js";

const { MONGO_URI } = env;

export const mongoClient = new mongoose.mongo.MongoClient(MONGO_URI);
