import { useContext } from "react";
import ContactsContext from "./ContactsContext";

const useContacts = () => {
  const ctx = useContext(ContactsContext);
  if (!ctx)
    throw new Error("useContacts deve ser usado dentro de um ContactsProvider");
  return ctx;
};

export default useContacts;
