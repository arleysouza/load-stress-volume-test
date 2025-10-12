import { useState } from "react";
import useAuth from "../../contexts/useAuth";
import styled from "styled-components";

const Container = styled.div`
  max-width: 400px;
  margin: 80px auto;
  padding: 2rem;
  background: #fff;
  border-radius: ${({ theme }) => theme.borderRadius};
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ChangePasswordPage = () => {
  const { changePassword, error } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await changePassword(oldPassword, newPassword);
      setSuccess(true);
    } catch {
      setSuccess(false);
    }
  };

  return (
    <Container>
      <h2 data-testid="change-password-title">Alterar Senha</h2>
      <form onSubmit={handleSubmit}>
        <input
          data-testid="change-password-old"
          type="password"
          placeholder="Senha atual"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />
        <input
          data-testid="change-password-new"
          type="password"
          placeholder="Nova senha"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button data-testid="change-password-submit" type="submit">
          Alterar
        </button>
      </form>
      {error && (
        <p data-testid="change-password-error" style={{ color: "red" }}>
          {error}
        </p>
      )}
      {!error && success && (
        <p data-testid="change-password-success" style={{ color: "green" }}>
          Senha alterada com sucesso!
        </p>
      )}
    </Container>
  );
};

export default ChangePasswordPage;
