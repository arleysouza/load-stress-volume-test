import { createContext, useState, useCallback } from "react";
import type { ReactNode } from "react";
import * as api from "../api/auth";
import type { Contact } from "../types/auth";
import useAuth from "./useAuth";

interface ContactsContextProps {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  listContacts: () => Promise<void>;
  createContact: (name: string, phone: string) => Promise<void>;
  deleteContact: (id: number) => Promise<void>;
  clearError: () => void;
}

const ContactsContext = createContext<ContactsContextProps | undefined>(
  undefined,
);

export const ContactsProvider = ({ children }: { children: ReactNode }) => {
  const { token, isAuthenticated } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const safeToken = useCallback(() => {
    if (!token || !isAuthenticated) throw new Error("Usuário não autenticado");
    return token;
  }, [token, isAuthenticated]);

  const handleList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listContacts(safeToken());
      if (res.success && res.data) {
        setContacts(res.data!.contacts);
      } else if (!res.success && res.error) {
        setError(res.error);
      }
    } catch {
      setError("Erro ao listar contatos");
    } finally {
      setLoading(false);
    }
  }, [safeToken]);

  const handleCreate = useCallback(
    async (name: string, phone: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.createContact(safeToken(), name, phone);
        if (res.success && res.data) {
          setContacts((prev) => [res.data!.contact, ...prev]);
        } else if (!res.success && res.error) {
          setError(res.error);
        }
      } catch {
        setError("Erro ao criar contato");
      } finally {
        setLoading(false);
      }
    },
    [safeToken],
  );

  const handleDelete = useCallback(
    async (id: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.deleteContact(safeToken(), id);
        if (res.success) {
          setContacts((prev) => prev.filter((c) => c.id !== id));
        } else if (!res.success && res.error) {
          setError(res.error);
        }
      } catch {
        setError("Erro ao remover contato");
      } finally {
        setLoading(false);
      }
    },
    [safeToken],
  );

  const clearError = () => setError(null);

  return (
    <ContactsContext.Provider
      value={{
        contacts,
        loading,
        error,
        listContacts: handleList,
        createContact: handleCreate,
        deleteContact: handleDelete,
        clearError,
      }}
    >
      {children}
    </ContactsContext.Provider>
  );
};

export default ContactsContext;
