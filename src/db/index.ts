import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;

export const db = connectionString
  ? drizzle(neon(connectionString), { schema })
  : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL environment variable is not configured. Please set it in .env.local or your environment."
    );
  }
  return db;
}

export { schema };
