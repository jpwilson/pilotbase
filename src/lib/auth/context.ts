"use client";

import { createContext, useContext } from "react";
import type { AuthUser } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
