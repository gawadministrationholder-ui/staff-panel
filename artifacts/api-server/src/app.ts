import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import connectPg from "connect-pg-simple";
import pg from "pg";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// Firebase Hosting / Cloud Functions sit in front of this app as a proxy.
// Without this, Express can't tell the original request was HTTPS, which
// breaks `cookie.secure` below and any req.protocol/req.secure checks.
app.set("trust proxy", 1);


const PgSession = connectPg(session);

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

app.use(
  session({
    store: new PgSession({
      pool: pgPool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // "none" is required for the cookie to be sent on cross-domain
      // requests (frontend on one domain, e.g. Firebase Hosting, backend
      // on another, e.g. Render) — but "none" only works when `secure` is
      // also true, which is why this is tied to production the same way.
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  }),
);

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

app.use("/api", router);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const status = (err as any)?.status || (err as any)?.statusCode || 500;
  const message = (err as any)?.message || "Internal Server Error";
  res.status(status).json({ message });
});

export default app;
