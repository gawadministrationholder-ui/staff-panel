import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  // A relative, forward-slash path (rather than an absolute path.join(...)
  // result) avoids a drizzle-kit bug on Windows where backslash-separated
  // absolute paths fail its internal glob matching.
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
