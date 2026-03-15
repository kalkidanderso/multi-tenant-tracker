"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { AuthUser } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check local storage for token on mount
    const checkAuth = async () => {
      try {
        if (typeof window !== "undefined" && localStorage.getItem("auth_token")) {
          const { user } = await api.get<{ user: AuthUser }>("/auth/me");
          setUser(user);
        }
      } catch (err) {
        console.error("Auth check failed", err);
        api.clearToken();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (token: string, user: AuthUser) => {
    api.setToken(token);
    setUser(user);
    router.push("/dashboard");
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
