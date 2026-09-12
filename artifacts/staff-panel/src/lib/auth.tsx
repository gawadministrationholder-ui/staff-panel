import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn, setSessionToken } from "./queryClient";

interface User {
  id: string;
  staffId: string | null;
  robloxUsername: string;
  robloxUserId: string;
  robloxAvatar: string;
  discordUsername: string;
  discordId: string;
  email: string;
  rank: number;
  rankName: string;
  clearance: string;
  oathSwornAt: string | null;
  suspended: boolean;
  suspendedReason: string | null;
  suspendedAt: string | null;
  suspendedBy: string | null;
  hasPassword: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithStaffId: (staffId: string) => Promise<void>;
  register: (data: unknown) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Uses the shared getQueryFn so this respects VITE_API_URL (the request
  // actually goes to the backend, not the frontend's own domain) and sends
  // the fallback bearer token — both were missing from a previous inline
  // fetch() here, which meant this check silently never worked correctly
  // in the cross-domain (Firebase + Render) setup.
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchInterval: 30 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { email, password });
      return await res.json();
    },
    onSuccess: (data) => {
      setSessionToken(data?.sessionToken);
      queryClient.setQueryData(["/api/auth/me"], data);
    },
  });

  const staffIdLoginMutation = useMutation({
    mutationFn: async ({ staffId }: { staffId: string }) => {
      const res = await apiRequest("POST", "/api/auth/login/staff-id", { staffId });
      return await res.json();
    },
    onSuccess: (data) => {
      setSessionToken(data?.sessionToken);
      queryClient.setQueryData(["/api/auth/me"], data);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: unknown) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setSessionToken(data?.sessionToken);
      queryClient.setQueryData(["/api/auth/me"], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout");
      return await res.json();
    },
    onSuccess: () => {
      setSessionToken(null);
      queryClient.setQueryData(["/api/auth/me"], null);
    },
  });

  return (
    <AuthContext.Provider value={{
      user: user || null,
      isLoading,
      login: async (email, password) => { await loginMutation.mutateAsync({ email, password }); },
      loginWithStaffId: async (staffId) => { await staffIdLoginMutation.mutateAsync({ staffId }); },
      register: async (data) => { await registerMutation.mutateAsync(data); },
      logout: async () => { await logoutMutation.mutateAsync(); },
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
