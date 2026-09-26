import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

let currentDb: ReturnType<typeof drizzle<typeof schema>> | null = null;
let currentUrl: string | null = null;

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is not configured. Please set it in .env.local or your environment."
    );
  }
  if (!currentDb || currentUrl !== url) {
    currentDb = drizzle(neon(url), { schema });
    currentUrl = url;
  }
  return currentDb;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const activeDb = getDb();
    const value = (activeDb as unknown as Record<string | symbol, unknown>)[
      prop
    ];
    return typeof value === "function" ? value.bind(activeDb) : value;
  },
});

export { schema };
