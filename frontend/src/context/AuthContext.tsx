import React, { createContext, useContext, useState, useCallback } from "react";
import { Role } from "../types";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role?: Role;
  company_id?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseStoredUser = (value: string | null): AuthUser | null => {
  if (!value || value === "undefined" || value === "null") {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<AuthUser>;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.id === "number" &&
      typeof parsed.email === "string"
    ) {
      return parsed as AuthUser;
    }
  } catch {
    return null;
  }

  return null;
};

const normalizeUserFromLoginResponse = (payload: unknown): AuthUser | null => {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const data = payload as Record<string, unknown>;
  const nested =
    (typeof data.data === "object" && data.data !== null
      ? (data.data as Record<string, unknown>)
      : null) ||
    (typeof data.user === "object" && data.user !== null
      ? (data.user as Record<string, unknown>)
      : null);

  const source = nested || data;

  const id = source.id;
  const email = source.email;
  if (typeof id !== "number" || typeof email !== "string") {
    return null;
  }

  const fullName =
    typeof source.full_name === "string"
      ? source.full_name
      : typeof source.fullName === "string"
      ? source.fullName
      : "";

  const username =
    typeof source.username === "string"
      ? source.username
      : email.split("@")[0] || email;

  const role =
    typeof source.role === "string"
      ? (source.role.toUpperCase() as Role)
      : undefined;

  return {
    id,
    email,
    full_name: fullName,
    username,
    role,
    company_id:
      typeof source.company_id === "number" ? source.company_id : undefined,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    // Load user from localStorage on mount
    const stored = localStorage.getItem("user");
    const parsedUser = parseStoredUser(stored);

    if (!parsedUser && stored) {
      localStorage.removeItem("user");
    }

    return parsedUser;
  });
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      // In a real app, this would call your backend API
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await response.json();
      const normalizedUser = normalizeUserFromLoginResponse(data);

      if (normalizedUser) {
        setUser(normalizedUser);
        localStorage.setItem("user", JSON.stringify(normalizedUser));
      } else {
        setUser(null);
        localStorage.removeItem("user");
      }

      localStorage.setItem(
        "token",
        typeof data.token === "string" ? data.token : ""
      );
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
