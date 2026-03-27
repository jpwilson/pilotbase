export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  operatorId: string;
  operatorName: string;
  permissions: string[];
  role: "scheduler" | "manager" | "admin";
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: number;
}

export interface AuthProvider {
  login(email: string, password: string): Promise<AuthSession>;
  logout(): Promise<void>;
  refresh(): Promise<AuthSession>;
  getSession(): AuthSession | null;
  getUser(): AuthUser | null;
}
