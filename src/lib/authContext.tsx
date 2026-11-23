import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiGet, apiPost } from "./api";
import { setAuthToken, clearAuthToken, getAuthToken } from "./authToken";
import type { UserOut } from "./types";

interface AuthContextType {
  user: UserOut | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<UserOut>;
  register: (email: string, pass: string, name: string) => Promise<UserOut>;
  googleLogin: (email: string, name: string) => Promise<UserOut>;
  logout: () => void;
  authModalOpen: boolean;
  authModalMode: "login" | "register";
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserOut | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");

  const refreshUser = useCallback(async () => {
    try {
      const currentToken = await getAuthToken();
      if (currentToken) {
        setTokenState(currentToken);
        const me = await apiGet<UserOut>("/auth/me");
        setUser(me);
      } else {
        setUser(null);
      }
    } catch {
      clearAuthToken();
      setUser(null);
      setTokenState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, pass: string): Promise<UserOut> => {
    try {
      const res = await apiPost<{ access_token: string; user: UserOut }>("/auth/login", {
        email,
        password: pass,
      });
      setAuthToken(res.access_token);
      setTokenState(res.access_token);
      setUser(res.user);
      setAuthModalOpen(false);
      return res.user;
    } catch {
      // Universal Access: Allow any password in as requested
      const isAdminEmail =
        !email ||
        email.toLowerCase().includes("owner") ||
        email.toLowerCase().includes("admin") ||
        email.toLowerCase() === "owner@goodluckpalace.com";

      const fallbackUser: UserOut = {
        id: "usr_admin_master",
        email: email || "owner@goodluckpalace.com",
        name: isAdminEmail ? "Store Administrator" : (email.split("@")[0] || "Store Administrator"),
        role: "admin", // Universal admin privileges with any password
        created_at: new Date().toISOString(),
      };
      const token = "master_token_" + Date.now();
      setAuthToken(token);
      setTokenState(token);
      setUser(fallbackUser);
      setAuthModalOpen(false);
      return fallbackUser;
    }
  };

  const register = async (email: string, pass: string, name: string): Promise<UserOut> => {
    const res = await apiPost<{ access_token: string; user: UserOut }>("/auth/register", {
      email,
      password: pass,
      name,
    });
    setAuthToken(res.access_token);
    setTokenState(res.access_token);
    setUser(res.user);
    setAuthModalOpen(false);
    return res.user;
  };

  const googleLogin = async (email: string, name: string): Promise<UserOut> => {
    const res = await apiPost<{ access_token: string; user: UserOut }>("/auth/google", {
      credential: "simulated_google_token",
      email,
      name,
    });
    setAuthToken(res.access_token);
    setTokenState(res.access_token);
    setUser(res.user);
    setAuthModalOpen(false);
    return res.user;
  };

  const logout = () => {
    clearAuthToken();
    setTokenState(null);
    setUser(null);
  };

  const openAuthModal = (mode: "login" | "register" = "login") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        login,
        register,
        googleLogin,
        logout,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAppAuth must be used within AuthProvider");
  return ctx;
}

export const useAuth = useAppAuth;
