import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../../contexts/useAuth";
import AuthLayout from "../../layouts/AuthLayout";

const LoginPage = () => {
  const { login, error } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(username, password);
    if (result.success) navigate("/dashboard");
  };

  return (
    <AuthLayout>
      <h2 data-testid="login-title">Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          data-testid="login-username"
          placeholder="Usuário"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          data-testid="login-password"
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button data-testid="login-submit" type="submit">
          Entrar
        </button>
      </form>
      {error && (
        <p data-testid="login-error" style={{ color: "red" }}>
          {error}
        </p>
      )}
      <p>
        Não tem conta? <Link to="/register">Registrar</Link>
      </p>
    </AuthLayout>
  );
};

export default LoginPage;
