import { create } from "zustand";
import { Contact } from "../types/contact";

type ContactsStore = {
  contacts: Contact[];
  loading: boolean;
  error: string;
  deleteId: string | null;
  updateId: string | null;
  selectedContactId: string | null;
  setContacts: (contacts: Contact[]) => void;
  setLoading: (v: boolean) => void;
  setError: (msg: string) => void;
  setDeleteId: (id: string | null) => void;
  setUpdateId: (id: string | null) => void;
  setSelectedContactId: (id: string | null) => void;
};

export const useContactsStore = create<ContactsStore>((set) => ({
  contacts: [],
  loading: false,
  error: "",
  deleteId: null,
  updateId: null,
  selectedContactId: null,
  setContacts: (contacts) => set({ contacts }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setDeleteId: (id) => set({ deleteId: id }),
  setUpdateId: (id) => set({ updateId: id }),
  setSelectedContactId: (id) => set({ selectedContactId: id }),
}));
