import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { jwtDecode } from "jwt-decode";
import type {
  AuthState,
  LoginCredentials,
  SignupCredentials,
} from "../types/auth";
import { apiService } from "../services/api";

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export context for useAuth hook
export { AuthContext };
export type { AuthContextType };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check if token is expired
  const isTokenExpired = useCallback((token: string): boolean => {
    try {
      const decoded = jwtDecode(token);
      if (!decoded.exp) return false;
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }, []);

  // Define logout first so it can be used in other functions
  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("auth_token");

      if (!token) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      if (isTokenExpired(token)) {
        localStorage.removeItem("auth_token");
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const user = await apiService.getCurrentUser();
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        console.error("Failed to fetch user:", error);
        localStorage.removeItem("auth_token");
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, [isTokenExpired]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const { user, token } = await apiService.login(credentials);
    localStorage.setItem("auth_token", token);
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    const { user, token } = await apiService.signup(credentials);
    localStorage.setItem("auth_token", token);
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const googleLogin = useCallback(async (credential: string) => {
    const { user, token } = await apiService.googleLogin(credential);
    localStorage.setItem("auth_token", token);
    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!state.token) return;

    try {
      const user = await apiService.getCurrentUser();
      setState((prev) => ({ ...prev, user }));
    } catch (error) {
      console.error("Failed to refresh user:", error);
      logout();
    }
  }, [state.token, logout]);

  const contextValue = useMemo(
    () => ({ ...state, login, signup, googleLogin, logout, refreshUser }),
    [state, login, signup, googleLogin, logout, refreshUser],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
