import { QueryClient, type QueryFunction } from "@tanstack/react-query";

// When the frontend and backend are on different domains (e.g. frontend on
// Firebase Hosting, backend on Render), set VITE_API_URL at build time to
// the backend's full URL (e.g. https://your-app.onrender.com). When unset,
// requests stay relative — this is what you want if frontend and backend
// share the same domain (e.g. both proxied through the same host).
const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") || "";

// Fallback auth token for cross-domain setups where the session cookie
// doesn't reliably survive a full page reload in some browsers. Returned
// by the server at login/register and stored here; sent back as a Bearer
// token on every request so a refresh doesn't require logging in again.
const SESSION_TOKEN_KEY = "gaw_session_token";

export function getSessionToken(): string | null {
  try {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token: string | null | undefined): void {
  try {
    if (token) localStorage.setItem(SESSION_TOKEN_KEY, token);
    else localStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {}
}

function withBase(url: string): string {
  return url.startsWith("/") ? `${API_BASE_URL}${url}` : url;
}

function authHeaders(): Record<string, string> {
  const token = getSessionToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(method: string, url: string, data?: unknown): Promise<Response> {
  const res = await fetch(withBase(url), {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...authHeaders(),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: { on401: UnauthorizedBehavior }) => QueryFunction<T> =
  ({ on401 }) =>
  async ({ queryKey }) => {
    const res = await fetch(withBase(queryKey.join("/") as string), {
      credentials: "include",
      headers: authHeaders(),
    });
    if (on401 === "returnNull" && res.status === 401) return null as T;
    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: { retry: false },
  },
});
