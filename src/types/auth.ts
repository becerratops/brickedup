export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  name: string;
  teamId: string;
  createdAt: string;
  lastLoginAt: string;
  isAdmin?: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupData {
  username: string;
  password: string;
  name: string;
  email?: string;
  teamId: string;
}

export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}