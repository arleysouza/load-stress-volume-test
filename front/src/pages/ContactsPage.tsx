import { useEffect, useState } from "react";
import styled from "styled-components";
import useContacts from "../contexts/useContacts";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Form = styled.form`
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
  flex-wrap: wrap;

  input {
    padding: 0.5rem 0.75rem;
    border: 1px solid #ddd;
    border-radius: ${({ theme }) => theme.borderRadius};
  }

  button {
    padding: 0.5rem 0.75rem;
    background: ${({ theme }) => theme.colors.primary};
    color: #fff;
    border: none;
    border-radius: ${({ theme }) => theme.borderRadius};
    cursor: pointer;
  }
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Item = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #fff;
  border: 1px solid #eee;
  border-radius: ${({ theme }) => theme.borderRadius};

  small {
    color: #777;
  }

  button {
    padding: 0.4rem 0.6rem;
    background: #e74c3c;
    color: #fff;
    border: none;
    border-radius: ${({ theme }) => theme.borderRadius};
    cursor: pointer;
  }
`;

const Error = styled.div`
  color: #e74c3c;
  background: #fdecea;
  border: 1px solid #fadbd8;
  padding: 0.5rem 0.75rem;
  border-radius: ${({ theme }) => theme.borderRadius};
`;

const ContactsPage = () => {
  const {
    contacts,
    loading,
    error,
    listContacts,
    createContact,
    deleteContact,
    clearError,
  } = useContacts();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    listContacts();
  }, [listContacts]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    await createContact(name, phone);
    setName("");
    setPhone("");
  };

  return (
    <Wrapper>
      <h2 data-testid="contacts-title">Contatos</h2>
      {error && (
        <Error data-testid="contacts-error" onClick={clearError} role="alert">
          {error}
        </Error>
      )}
      <Form onSubmit={onSubmit} data-testid="contacts-form">
        <div>
          <label htmlFor="name">Nome</label>
          <br />
          <input
            id="name"
            placeholder="Ex.: João da Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={3}
            data-testid="contacts-name"
          />
        </div>
        <div>
          <label htmlFor="phone">Telefone</label>
          <br />
          <input
            id="phone"
            placeholder="Ex.: 5512999999999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            minLength={6}
            data-testid="contacts-phone"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            data-testid="contacts-submit"
          >
            {loading ? "Salvando..." : "Adicionar"}
          </button>
        </div>
      </Form>

      <List data-testid="contacts-list">
        {contacts.map((c) => (
          <Item key={c.id} data-testid="contacts-item">
            <div>
              <strong>{c.name}</strong>
              <br />
              <small>{c.phone}</small>
            </div>
            <button
              onClick={() => deleteContact(c.id)}
              disabled={loading}
              data-testid={`contacts-delete-${c.id}`}
            >
              Remover
            </button>
          </Item>
        ))}
        {!loading && contacts.length === 0 && <p>Nenhum contato cadastrado.</p>}
        {loading && <p>Carregando...</p>}
      </List>
    </Wrapper>
  );
};

export default ContactsPage;
