import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import * as authApi from "../api/auth";
import type { User, Login, Register, Logout } from "../types/auth";

interface AuthContextProps {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<Login>;
  register: (username: string, password: string) => Promise<Register>;
  logout: () => Promise<Logout | void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Carregar token e usuário do localStorage ao iniciar
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken) setToken(storedToken);
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Persistir no localStorage quando mudar
  useEffect(() => {
    if (token && user) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }, [token, user]);

  const handleLogin = async (
    username: string,
    password: string,
  ): Promise<Login> => {
    setError(null); // limpa erro antigo
    const response = await authApi.login(username, password);
    if (response.success && response.data) {
      setToken(response.data.token);
      setUser(response.data.user);
    } else if (response.error) {
      setError(response.error);
      console.log("error:", response.error);
    }
    return response;
  };

  const handleRegister = async (
    username: string,
    password: string,
  ): Promise<Register> => {
    setError(null);
    const response = await authApi.register(username, password);
    if (!response.success && response.error) {
      setError(response.error);
      console.log("error:", response.error);
    }
    return response;
  };

  const handleLogout = async (): Promise<Logout | void> => {
    setError(null);
    if (!token) return;
    try {
      const response = await authApi.logout(token);
      setToken(null);
      setUser(null);
      localStorage.clear();
      return response;
    } catch {
      setError("Erro ao deslogar");
      console.log("error: Erro ao deslogar");
    }
  };

  const handleChangePassword = async (
    oldPassword: string,
    newPassword: string,
  ): Promise<void> => {
    setError(null);
    if (!token) throw new Error("Usuário não autenticado");
    try {
      const response = await authApi.changePassword(
        token,
        oldPassword,
        newPassword,
      );
      if (!response.success && response.error) {
        setError(response.error);
        console.log("error:", response.error);
      }
    } catch {
      setError("Erro ao alterar a senha");
      console.log("error: rro ao alterar a senha");
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        error,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        changePassword: handleChangePassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
