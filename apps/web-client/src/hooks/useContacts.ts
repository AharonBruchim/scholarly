import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useShallow } from "zustand/react/shallow";
import { FirestoreClient } from "../services/FirestoreClient";
import { Contact } from "../types/contact";
import { useContactsStore } from "../stores/contacts";

type Options = { autoFetch?: boolean };

export function useContacts({ autoFetch = true }: Options = {}) {
  const navigate = useNavigate();

  const {
    contacts,
    loading,
    error,
    deleteId,
    updateId,
    selectedContactId,
    setContacts,
    setLoading,
    setError,
    setDeleteId,
    setUpdateId,
    setSelectedContactId,
  } = useContactsStore(
    useShallow((s) => ({
      contacts: s.contacts,
      loading: s.loading,
      error: s.error,
      deleteId: s.deleteId,
      updateId: s.updateId,
      selectedContactId: s.selectedContactId,
      setContacts: s.setContacts,
      setLoading: s.setLoading,
      setError: s.setError,
      setDeleteId: s.setDeleteId,
      setUpdateId: s.setUpdateId,
      setSelectedContactId: s.setSelectedContactId,
    }))
  );

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await FirestoreClient.find<Contact>("contacts");
      setContacts(data);
    } catch {
      setError("שגיאה בטעינת אנשי קשר");
    } finally {
      setLoading(false);
    }
  }, [setContacts, setError, setLoading]);

  const updateContact = useCallback(
    async (id: string, name: string, email: string) => {
      setUpdateId(id);
      try {
        await FirestoreClient.updateOne("contacts", id, { name, email });
        toast.success(`${name} עודכן בהצלחה`);
        await fetchContacts();
      } catch {
        toast.error(`שגיאה בעדכון ${name}`);
      } finally {
        setUpdateId(null);
      }
    },
    [fetchContacts, setUpdateId]
  );

  const deleteContact = useCallback(
    async (id: string, name?: string) => {
      setDeleteId(id);
      try {
        await FirestoreClient.deleteOne("contacts", id);
        toast.success(`${name ?? "איש הקשר"} נמחק בהצלחה`);
        await fetchContacts();
      } catch {
        toast.error("שגיאה במחיקה");
      } finally {
        setDeleteId(null);
      }
    },
    [fetchContacts, setDeleteId]
  );

  const createContact = useCallback(
    async (name: string, email: string, opts?: { redirectTo?: string }) => {
      if (!name.trim()) {
        toast.error("נא להזין שם");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error(`${email} לא כתובת מייל תקינה`);
        return false;
      }

      try {
        setLoading(true);
        await FirestoreClient.insertOne<Contact>("contacts", { name, email });
        toast.success(`${name} נוסף בהצלחה`);
        await fetchContacts();
        if (opts?.redirectTo) navigate(opts.redirectTo);
        return true;
      } catch {
        toast.error(`שגיאה בהוספת ${name}`);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [fetchContacts, setLoading, navigate]
  );

  const sendMessage = useCallback(
    (name: string, email: string) => {
      navigate(
        `/requests?clientName=${encodeURIComponent(
          name
        )}&clientEmail=${encodeURIComponent(email)}`
      );
    },
    [navigate]
  );

  const selectContact = useCallback(
    (id: string | null) => setSelectedContactId(id),
    [setSelectedContactId]
  );

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedContactId) ?? null,
    [contacts, selectedContactId]
  );

  useEffect(() => {
    if (autoFetch) fetchContacts();
  }, [autoFetch, fetchContacts]);

  return {
    contacts,
    loading,
    error,
    deleteId,
    updateId,
    selectedContactId,
    selectedContact,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
    sendMessage,
    selectContact,
  };
}
